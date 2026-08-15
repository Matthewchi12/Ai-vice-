import express from "express";
import cors from "cors";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const app = express();


// ======================================
// MIDDLEWARE
// ======================================

app.use(cors());

app.use(express.json({
    limit: "2mb"
}));


// ======================================
// GEMINI
// ======================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ======================================
// SUPABASE ADMIN CLIENT
// ======================================

const supabaseAdmin =
    createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );


// ======================================
// PAYSTACK
// ======================================

const PAYSTACK_SECRET_KEY =
    process.env.PAYSTACK_SECRET_KEY;


// ======================================
// CREATE WAV FILE FROM PCM
// ======================================

function createWav(
    pcmData,
    sampleRate = 24000
) {

    const numChannels = 1;
    const bitsPerSample = 16;

    const byteRate =
        sampleRate *
        numChannels *
        bitsPerSample / 8;

    const blockAlign =
        numChannels *
        bitsPerSample / 8;

    const buffer =
        Buffer.alloc(
            44 + pcmData.length
        );


    buffer.write(
        "RIFF",
        0
    );

    buffer.writeUInt32LE(
        36 + pcmData.length,
        4
    );

    buffer.write(
        "WAVE",
        8
    );


    buffer.write(
        "fmt ",
        12
    );

    buffer.writeUInt32LE(
        16,
        16
    );

    buffer.writeUInt16LE(
        1,
        20
    );

    buffer.writeUInt16LE(
        numChannels,
        22
    );

    buffer.writeUInt32LE(
        sampleRate,
        24
    );

    buffer.writeUInt32LE(
        byteRate,
        28
    );

    buffer.writeUInt16LE(
        blockAlign,
        32
    );

    buffer.writeUInt16LE(
        bitsPerSample,
        34
    );


    buffer.write(
        "data",
        36
    );

    buffer.writeUInt32LE(
        pcmData.length,
        40
    );


    pcmData.copy(
        buffer,
        44
    );


    return buffer;
}


// ======================================
// GET USER FROM SUPABASE ACCESS TOKEN
// ======================================

async function getAuthenticatedUser(req) {

    const authHeader =
        req.headers.authorization;


    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {

        return null;

    }


    const token =
        authHeader.replace(
            "Bearer ",
            ""
        );


    const {
        data,
        error
    } =
        await supabaseAdmin.auth.getUser(
            token
        );


    if (error) {

        console.error(
            "Auth error:",
            error.message
        );

        return null;

    }


    return data.user || null;
}


// ======================================
// HEALTH CHECK
// ======================================

app.get(
    "/",
    (req, res) => {

        res.json({

            status: "online",

            message:
                "Voice Over Studio backend is working"

        });

    }
);


// ======================================
// TEST TTS ROUTE
// ======================================

app.get(
    "/tts",
    (req, res) => {

        res.json({

            message:
                "TTS endpoint is online. Send a POST request to /tts."

        });

    }
);


// ======================================
// GET SUBSCRIPTION
// ======================================

app.get(
    "/subscription",
    async (req, res) => {

        try {

            const user =
                await getAuthenticatedUser(req);


            if (!user) {

                return res.status(401).json({

                    error:
                        "You must be logged in."

                });

            }


            const {
                data,
                error
            } =
                await supabaseAdmin
                    .from("user_subscriptions")
                    .select("*")
                    .eq(
                        "user_id",
                        user.id
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "Subscription lookup error:",
                    error
                );

                return res.status(500).json({

                    error:
                        "Unable to check subscription."

                });

            }


            // No subscription row yet
            if (!data) {

                return res.json({

                    active: false,

                    free_uses: 0,

                    plan: null,

                    status: "inactive"

                });

            }


            const active =
                data.status === "active";


            res.json({

                active: active,

                free_uses:
                    data.free_uses || 0,

                plan:
                    data.plan || null,

                status:
                    data.status || "inactive"

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                error:
                    "Subscription check failed."

            });

        }

    }
);


// ======================================
// VERIFY PAYSTACK PAYMENT
// ======================================

app.post(
    "/verify-payment",
    async (req, res) => {

        try {

            const user =
                await getAuthenticatedUser(req);


            if (!user) {

                return res.status(401).json({

                    error:
                        "You must be logged in."

                });

            }


            const {
                reference,
                plan
            } = req.body;


            if (!reference) {

                return res.status(400).json({

                    error:
                        "Payment reference is required."

                });

            }


            // ----------------------------------
            // VERIFY WITH PAYSTACK
            // ----------------------------------

            const response =
                await fetch(
                    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
                    {

                        method: "GET",

                        headers: {

                            Authorization:
                                `Bearer ${PAYSTACK_SECRET_KEY}`,

                            "Content-Type":
                                "application/json"

                        }

                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.status ||
                result.data?.status !== "success"
            ) {

                return res.status(400).json({

                    error:
                        "Payment could not be verified."

                });

            }


            // ----------------------------------
            // MAKE SURE PAYMENT EMAIL MATCHES
            // ----------------------------------

            const paidEmail =
                result.data?.customer?.email;


            if (
                paidEmail &&
                paidEmail.toLowerCase() !==
                user.email.toLowerCase()
            ) {

                return res.status(403).json({

                    error:
                        "Payment email does not match your account."

                });

            }


            // ----------------------------------
            // SAVE SUBSCRIPTION
            // ----------------------------------

            const {
                error: saveError
            } =
                await supabaseAdmin
                    .from("user_subscriptions")
                    .upsert({

                        user_id:
                            user.id,

                        plan:
                            plan || "standard",

                        status:
                            "active",

                        paystack_customer_code:
                            result.data?.customer?.customer_code || null,

                        paid_at:
                            new Date().toISOString(),

                        updated_at:
                            new Date().toISOString()

                    }, {

                        onConflict:
                            "user_id"

                    });


            if (saveError) {

                console.error(
                    "Save subscription error:",
                    saveError
                );

                return res.status(500).json({

                    error:
                        "Payment succeeded but subscription could not be saved."

                });

            }


            res.json({

                success: true,

                active: true,

                plan:
                    plan || "standard"

            });

        }

        catch (error) {

            console.error(
                "Payment verification error:",
                error
            );

            res.status(500).json({

                error:
                    "Payment verification failed."

            });

        }

    }
);


// ======================================
// TEXT TO SPEECH
// ======================================

app.post(
    "/tts",
    async (req, res) => {

        try {

            // ----------------------------------
            // AUTHENTICATE USER
            // ----------------------------------

            const user =
                await getAuthenticatedUser(req);


            if (!user) {

                return res.status(401).json({

                    error:
                        "Please login first."

                });

            }


            // ----------------------------------
            // GET SUBSCRIPTION
            // ----------------------------------

            const {
                data: subscription,
                error: subscriptionError
            } =
                await supabaseAdmin
                    .from("user_subscriptions")
                    .select("*")
                    .eq(
                        "user_id",
                        user.id
                    )
                    .maybeSingle();


            if (subscriptionError) {

                console.error(
                    subscriptionError
                );

                return res.status(500).json({

                    error:
                        "Unable to check account."

                });

            }


            // ----------------------------------
            // CHECK FREE USES / SUBSCRIPTION
            // ----------------------------------

            let account =
                subscription;


            // Create account row if it doesn't exist
            if (!account) {

                const {
                    data: newAccount,
                    error: createError
                } =
                    await supabaseAdmin
                        .from("user_subscriptions")
                        .insert({

                            user_id:
                                user.id,

                            status:
                                "inactive",

                            free_uses:
                                0

                        })
                        .select()
                        .single();


                if (createError) {

                    console.error(
                        createError
                    );

                    return res.status(500).json({

                        error:
                            "Unable to create account."

                    });

                }


                account =
                    newAccount;

            }


            const isSubscribed =
                account.status === "active";


            const freeUses =
                account.free_uses || 0;


            // ----------------------------------
            // ALLOW 5 FREE GENERATIONS
            // ----------------------------------

            if (
                !isSubscribed &&
                freeUses >= 5
            ) {

                return res.status(402).json({

                    error:
                        "Your 5 free voice generations have been used. Please subscribe to continue.",

                    subscriptionRequired:
                        true,

                    free_uses:
                        freeUses

                });

            }


            // ----------------------------------
            // GET TEXT
            // ----------------------------------

            const {
                text,
                voice
            } = req.body;


            if (
                !text ||
                !text.trim()
            ) {

                return res.status(400).json({

                    error:
                        "Text is required."

                });

            }


            console.log(
                "Generating voice for:",
                user.email
            );

            console.log(
                "Voice:",
                voice || "Kore"
            );


            // ----------------------------------
            // GEMINI TTS
            // ----------------------------------

            const response =
                await ai.models.generateContent({

                    model:
                        "gemini-2.5-flash-preview-tts",

                    contents: [

                        {

                            parts: [

                                {

                                    text:
                                        text.trim()

                                }

                            ]

                        }

                    ],

                    config: {

                        responseModalities: [
                            "AUDIO"
                        ],

                        speechConfig: {

                            voiceConfig: {

                                prebuiltVoiceConfig: {

                                    voiceName:
                                        voice || "Kore"

                                }

                            }

                        }

                    }

                });


            // ----------------------------------
            // FIND AUDIO
            // ----------------------------------

            const audioPart =
                response
                    ?.candidates?.[0]
                    ?.content?.parts
                    ?.find(
                        part =>
                            part.inlineData &&
                            part.inlineData.data
                    );


            if (!audioPart) {

                return res.status(500).json({

                    error:
                        "Gemini did not return audio."

                });

            }


            // ----------------------------------
            // BASE64 → PCM
            // ----------------------------------

            const pcm =
                Buffer.from(
                    audioPart.inlineData.data,
                    "base64"
                );


            if (!pcm.length) {

                return res.status(500).json({

                    error:
                        "Gemini returned empty audio."

                });

            }


            // ----------------------------------
            // COUNT FREE USE
            // ----------------------------------

            if (!isSubscribed) {

                const newFreeUses =
                    freeUses + 1;


                await supabaseAdmin
                    .from("user_subscriptions")
                    .update({

                        free_uses:
                            newFreeUses,

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq(
                        "user_id",
                        user.id
                    );


                console.log(
                    "Free use:",
                    newFreeUses,
                    "/ 5"
                );

            }


            // ----------------------------------
            // PCM → WAV
            // ----------------------------------

            const wav =
                createWav(
                    pcm,
                    24000
                );


            // ----------------------------------
            // SEND AUDIO
            // ----------------------------------

            res.status(200);

            res.setHeader(
                "Content-Type",
                "audio/wav"
            );

            res.setHeader(
                "Content-Length",
                wav.length
            );

            res.setHeader(
                "Content-Disposition",
                'inline; filename="voice-over.wav"'
            );


            res.send(
                wav
            );

        }

        catch (error) {

            console.error(
                "===================="
            );

            console.error(
                "TTS ERROR"
            );

            console.error(
                error
            );

            console.error(
                "===================="
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Voice generation failed."

            });

        }

    }
);


// ======================================
// START SERVER
// ======================================

const PORT =
    process.env.PORT || 10000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);

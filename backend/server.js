 import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const app = express();


// ======================================
// ENVIRONMENT VARIABLES
// ======================================

const PORT = process.env.PORT || 10000;

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SECRET_KEY =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAYSTACK_SECRET_KEY =
    process.env.PAYSTACK_SECRET_KEY;


// ======================================
// CHECK ENVIRONMENT VARIABLES
// ======================================

const missing = [];

if (!GEMINI_API_KEY) {
    missing.push("GEMINI_API_KEY");
}

if (!SUPABASE_URL) {
    missing.push("SUPABASE_URL");
}

if (!SUPABASE_SECRET_KEY) {
    missing.push(
        "SUPABASE_SECRET_KEY"
    );
}

if (!PAYSTACK_SECRET_KEY) {
    missing.push(
        "PAYSTACK_SECRET_KEY"
    );
}

if (missing.length > 0) {

    console.error(
        "Missing environment variables:"
    );

    console.error(
        missing.join(", ")
    );

    process.exit(1);
}


// ======================================
// CHECK SUPABASE KEY
// ======================================

if (
    SUPABASE_SECRET_KEY.startsWith(
        "sb_publishable_"
    ) ||
    SUPABASE_SECRET_KEY.startsWith(
        "sb_anon_"
    )
) {

    console.error(
        "ERROR: You placed a publishable/anon key in the backend."
    );

    console.error(
        "Use the Supabase SECRET key (sb_secret_...) or legacy service_role key."
    );

    process.exit(1);
}


// ======================================
// MIDDLEWARE
// ======================================

app.use(
    cors({
        origin: "*",
        methods: [
            "GET",
            "POST",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);


// ======================================
// GEMINI
// ======================================

const ai =
    new GoogleGenAI({
        apiKey:
            GEMINI_API_KEY
    });


// ======================================
// SUPABASE ADMIN CLIENT
// ======================================

const supabaseAdmin =
    createClient(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
            }
        }
    );


// ======================================
// CREATE WAV FILE
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
        bitsPerSample /
        8;

    const blockAlign =
        numChannels *
        bitsPerSample /
        8;

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
// AUTHENTICATED USER
// ======================================

async function getAuthenticatedUser(
    req
) {

    const authorization =
        req.headers.authorization;

    if (
        !authorization ||
        !authorization.startsWith(
            "Bearer "
        )
    ) {

        return null;
    }

    const token =
        authorization
            .slice(7)
            .trim();

    if (!token) {
        return null;
    }

    try {

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

        return data?.user || null;

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        return null;
    }
}


// ======================================
// GET OR CREATE SUBSCRIPTION
// ======================================

async function getUserSubscription(
    userId
) {

    const {
        data,
        error
    } =
        await supabaseAdmin
            .from(
                "user_subscriptions"
            )
            .select("*")
            .eq(
                "user_id",
                userId
            )
            .maybeSingle();

    if (error) {

        throw error;
    }

    if (data) {

        return data;
    }


    const {
        data: created,
        error: insertError
    } =
        await supabaseAdmin
            .from(
                "user_subscriptions"
            )
            .insert({
                user_id:
                    userId,

                status:
                    "inactive",

                free_uses:
                    0
            })
            .select()
            .single();

    if (insertError) {

        throw insertError;
    }

    return created;
}


// ======================================
// HEALTH CHECK
// ======================================

app.get(
    "/",
    (req, res) => {

        res.json({
            status:
                "online",

            message:
                "Voice Over Studio backend is working"
        });

    }
);


// ======================================
// TTS GET TEST
// ======================================

app.get(
    "/tts",
    (req, res) => {

        res.json({
            status:
                "online",

            message:
                "TTS endpoint is online. Send POST request to /tts."
        });

    }
);


// ======================================
// SUBSCRIPTION
// ======================================

app.get(
    "/subscription",
    async (req, res) => {

        try {

            const user =
                await getAuthenticatedUser(
                    req
                );

            if (!user) {

                return res
                    .status(401)
                    .json({
                        error:
                            "You must be logged in."
                    });
            }

            const subscription =
                await getUserSubscription(
                    user.id
                );

            return res.json({

                active:
                    subscription.status ===
                    "active",

                free_uses:
                    Number(
                        subscription.free_uses || 0
                    ),

                plan:
                    subscription.plan ||
                    null,

                status:
                    subscription.status ||
                    "inactive"

            });

        } catch (error) {

            console.error(
                "Subscription error:",
                error
            );

            return res
                .status(500)
                .json({

                    error:
                        error?.message ||
                        "Unable to check subscription."

                });
        }
    }
);


// ======================================
// VERIFY PAYSTACK
// ======================================

app.post(
    "/verify-payment",
    async (req, res) => {

        try {

            const user =
                await getAuthenticatedUser(
                    req
                );

            if (!user) {

                return res
                    .status(401)
                    .json({
                        error:
                            "You must be logged in."
                    });
            }


            const {
                reference,
                plan
            } = req.body;


            if (!reference) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Payment reference is required."
                    });
            }


            console.log(
                "Checking Paystack:",
                reference
            );


            const response =
                await fetch(
                    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
                    {
                        method:
                            "GET",

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
                result.data?.status !==
                    "success"
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Payment could not be verified."
                    });
            }


            // ==================================
            // CHECK EMAIL
            // ==================================

            const paidEmail =
                result.data
                    ?.customer
                    ?.email;


            if (
                paidEmail &&
                user.email &&
                paidEmail.toLowerCase() !==
                    user.email.toLowerCase()
            ) {

                return res
                    .status(403)
                    .json({
                        error:
                            "Payment email does not match your account."
                    });
            }


            // ==================================
            // GET CURRENT ACCOUNT
            // ==================================

            const {
                data: existing,
                error: existingError
            } =
                await supabaseAdmin
                    .from(
                        "user_subscriptions"
                    )
                    .select("*")
                    .eq(
                        "user_id",
                        user.id
                    )
                    .maybeSingle();


            if (existingError) {

                throw existingError;
            }


            // ==================================
            // SAVE PAYMENT
            // ==================================

            let saved;


            if (existing) {

                const {
                    data,
                    error
                } =
                    await supabaseAdmin
                        .from(
                            "user_subscriptions"
                        )
                        .update({

                            plan:
                                plan ||
                                "standard",

                            status:
                                "active",

                            paystack_customer_code:
                                result.data
                                    ?.customer
                                    ?.customer_code ||
                                null,

                            paid_at:
                                new Date()
                                    .toISOString(),

                            updated_at:
                                new Date()
                                    .toISOString()

                        })
                        .eq(
                            "user_id",
                            user.id
                        )
                        .select()
                        .single();


                if (error) {

                    throw error;
                }

                saved =
                    data;

            } else {

                const {
                    data,
                    error
                } =
                    await supabaseAdmin
                        .from(
                            "user_subscriptions"
                        )
                        .insert({

                            user_id:
                                user.id,

                            plan:
                                plan ||
                                "standard",

                            status:
                                "active",

                            free_uses:
                                0,

                            paystack_customer_code:
                                result.data
                                    ?.customer
                                    ?.customer_code ||
                                null,

                            paid_at:
                                new Date()
                                    .toISOString(),

                            updated_at:
                                new Date()
                                    .toISOString()

                        })
                        .select()
                        .single();


                if (error) {

                    throw error;
                }

                saved =
                    data;
            }


            return res.json({

                success:
                    true,

                active:
                    true,

                plan:
                    saved.plan,

                free_uses:
                    Number(
                        saved.free_uses || 0
                    )

            });


        } catch (error) {

            console.error(
                "Payment verification error:",
                error
            );

            return res
                .status(500)
                .json({

                    error:
                        error?.message ||
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

            // ==================================
            // LOGIN CHECK
            // ==================================

            const user =
                await getAuthenticatedUser(
                    req
                );

            if (!user) {

                return res
                    .status(401)
                    .json({
                        error:
                            "Please login first."
                    });
            }


            // ==================================
            // ACCOUNT
            // ==================================

            const account =
                await getUserSubscription(
                    user.id
                );


            const subscribed =
                account.status ===
                "active";


            const freeUses =
                Number(
                    account.free_uses || 0
                );


            // ==================================
            // FREE LIMIT
            // ==================================

            if (
                !subscribed &&
                freeUses >= 5
            ) {

                return res
                    .status(402)
                    .json({

                        error:
                            "Your 5 free voice generations have been used. Please subscribe to continue.",

                        subscriptionRequired:
                            true,

                        free_uses:
                            freeUses

                    });
            }


            // ==================================
            // REQUEST
            // ==================================

            const {
                text,
                voice
            } = req.body;


            if (
                typeof text !==
                    "string" ||
                !text.trim()
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Text is required."
                    });
            }


            const selectedVoice =
                voice ||
                "Kore";


            console.log(
                "Generating:",
                user.email
            );

            console.log(
                "Voice:",
                selectedVoice
            );


            // ==================================
            // GEMINI TTS
            // ==================================

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
                                        selectedVoice

                                }

                            }

                        }

                    }

                });


            // ==================================
            // AUDIO
            // ==================================

            const audioPart =
                response
                    ?.candidates?.[0]
                    ?.content?.parts
                    ?.find(
                        part =>
                            part.inlineData
                                ?.data
                    );


            if (!audioPart) {

                return res
                    .status(500)
                    .json({
                        error:
                            "Gemini did not return audio."
                    });
            }


            const pcm =
                Buffer.from(
                    audioPart
                        .inlineData
                        .data,
                    "base64"
                );


            if (!pcm.length) {

                return res
                    .status(500)
                    .json({
                        error:
                            "Gemini returned empty audio."
                    });
            }


            // ==================================
            // COUNT FREE USE
            // ==================================

            if (!subscribed) {

                const newUses =
                    freeUses + 1;


                const {
                    error
                } =
                    await supabaseAdmin
                        .from(
                            "user_subscriptions"
                        )
                        .update({

                            free_uses:
                                newUses,

                            updated_at:
                                new Date()
                                    .toISOString()

                        })
                        .eq(
                            "user_id",
                            user.id
                        );


                if (error) {

                    console.error(
                        "Free-use update error:",
                        error
                    );

                }

                console.log(
                    `Free uses: ${newUses}/5`
                );
            }


            // ==================================
            // WAV
            // ==================================

            const wav =
                createWav(
                    pcm,
                    24000
                );


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


            return res.send(
                wav
            );


        } catch (error) {

            console.error(
                "TTS ERROR:"
            );

            console.error(
                error
            );

            return res
                .status(500)
                .json({

                    error:
                        error?.message ||
                        "Voice generation failed."

                });
        }
    }
);


// ======================================
// 404
// ======================================

app.use(
    (req, res) => {

        res
            .status(404)
            .json({

                error:
                    "Route not found",

                path:
                    req.path

            });
    }
);


// ======================================
// START SERVER
// ======================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Voice Over Studio backend running on port ${PORT}`
        );

        console.log(
            "Supabase URL configured:",
            Boolean(
                SUPABASE_URL
            )
        );

        console.log(
            "Supabase secret/service key configured:",
            Boolean(
                SUPABASE_SECRET_KEY
            )
        );

        console.log(
            "Paystack configured:",
            Boolean(
                PAYSTACK_SECRET_KEY
            )
        );

    }
);

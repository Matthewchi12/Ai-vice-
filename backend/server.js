import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const app = express();

// ======================================
// ENVIRONMENT VARIABLES
// ======================================

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

// ======================================
// CHECK REQUIRED VARIABLES
// ======================================

const missing = [];

if (!GEMINI_API_KEY) {
    missing.push("GEMINI_API_KEY");
}

if (!SUPABASE_URL) {
    missing.push("SUPABASE_URL");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
}

if (missing.length > 0) {
    console.error(
        "Missing environment variables:",
        missing.join(", ")
    );

    process.exit(1);
}

// ======================================
// MIDDLEWARE
// ======================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
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

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// ======================================
// SUPABASE
// ======================================

const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// ======================================
// CREATE WAV FILE
// ======================================

function createWav(pcmData, sampleRate = 24000) {
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

    const buffer = Buffer.alloc(
        44 + pcmData.length
    );

    buffer.write("RIFF", 0);

    buffer.writeUInt32LE(
        36 + pcmData.length,
        4
    );

    buffer.write("WAVE", 8);

    buffer.write("fmt ", 12);

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

    buffer.write("data", 36);

    buffer.writeUInt32LE(
        pcmData.length,
        40
    );

    pcmData.copy(buffer, 44);

    return buffer;
}

// ======================================
// GET AUTHENTICATED USER
// ======================================

async function getAuthenticatedUser(req) {
    const authorization =
        req.headers.authorization;

    if (
        !authorization ||
        !authorization.startsWith("Bearer ")
    ) {
        return null;
    }

    const token =
        authorization
            .substring(7)
            .trim();

    if (!token) {
        return null;
    }

    try {
        const {
            data,
            error
        } = await supabaseAdmin.auth.getUser(
            token
        );

        if (error) {
            console.error(
                "Supabase authentication error:",
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
// HEALTH CHECK
// ======================================

app.get("/", (req, res) => {
    res.status(200).json({
        status: "online",
        message:
            "Voice Over Studio API is working"
    });
});

// ======================================
// HEALTH CHECK
// ======================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

// ======================================
// TTS GET TEST
// ======================================

app.get("/tts", (req, res) => {
    res.status(200).json({
        status: "online",
        message:
            "TTS endpoint is working. Use POST /tts."
    });
});

// ======================================
// TEXT TO SPEECH
// ======================================

app.post("/tts", async (req, res) => {
    try {

        // ==================================
        // AUTHENTICATION
        // ==================================

        const user =
            await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                error:
                    "Please login first."
            });
        }

        // ==================================
        // REQUEST DATA
        // ==================================

        const {
            text,
            voice
        } = req.body;

        if (
            typeof text !== "string" ||
            !text.trim()
        ) {
            return res.status(400).json({
                error:
                    "Text is required."
            });
        }

        // ==================================
        // VOICE
        // ==================================

        const selectedVoice =
            voice || "Kore";

        console.log(
            "================================"
        );

        console.log(
            "TTS REQUEST"
        );

        console.log(
            "User:",
            user.email || user.id
        );

        console.log(
            "Voice:",
            selectedVoice
        );

        console.log(
            "Text length:",
            text.length
        );

        console.log(
            "================================"
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
        // FIND AUDIO
        // ==================================

        const audioPart =
            response
                ?.candidates?.[0]
                ?.content?.parts
                ?.find(
                    part =>
                        part?.inlineData?.data
                );

        if (!audioPart) {

            console.error(
                "Gemini response:",
                JSON.stringify(
                    response,
                    null,
                    2
                )
            );

            return res.status(500).json({
                error:
                    "Gemini did not return audio."
            });
        }

        // ==================================
        // BASE64 → PCM
        // ==================================

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

        // ==================================
        // PCM → WAV
        // ==================================

        const wav =
            createWav(
                pcm,
                24000
            );

        // ==================================
        // SEND AUDIO
        // ==================================

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

        return res.send(wav);

    } catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "GEMINI TTS ERROR"
        );

        console.error(error);

        console.error(
            "================================"
        );

        return res.status(500).json({
            error:
                error?.message ||
                "Voice generation failed."
        });
    }
});

// ======================================
// 404 HANDLER
// ======================================

app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.path
    });
});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({
            error:
                error?.message ||
                "Internal server error."
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
            "================================"
        );

        console.log(
            "Voice Over Studio API started"
        );

        console.log(
            `Port: ${PORT}`
        );

        console.log(
            "Host: 0.0.0.0"
        );

        console.log(
            "Gemini configured:",
            Boolean(GEMINI_API_KEY)
        );

        console.log(
            "Supabase configured:",
            Boolean(SUPABASE_URL)
        );

        console.log(
            "================================"
        );
    }
);

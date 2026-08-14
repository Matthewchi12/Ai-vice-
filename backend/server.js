 import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ======================================
// CREATE WAV HEADER
// ======================================

function createWav(pcmData, sampleRate = 24000) {

    const buffer =
        Buffer.alloc(44 + pcmData.length);

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
        1,
        22
    );

    buffer.writeUInt32LE(
        sampleRate,
        24
    );

    buffer.writeUInt32LE(
        sampleRate * 2,
        28
    );

    buffer.writeUInt16LE(
        2,
        32
    );

    buffer.writeUInt16LE(
        16,
        34
    );

    buffer.write("data", 36);

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
// TEST
// ======================================

app.get("/", (req, res) => {

    res.json({
        status: "online",
        message: "Voice Over Studio backend is working"
    });

});


// ======================================
// TEXT TO SPEECH
// ======================================

app.post("/tts", async (req, res) => {

    try {

        const {
            text,
            voice
        } = req.body;


        if (!text || !text.trim()) {

            return res.status(400).json({

                error:
                    "Text is required"

            });

        }


        console.log(
            "Generating voice..."
        );


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


        const audioPart =
            response
                .candidates?.[0]
                ?.content
                ?.parts
                ?.find(
                    part =>
                        part.inlineData
                );


        if (!audioPart) {

            console.log(
                "No audio returned"
            );

            return res.status(500).json({

                error:
                    "Gemini did not return audio"

            });

        }


        const pcm =
            Buffer.from(
                audioPart.inlineData.data,
                "base64"
            );


        const wav =
            createWav(
                pcm,
                24000
            );


        res.setHeader(
            "Content-Type",
            "audio/wav"
        );


        res.setHeader(
            "Content-Disposition",
            'attachment; filename="voice-over.wav"'
        );


        res.send(wav);

    }

    catch (error) {

        console.error(
            "TTS ERROR:",
            error
        );

        res.status(500).json({

            error:
                error.message ||
                "Voice generation failed"

        });

    }

});


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

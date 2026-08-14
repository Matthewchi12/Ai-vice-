import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
    res.json({
        message: "Voice Over Studio backend is working!"
    });
});

app.post("/tts", async (req, res) => {

    try {

        const { text, voice } = req.body;

        if (!text) {
            return res.status(400).json({
                error: "Text is required"
            });
        }

        const response =
            await ai.models.generateContent({

                model:
                    "gemini-2.5-flash-preview-tts",

                contents: [
                    {
                        parts: [
                            {
                                text: text
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

        const audio =
            response
                .candidates?.[0]
                ?.content
                ?.parts
                ?.find(
                    part => part.inlineData
                );

        if (!audio) {

            return res.status(500).json({
                error: "No audio returned"
            });

        }

        res.json({
            audio: audio.inlineData.data,
            mimeType:
                audio.inlineData.mimeType
        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Voice generation failed"
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

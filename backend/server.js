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
// CREATE WAV FILE FROM PCM
// ======================================

function createWav(pcmData, sampleRate = 24000) {

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
// TEXT TO SPEECH
// ======================================

app.post(
    "/tts",
    async (req, res) => {

        try {

            const {
                text,
                voice
            } = req.body;


            // ------------------------------
            // CHECK TEXT
            // ------------------------------

            if (
                !text ||
                !text.trim()
            ) {

                return res.status(400).json({

                    error:
                        "Text is required"

                });

            }


            console.log(
                "Generating voice..."
            );

            console.log(
                "Voice:",
                voice || "Kore"
            );


            // ------------------------------
            // GEMINI TTS
            // ------------------------------

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


            // ------------------------------
            // FIND AUDIO
            // ------------------------------

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


            // ------------------------------
            // BASE64 → PCM
            // ------------------------------

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


            console.log(
                "PCM bytes:",
                pcm.length
            );


            // ------------------------------
            // PCM → WAV
            // ------------------------------

            const wav =
                createWav(
                    pcm,
                    24000
                );


            // ------------------------------
            // SEND AUDIO
            // ------------------------------

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
                    "Voice generation failed"

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

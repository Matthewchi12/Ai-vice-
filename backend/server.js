import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";

const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const missing = [];
if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
if (!SUPABASE_URL) missing.push("SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (missing.length > 0) {
  console.error("Missing:", missing.join(", "));
  process.exit(1);
}

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "2mb" }));

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

function createWav(pcmData, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;

  const buffer = Buffer.alloc(44 + pcmData.length);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + pcmData.length, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(pcmData.length, 40);

  pcmData.copy(buffer, 44);

  return buffer;
}

/* NEW: Convert WAV buffer to real MP3 using FFmpeg */
function convertWavToMp3(wavBuffer) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",
      "-f", "mp3",
      "-codec:a", "libmp3lame",
      "-b:a", "192k",
      "pipe:1"
    ]);

    const chunks = [];
    const errors = [];

    ffmpeg.stdout.on("data", chunk => {
      chunks.push(chunk);
    });

    ffmpeg.stderr.on("data", chunk => {
      errors.push(chunk);
    });

    ffmpeg.on("error", error => {
      reject(new Error(
        "FFmpeg is not installed or could not be started: " + error.message
      ));
    });

    ffmpeg.on("close", code => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(
          "FFmpeg MP3 conversion failed: " +
          Buffer.concat(errors).toString()
        ));
      }
    });

    ffmpeg.stdin.write(wavBuffer);
    ffmpeg.stdin.end();
  });
}

async function getAuthenticatedUser(req) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.substring(7).trim();

  if (!token) return null;

  try {
    const { data, error } =
      await supabaseAdmin.auth.getUser(token);

    if (error) return null;

    return data?.user || null;
  } catch {
    return null;
  }
}

async function getUserProfile(userId) {
  let {
    data,
    error
  } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    const {
      data: newData,
      error: insErr
    } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        free_uses: 0,
        is_subscribed: false
      })
      .select()
      .single();

    if (insErr) throw insErr;

    return newData;
  }

  if (error) throw error;

  return data;
}

app.get("/", (req, res) =>
  res.json({
    status: "online",
    message: "Voice Over Studio API - 5 free as guest allowed"
  })
);

app.get("/health", (req, res) =>
  res.json({ status: "ok" })
);

app.get("/subscription", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.json({
        active: false,
        free_uses: 0,
        is_guest: true
      });
    }

    const profile = await getUserProfile(user.id);

    const isActive =
      profile.is_subscribed &&
      (
        !profile.subscription_expires_at ||
        new Date(profile.subscription_expires_at) > new Date()
      );

    res.json({
      active: isActive,
      free_uses: profile.free_uses || 0,
      expires_at: profile.subscription_expires_at
    });

  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        error: "Please login first."
      });
    }

    const { reference, plan } = req.body;

    if (!reference) {
      return res.status(400).json({
        error: "Reference required"
      });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const verifyData = await verifyRes.json();

    if (
      !verifyData.status ||
      verifyData.data.status !== "success"
    ) {
      return res.status(400).json({
        error: "Payment not successful"
      });
    }

    const expiresAt =
      new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          is_subscribed: true,
          subscription_plan: plan,
          subscription_expires_at: expiresAt,
          last_payment_ref: reference
        },
        {
          onConflict: "id"
        }
      );

    res.json({
      active: true,
      expires_at: expiresAt
    });

  } catch (e) {
    res.status(500).json({
      error: e.message
    });
  }
});

app.post("/tts", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    const { text, voice } = req.body;

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        error: "Text is required."
      });
    }

    if (user) {

      const profile =
        await getUserProfile(user.id);

      const isSubscribed =
        profile.is_subscribed &&
        (
          !profile.subscription_expires_at ||
          new Date(profile.subscription_expires_at) > new Date()
        );

      if (
        !isSubscribed &&
        (profile.free_uses || 0) >= 5
      ) {
        return res.status(402).json({
          error: "Free limit reached",
          free_uses: profile.free_uses
        });
      }

      const response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [
            {
              parts: [
                {
                  text: text.trim()
                }
              ]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || "Kore"
                }
              }
            }
          }
        });

      const audioPart =
        response?.candidates?.[0]?.content?.parts
          ?.find(p => p?.inlineData?.data);

      if (!audioPart) {
        return res.status(500).json({
          error: "No audio"
        });
      }

      const pcm =
        Buffer.from(
          audioPart.inlineData.data,
          "base64"
        );

      const wav = createWav(pcm, 24000);

      /* NEW: Convert generated WAV to real MP3 */
      const mp3 = await convertWavToMp3(wav);

      if (!isSubscribed) {
        await supabaseAdmin
          .from("profiles")
          .update({
            free_uses:
              (profile.free_uses || 0) + 1
          })
          .eq("id", user.id);
      }

      res.setHeader(
        "Content-Type",
        "audio/mpeg"
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="voice.mp3"'
      );

      return res.send(mp3);

    } else {

      // GUEST ALLOWED

      const response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [
            {
              parts: [
                {
                  text: text.trim()
                }
              ]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || "Kore"
                }
              }
            }
          }
        });

      const audioPart =
        response?.candidates?.[0]?.content?.parts
          ?.find(p => p?.inlineData?.data);

      if (!audioPart) {
        return res.status(500).json({
          error: "No audio"
        });
      }

      const pcm =
        Buffer.from(
          audioPart.inlineData.data,
          "base64"
        );

      const wav = createWav(pcm, 24000);

      /* NEW: Convert guest audio to real MP3 */
      const mp3 = await convertWavToMp3(wav);

      res.setHeader(
        "Content-Type",
        "audio/mpeg"
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="voice.mp3"'
      );

      return res.send(mp3);
    }

  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message
    });
  }
});

app.listen(
  PORT,
  "0.0.0.0",
  () =>
    console.log(
      `API running on ${PORT} - GUEST 5 FREE ENABLED - MP3 ENABLED`
    )
);

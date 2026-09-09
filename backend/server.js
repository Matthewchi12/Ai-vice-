import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

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
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"]
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

async function generateAudioWithRetry(text, voice) {
  let lastError;
  for (let i = 0; i < 3; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text.trim() }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" }
            }
          }
        }
      });
      return response;
    } catch (e) {
      lastError = e;
      const isOverloaded = e.status === 503 || e.message?.includes("503") || e.message?.includes("overloaded");
      if (isOverloaded && i < 2) {
        console.log(`Gemini 503 overloaded, retry ${i+1}/3...`);
        await new Promise(r => setTimeout(r, 2000 * (i+1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

async function getAuthenticatedUser(req) {
  const auth = req.headers.authorization;
  if (!auth ||!auth.startsWith("Bearer ")) return null;
  const token = auth.substring(7).trim();
  if (!token) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

async function getUserProfile(userId) {
  let { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
  if (error && error.code === "PGRST116") {
    const { data: newData, error: insErr } = await supabaseAdmin.from("profiles").insert({ id: userId, free_uses: 0, is_subscribed: false }).select().single();
    if (insErr) throw insErr;
    return newData;
  }
  if (error) throw error;
  return data;
}

app.get("/", (req, res) => res.json({ status: "online", message: "Voice Over Studio API - WAV ONLY" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/subscription", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.json({ active: false, free_uses: 0, is_guest: true });
    const profile = await getUserProfile(user.id);
    const isActive = profile.is_subscribed && (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());
    res.json({ active: isActive, free_uses: profile.free_uses || 0, expires_at: profile.subscription_expires_at });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Please login first." });
    const { reference, plan } = req.body;
    if (!reference) return res.status(400).json({ error: "Reference required" });
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
    const verifyData = await verifyRes.json();
    if (!verifyData.status || verifyData.data.status!== "success") return res.status(400).json({ error: "Payment not successful" });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("profiles").upsert({ id: user.id, is_subscribed: true, subscription_plan: plan, subscription_expires_at: expiresAt, last_payment_ref: reference }, { onConflict: "id" });
    res.json({ active: true, expires_at: expiresAt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/tts", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { text, voice } = req.body;
    if (typeof text!== "string" ||!text.trim()) return res.status(400).json({ error: "Text is required." });

    let profile = null;
    let isSubscribed = false;

    if (user) {
      profile = await getUserProfile(user.id);
      isSubscribed = profile.is_subscribed && (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());
      if (!isSubscribed && (profile.free_uses || 0) >= 5) {
        return res.status(402).json({ error: "Free limit reached", free_uses: profile.free_uses });
      }
    }

    const response = await generateAudioWithRetry(text, voice);
    const audioPart = response?.candidates?.[0]?.content?.parts?.find(p => p?.inlineData?.data);
    if (!audioPart) return res.status(500).json({ error: "No audio" });

    const pcm = Buffer.from(audioPart.inlineData.data, "base64");
    const wav = createWav(pcm, 24000);

    // ALWAYS RETURN WAV - MP3 BUTTON WILL ALSO DOWNLOAD WAV
    const finalBuffer = wav;
    const contentType = "audio/wav";
    const filename = "voice.wav";

    if (user && profile &&!isSubscribed) {
      await supabaseAdmin.from("profiles").update({ free_uses: (profile.free_uses || 0) + 1 }).eq("id", user.id);
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", finalBuffer.length);
    res.setHeader("Cache-Control", "no-cache");
    return res.send(finalBuffer);

  } catch (e) {
    console.error("TTS Error:", e);
    res.status(e.status || 500).json({ error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`API running on ${PORT} - WAV ONLY MODE`));

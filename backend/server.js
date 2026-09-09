app.post("/tts", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { text, voice } = req.body; // we ignore any format param, always wav
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

    // Generate audio
    const response = await generateAudioWithRetry(text, voice);
    const audioPart = response?.candidates?.[0]?.content?.parts?.find(p => p?.inlineData?.data);
    if (!audioPart) return res.status(500).json({ error: "No audio" });

    const pcm = Buffer.from(audioPart.inlineData.data, "base64");
    const wav = createWav(pcm, 24000);

    // --- FIX: ALWAYS RETURN WAV ---
    // No matter if user clicked MP3 or WAV button
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

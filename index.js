const FREE_GENERATIONS = 5;
const GUEST_KEY = "voiceover_guest_uses";
let guestUses = parseInt(localStorage.getItem(GUEST_KEY) || "0", 10) || 0;

// Keep the generated audio for direct download
let currentAudio = null;
let currentAudioURL = null;
let currentBlob = null;

const API_URL = "https://ai-voice-backend-pl9h.onrender.com/tts";

async function checkLogin() {
  const { data } = await supabase.auth.getSession();
  
  if (data.session) {
    // Logged in user - check backend count
    document.getElementById("app").style.display = "block";
    document.getElementById("authScreen").style.display = "none";
    return;
  }

  // Guest logic
  if (guestUses < FREE_GENERATIONS) {
    document.getElementById("app").style.display = "block";
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("freeText").textContent = `${FREE_GENERATIONS - guestUses} free left (Guest)`;
  } else {
    document.getElementById("app").style.display = "none";
    document.getElementById("authScreen").style.display = "flex";
    document.getElementById("authReason").innerHTML = "You've used 5 free. Please login.";
  }
}

async function generateAudio() {
  const textEl = document.getElementById("text");
  const statusEl = document.getElementById("status");
  const script = textEl.value.trim();
  
  if (!script) {
    statusEl.textContent = "Enter text";
    return null;
  }

  const { data } = await supabase.auth.getSession();

  // Guest limit check
  if (!data.session && guestUses >= FREE_GENERATIONS) {
    checkLogin();
    return null;
  }

  statusEl.textContent = "⏳ Generating...";

  try {
    const headers = { "Content-Type": "application/json" };
    if (data.session) {
      headers["Authorization"] = `Bearer ${data.session.access_token}`;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: script, voice: "Kore" })
    });

    // Free limit reached from backend
    if (res.status === 402) {
      statusEl.textContent = "Free limit reached. Please login.";
      checkLogin();
      return null;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Generation failed");
    }

    const blob = await res.blob(); // MP3 binary

    // Save for direct download - no re-generation needed
    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
    currentBlob = blob;
    currentAudioURL = URL.createObjectURL(blob);
    currentAudio = new Audio(currentAudioURL);

    // Count ONLY after success
    if (!data.session) {
      guestUses++;
      localStorage.setItem(GUEST_KEY, guestUses.toString());
    }

    statusEl.textContent = "✅ Generated! Click Download to save directly.";
    checkLogin(); // update UI
    return blob;

  } catch (e) {
    console.error(e);
    document.getElementById("status").textContent = "❌ " + e.message;
    return null;
  }
}

// Download directly - no second API call
function downloadMP3Direct() {
  if (!currentBlob) {
    alert("Generate first");
    return;
  }
  const url = URL.createObjectURL(currentBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "voice.mp3"; // backend returns MP3 directly now
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

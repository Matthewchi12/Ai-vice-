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
    document.getElementById("app").style.display = "block";
    document.getElementById("authScreen").style.display = "none";
    return;
  }

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

    if (res.status === 402) {
      statusEl.textContent = "Free limit reached. Please login.";
      checkLogin();
      return null;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Generation failed");
    }

    const blob = await res.blob(); // NOW WAV

    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
    currentBlob = blob;
    currentAudioURL = URL.createObjectURL(blob);
    currentAudio = new Audio(currentAudioURL);

    if (!data.session) {
      guestUses++;
      localStorage.setItem(GUEST_KEY, guestUses.toString());
    }

    statusEl.textContent = "✅ Generated! Click Download to save directly.";
    checkLogin();
    return blob;

  } catch (e) {
    console.error(e);
    document.getElementById("status").textContent = "❌ " + e.message;
    return null;
  }
}

// FAST - reuse same URL, no new createObjectURL
function downloadDirect(filename) {
  if (!currentBlob || !currentAudioURL) {
    alert("Generate first");
    return;
  }
  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// BOTH BUTTONS REMAIN - BOTH DOWNLOAD WAV
function downloadMP3Direct() {
  downloadDirect("voice.wav");
}

function downloadWAVDirect() {
  downloadDirect("voice.wav");
}

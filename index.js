const FREE_GENERATIONS = 5;
const GUEST_KEY = "voiceover_guest_uses";
let guestUses = parseInt(localStorage.getItem(GUEST_KEY) || "0", 10) || 0;

let currentAudio = null;
let currentAudioURL = null;
let currentBlob = null;

const API_URL = "https://ai-voice-backend-pl9h.onrender.com/tts";

// Use the same client you created in HTML
const sb = window.supabaseClient || window.supabase; 

async function checkLogin() {
  const { data } = await sb.auth.getSession();
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

  const { data } = await sb.auth.getSession();
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

    const blob = await res.blob(); // WAV from backend

    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    currentBlob = blob;
    currentAudioURL = URL.createObjectURL(blob);
    currentAudio = new Audio(currentAudioURL);

    if (!data.session) {
      guestUses++;
      localStorage.setItem(GUEST_KEY, guestUses.toString());
    }

    statusEl.textContent = "✅ Generated! Click Play or Download.";
    checkLogin();
    return true;

  } catch (e) {
    console.error(e);
    document.getElementById("status").textContent = "❌ " + e.message;
    return null;
  }
}

// --- PLAY CONTROLS FIXED ---
async function playAudio() {
  if (!currentAudio) {
    const ok = await generateAudio();
    if (!ok) return;
  }
  try {
    currentAudio.currentTime = 0;
    await currentAudio.play();
    document.getElementById("status").textContent = "▶️ Playing...";
  } catch (e) {
    document.getElementById("status").textContent = "❌ Can't play - click again";
  }
}
function pauseAudio() { if (currentAudio) currentAudio.pause(); }
function resumeAudio() { if (currentAudio) currentAudio.play(); }
function stopAudio() { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; } }

// --- FAST DOWNLOAD - REUSE URL ---
function downloadDirect(filename) {
  if (!currentBlob || !currentAudioURL) {
    alert("Generate first, then download");
    return;
  }
  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadMP3Direct() {
  downloadDirect("voice.wav"); // MP3 button kept, downloads WAV
}
function downloadWAVDirect() {
  downloadDirect("voice.wav");
}

// Wire buttons
document.getElementById("play")?.addEventListener("click", playAudio);
document.getElementById("pause")?.addEventListener("click", pauseAudio);
document.getElementById("resume")?.addEventListener("click", resumeAudio);
document.getElementById("stop")?.addEventListener("click", stopAudio);
document.getElementById("download")?.addEventListener("click", downloadWAVDirect);
document.getElementById("downloadMp3")?.addEventListener("click", downloadMP3Direct);

checkLogin();

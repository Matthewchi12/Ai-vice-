const FREE_GENERATIONS = 5;
const GUEST_KEY = "voiceover_guest_uses";
let guestUses = parseInt(localStorage.getItem(GUEST_KEY) || "0");

async function checkLogin() {
  if (guestUses < FREE_GENERATIONS) {
    // Allow explore without login!
    showAppAsGuest();
    return;
  }
  // Only after 5 uses, force login
  showLoginWithMessage("You've used 5 free. Please login.");
}

async function generateAudio() {
  const {data} = await supabase.auth.getSession();
  if (!data.session) {
    // GUEST - no auth header, count locally
    if (guestUses >= 5) { showLogin(); return null; }
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({text: script, voice})
    });
    guestUses++; localStorage.setItem(GUEST_KEY, guestUses);
    //... play audio
  } else {
    // LOGGED IN - with auth header
  }
}

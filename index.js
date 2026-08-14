const SUPABASE_URL = "https://ihoxjwqlvuskkqrfowbr.supabase.co";

const SUPABASE_KEY = "sb_publishable_TAesDbD1gUQ5p9IoYhZWJw_tBHL5g4F";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
signupButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        authStatus.textContent = "Please enter your email and password.";
        return;
    }

    if (password.length < 6) {
        authStatus.textContent = "Password must be at least 6 characters.";
        return;
    }

    authStatus.textContent = "Creating account...";

    const { error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        authStatus.textContent = error.message;
        return;
    }

    authStatus.textContent =
        "Account created! Check your email to confirm your account.";
});
loginButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        authStatus.textContent = "Please enter your email and password.";
        return;
    }

    authStatus.textContent = "Logging in...";

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        authStatus.textContent = error.message;
        return;
    }

    authStatus.textContent = "Login successful!";

    authScreen.style.display = "none";
    app.style.display = "block";
});

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const signupButton = document.getElementById("signupButton");

const authStatus = document.getElementById("authStatus");
const text = document.getElementById("text");
const voiceSelect = document.getElementById("voice");

const rate = document.getElementById("rate");
const pitch = document.getElementById("pitch");

const rateValue = document.getElementById("rateValue");
const pitchValue = document.getElementById("pitchValue");

const count = document.getElementById("count");
const status = document.getElementById("status");

const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const resumeButton = document.getElementById("resume");
const stopButton = document.getElementById("stop");
const downloadButton = document.getElementById("download");


// ======================================
// YOUR RENDER BACKEND
// ======================================

const API_URL =
    "https://ai-voice-backend-pl9h.onrender.com/tts";


// ======================================
// GEMINI VOICES
// ======================================

const voiceList = {

    ukMale: "Charon",

    ukFemale: "Aoede",

    usMale: "Puck",

    usFemale: "Kore"

};


// ======================================
// CREATE VOICE OPTIONS
// ======================================

voiceSelect.innerHTML = "";

const options = [
    ["ukMale", "🇬🇧 UK Man"],
    ["ukFemale", "🇬🇧 UK Woman"],
    ["usMale", "🇺🇸 American Man"],
    ["usFemale", "🇺🇸 American Woman"]
];

options.forEach(([value, name]) => {

    const option =
        document.createElement("option");

    option.value = value;
    option.textContent = name;

    voiceSelect.appendChild(option);

});


// ======================================
// CHARACTER COUNT
// ======================================

text.addEventListener("input", () => {

    count.textContent =
        text.value.length;

});


// ======================================
// SPEED
// ======================================

rate.addEventListener("input", () => {

    rateValue.textContent =
        rate.value;

});


// ======================================
// PITCH
// ======================================

pitch.addEventListener("input", () => {

    pitchValue.textContent =
        pitch.value;

});


// ======================================
// AUDIO VARIABLES
// ======================================

let currentAudio = null;
let currentAudioURL = null;


// ======================================
// GENERATE AUDIO
// ======================================

async function generateAudio() {

    const script =
        text.value.trim();

    if (!script) {

        status.textContent =
            "Please enter some text.";

        return null;

    }


    const voice =
        voiceList[
            voiceSelect.value
        ];


    status.textContent =
        "⏳ Generating voice...";


    try {

        const response =
            await fetch(
                API_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        text: script,

                        voice: voice

                    })

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Server error"
            );

        }


        const blob =
            await response.blob();


        if (!blob.size) {

            throw new Error(
                "The server returned an empty audio file."
            );

        }


        if (currentAudioURL) {

            URL.revokeObjectURL(
                currentAudioURL
            );

        }


        currentAudioURL =
            URL.createObjectURL(
                blob
            );


        currentAudio =
            new Audio(
                currentAudioURL
            );


        status.textContent =
            "✅ Voice generated.";

        return {
            blob: blob,
            url: currentAudioURL
        };

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "❌ " + error.message;

        return null;

    }

}


// ======================================
// PLAY
// ======================================

playButton.addEventListener(
    "click",
    async () => {

        if (!currentAudio) {

            const result =
                await generateAudio();

            if (!result) return;

        }


        currentAudio.currentTime = 0;

        currentAudio.play();

        status.textContent =
            "🎤 Speaking...";


        currentAudio.onended =
            () => {

                status.textContent =
                    "Finished.";

            };

    }
);


// ======================================
// PAUSE
// ======================================

pauseButton.addEventListener(
    "click",
    () => {

        if (!currentAudio) {

            status.textContent =
                "Nothing is playing.";

            return;

        }


        currentAudio.pause();

        status.textContent =
            "⏸ Paused.";

    }
);


// ======================================
// RESUME
// ======================================

resumeButton.addEventListener(
    "click",
    () => {

        if (!currentAudio) {

            status.textContent =
                "Generate a voice first.";

            return;

        }


        currentAudio.play();

        status.textContent =
            "🎤 Speaking...";

    }
);


// ======================================
// STOP
// ======================================

stopButton.addEventListener(
    "click",
    () => {

        if (!currentAudio) {

            status.textContent =
                "Nothing is playing.";

            return;

        }


        currentAudio.pause();

        currentAudio.currentTime = 0;

        status.textContent =
            "⏹ Stopped.";

    }
);


// ======================================
// DOWNLOAD
// ======================================

downloadButton.addEventListener(
    "click",
    async () => {

        let result;


        if (!currentAudio) {

            result =
                await generateAudio();

            if (!result) return;

        }

        else {

            result = {

                blob:
                    await fetch(
                        currentAudioURL
                    ).then(
                        response =>
                            response.blob()
                    ),

                url:
                    currentAudioURL

            };

        }


        try {

            const downloadURL =
                URL.createObjectURL(
                    result.blob
                );


            const link =
                document.createElement("a");


            link.href =
                downloadURL;


            link.download =
                "voice-over.wav";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(() => {

                URL.revokeObjectURL(
                    downloadURL
                );

            }, 2000);


            status.textContent =
                "⬇️ Download started. Check your Downloads folder.";

        }

        catch (error) {

            console.error(error);

            status.textContent =
                "❌ Download failed.";

        }

    }
);

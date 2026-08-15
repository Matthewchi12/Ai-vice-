// ======================================
// SUPABASE
// ======================================

const SUPABASE_URL =
    "https://ihoxjwqlvuskkqrfowbr.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_TAesDbD1gUQ5p9IoYhZWJw_tBHL5g4F";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================
// BACKEND
// ======================================

const API_BASE_URL =
    "https://ai-voice-backend-pl9h.onrender.com";

const API_URL =
    `${API_BASE_URL}/tts`;


// ======================================
// LOGIN ELEMENTS
// ======================================

const authScreen =
    document.getElementById("authScreen");

const app =
    document.getElementById("app");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const signupButton =
    document.getElementById("signupButton");

const authStatus =
    document.getElementById("authStatus");


// ======================================
// SHOW APP
// ======================================

function showApp() {

    if (authScreen) {
        authScreen.style.display = "none";
    }

    if (app) {
        app.style.display = "block";
    }

}


// ======================================
// SHOW LOGIN
// ======================================

function showLogin() {

    if (authScreen) {
        authScreen.style.display = "flex";
    }

    if (app) {
        app.style.display = "none";
    }

}


// ======================================
// SIGN UP
// ======================================

if (signupButton) {

    signupButton.addEventListener(
        "click",
        async () => {

            const email =
                emailInput?.value.trim();

            const password =
                emailInput && passwordInput
                    ? passwordInput.value
                    : "";

            if (!email || !password) {

                if (authStatus) {
                    authStatus.textContent =
                        "Please enter your email and password.";
                }

                return;
            }

            if (password.length < 6) {

                if (authStatus) {
                    authStatus.textContent =
                        "Password must be at least 6 characters.";
                }

                return;
            }

            if (authStatus) {
                authStatus.textContent =
                    "Creating account...";
            }

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({
                        email: email,
                        password: password
                    });

                if (error) {

                    console.error(
                        "Signup error:",
                        error
                    );

                    if (authStatus) {
                        authStatus.textContent =
                            error.message;
                    }

                    return;
                }

                if (data?.session) {

                    if (authStatus) {
                        authStatus.textContent =
                            "Account created successfully.";
                    }

                    showApp();

                } else {

                    if (authStatus) {
                        authStatus.textContent =
                            "Account created. Check your email to confirm your account.";
                    }

                }

            } catch (error) {

                console.error(
                    "Signup exception:",
                    error
                );

                if (authStatus) {
                    authStatus.textContent =
                        "Something went wrong. Please try again.";
                }

            }

        }
    );

}


// ======================================
// LOGIN
// ======================================

if (loginButton) {

    loginButton.addEventListener(
        "click",
        async () => {

            const email =
                emailInput?.value.trim();

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";

            if (!email || !password) {

                if (authStatus) {
                    authStatus.textContent =
                        "Please enter your email and password.";
                }

                return;
            }

            if (authStatus) {
                authStatus.textContent =
                    "Logging in...";
            }

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    if (authStatus) {
                        authStatus.textContent =
                            error.message;
                    }

                    return;
                }

                if (data?.session) {

                    if (authStatus) {
                        authStatus.textContent =
                            "Login successful.";
                    }

                    showApp();

                } else {

                    if (authStatus) {
                        authStatus.textContent =
                            "Login failed. No session was created.";
                    }

                }

            } catch (error) {

                console.error(
                    "Login exception:",
                    error
                );

                if (authStatus) {
                    authStatus.textContent =
                        "Unable to connect. Please try again.";
                }

            }

        }
    );

}


// ======================================
// AUTH STATE
// ======================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Auth event:",
            event
        );

        if (session) {

            showApp();

        } else {

            showLogin();

        }

    }
);


// ======================================
// CHECK EXISTING LOGIN
// ======================================

async function checkLogin() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Session error:",
                error
            );

            showLogin();

            return;
        }

        if (data?.session) {

            showApp();

        } else {

            showLogin();

        }

    } catch (error) {

        console.error(
            "Check login error:",
            error
        );

        showLogin();

    }

}

checkLogin();


// ======================================
// VOICE ELEMENTS
// ======================================

const text =
    document.getElementById("text");

const voiceSelect =
    document.getElementById("voice");

const rate =
    document.getElementById("rate");

const pitch =
    document.getElementById("pitch");

const rateValue =
    document.getElementById("rateValue");

const pitchValue =
    document.getElementById("pitchValue");

const count =
    document.getElementById("count");

const status =
    document.getElementById("status");

const playButton =
    document.getElementById("play");

const pauseButton =
    document.getElementById("pause");

const resumeButton =
    document.getElementById("resume");

const stopButton =
    document.getElementById("stop");

const downloadButton =
    document.getElementById("download");


// ======================================
// GEMINI VOICES
// ======================================

const voiceList = {

    nigeriaMale: "Charon",

    nigeriaFemale: "Aoede",

    ukMale: "Charon",

    ukFemale: "Aoede",

    usMale: "Puck",

    usFemale: "Kore"

};


// ======================================
// VOICE OPTIONS
// ======================================

if (voiceSelect) {

    voiceSelect.innerHTML = "";

    const options = [

        ["nigeriaMale", "🇳🇬 Nigerian Male"],

        ["nigeriaFemale", "🇳🇬 Nigerian Female"],

        ["ukMale", "🇬🇧 UK Male"],

        ["ukFemale", "🇬🇧 UK Female"],

        ["usMale", "🇺🇸 American Male"],

        ["usFemale", "🇺🇸 American Female"]

    ];

    options.forEach(
        ([value, name]) => {

            const option =
                document.createElement("option");

            option.value =
                value;

            option.textContent =
                name;

            voiceSelect.appendChild(
                option
            );

        }
    );

}


// ======================================
// CHARACTER COUNT
// ======================================

if (text && count) {

    text.addEventListener(
        "input",
        () => {

            count.textContent =
                text.value.length;

        }
    );

}


// ======================================
// SPEED
// ======================================

if (rate && rateValue) {

    rate.addEventListener(
        "input",
        () => {

            rateValue.textContent =
                rate.value;

        }
    );

}


// ======================================
// PITCH
// ======================================

if (pitch && pitchValue) {

    pitch.addEventListener(
        "input",
        () => {

            pitchValue.textContent =
                pitch.value;

        }
    );

}


// ======================================
// AUDIO
// ======================================

let currentAudio =
    null;

let currentAudioURL =
    null;


// ======================================
// BUILD VOICE SCRIPT
// ======================================

function buildVoiceScript(
    originalScript,
    selectedVoice
) {

    const instructions = {

        nigeriaMale:
            "Speak naturally using a clear Nigerian English male speaking style. Keep the voice professional, warm and easy to understand. Do not exaggerate the accent.",

        nigeriaFemale:
            "Speak naturally using a clear Nigerian English female speaking style. Keep the voice professional, warm and easy to understand. Do not exaggerate the accent.",

        ukMale:
            "Speak naturally using a clear British English male speaking style. Keep the voice professional and easy to understand.",

        ukFemale:
            "Speak naturally using a clear British English female speaking style. Keep the voice professional and easy to understand.",

        usMale:
            "Speak naturally using a clear American English male speaking style. Keep the voice professional and easy to understand.",

        usFemale:
            "Speak naturally using a clear American English female speaking style. Keep the voice professional and easy to understand."

    };

    return `
${instructions[selectedVoice] || ""}

Text:
${originalScript}
`;

}


// ======================================
// GENERATE AUDIO
// ======================================

async function generateAudio() {

    if (!text) {
        return null;
    }

    const originalScript =
        text.value.trim();

    if (!originalScript) {

        if (status) {
            status.textContent =
                "Please enter some text.";
        }

        return null;
    }


    // ==================================
    // GET LOGIN SESSION
    // ==================================

    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient.auth.getSession();

    if (sessionError) {

        console.error(
            "Session error:",
            sessionError
        );

        if (status) {
            status.textContent =
                "Unable to check login.";
        }

        return null;
    }

    const session =
        sessionData?.session;


    if (!session) {

        if (status) {
            status.textContent =
                "Please login first.";
        }

        showLogin();

        return null;
    }


    // ==================================
    // VOICE
    // ==================================

    const selectedVoice =
        voiceSelect?.value ||
        "nigeriaMale";

    const voice =
        voiceList[selectedVoice] ||
        "Kore";

    const script =
        buildVoiceScript(
            originalScript,
            selectedVoice
        );


    if (status) {
        status.textContent =
            "⏳ Generating voice...";
    }


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body: JSON.stringify({

                        text:
                            script,

                        voice:
                            voice

                    })

                }
            );


        // ==================================
        // AUTH ERROR
        // ==================================

        if (response.status === 401) {

            if (status) {
                status.textContent =
                    "Your login session has expired. Please login again.";
            }

            await supabaseClient.auth.signOut();

            return null;
        }


        // ==================================
        // SERVER ERROR
        // ==================================

        if (!response.ok) {

            const errorText =
                await response.text();

            let errorMessage =
                errorText;

            try {

                const errorData =
                    JSON.parse(errorText);

                errorMessage =
                    errorData.error ||
                    errorText;

            } catch {

                // Response was not JSON.
            }

            throw new Error(
                errorMessage ||
                `Server error: ${response.status}`
            );
        }


        // ==================================
        // AUDIO
        // ==================================

        const blob =
            await response.blob();

        if (!blob.size) {

            throw new Error(
                "The server returned an empty audio file."
            );

        }


        // ==================================
        // CLEAN OLD AUDIO
        // ==================================

        if (currentAudioURL) {

            URL.revokeObjectURL(
                currentAudioURL
            );

        }


        // ==================================
        // CREATE AUDIO
        // ==================================

        currentAudioURL =
            URL.createObjectURL(
                blob
            );

        currentAudio =
            new Audio(
                currentAudioURL
            );


        currentAudio.onended =
            () => {

                if (status) {
                    status.textContent =
                        "Finished.";
                }

            };


        currentAudio.onerror =
            () => {

                if (status) {
                    status.textContent =
                        "❌ Audio could not be played.";
                }

            };


        if (status) {

            status.textContent =
                "✅ Voice generated.";

        }


        return {

            blob: blob,

            url:
                currentAudioURL

        };


    } catch (error) {

        console.error(
            "Voice generation error:",
            error
        );

        if (status) {

            status.textContent =
                "❌ " +
                (
                    error?.message ||
                    "Voice generation failed."
                );

        }

        return null;

    }

}


// ======================================
// PLAY
// ======================================

if (playButton) {

    playButton.addEventListener(
        "click",
        async () => {

            try {

                if (!currentAudio) {

                    const result =
                        await generateAudio();

                    if (!result) {
                        return;
                    }

                }

                currentAudio.currentTime =
                    0;

                await currentAudio.play();

                if (status) {

                    status.textContent =
                        "🎤 Speaking...";

                }

            } catch (error) {

                console.error(
                    "Play error:",
                    error
                );

                if (status) {

                    status.textContent =
                        "❌ Unable to play voice.";

                }

            }

        }
    );

}


// ======================================
// PAUSE
// ======================================

if (pauseButton) {

    pauseButton.addEventListener(
        "click",
        () => {

            if (!currentAudio) {

                if (status) {
                    status.textContent =
                        "Nothing is playing.";
                }

                return;
            }

            currentAudio.pause();

            if (status) {

                status.textContent =
                    "⏸ Paused.";

            }

        }
    );

}


// ======================================
// RESUME
// ======================================

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        async () => {

            if (!currentAudio) {

                if (status) {
                    status.textContent =
                        "Generate a voice first.";
                }

                return;
            }

            try {

                await currentAudio.play();

                if (status) {

                    status.textContent =
                        "🎤 Speaking...";

                }

            } catch (error) {

                console.error(
                    error
                );

                if (status) {

                    status.textContent =
                        "❌ Unable to resume audio.";

                }

            }

        }
    );

}


// ======================================
// STOP
// ======================================

if (stopButton) {

    stopButton.addEventListener(
        "click",
        () => {

            if (!currentAudio) {

                if (status) {
                    status.textContent =
                        "Nothing is playing.";
                }

                return;
            }

            currentAudio.pause();

            currentAudio.currentTime =
                0;

            if (status) {

                status.textContent =
                    "⏹ Stopped.";

            }

        }
    );

}


// ======================================
// DOWNLOAD
// ======================================

if (downloadButton) {

    downloadButton.addEventListener(
        "click",
        async () => {

            try {

                if (!currentAudio) {

                    const result =
                        await generateAudio();

                    if (!result) {
                        return;
                    }

                }

                const link =
                    document.createElement("a");

                link.href =
                    currentAudioURL;

                link.download =
                    "voice-over.wav";

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

                if (status) {

                    status.textContent =
                        "⬇️ Download started.";

                }

            } catch (error) {

                console.error(
                    "Download error:",
                    error
                );

                if (status) {

                    status.textContent =
                        "❌ Download failed.";

                }

            }

        }
    );

}


// ======================================
// LOGOUT
// ======================================

const logoutButton =
    document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await supabaseClient.auth.signOut();

                currentAudio =
                    null;

                if (currentAudioURL) {

                    URL.revokeObjectURL(
                        currentAudioURL
                    );

                    currentAudioURL =
                        null;

                }

                showLogin();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


// ======================================
// INITIALIZE
// ======================================

async function initializeApp() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Initialization error:",
                error
            );

            showLogin();

            return;
        }

        if (data?.session) {

            showApp();

        } else {

            showLogin();

        }

    } catch (error) {

        console.error(
            "Initialization exception:",
            error
        );

        showLogin();

    }

}

initializeApp();

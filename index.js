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
// AUTH ELEMENTS
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
// AUTH STATUS MESSAGE
// ======================================

function showAuthMessage(message) {

    if (authStatus) {
        authStatus.textContent = message;
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
// SHOW APP
// ======================================

async function showApp() {

    if (authScreen) {
        authScreen.style.display = "none";
    }

    if (app) {
        app.style.display = "block";
    }

    await loadSubscriptionStatus();

}


// ======================================
// SIGN UP
// ======================================

if (signupButton) {

    signupButton.addEventListener(
        "click",
        async () => {

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;

            if (!email || !password) {

                showAuthMessage(
                    "Please enter your email and password."
                );

                return;
            }

            if (password.length < 6) {

                showAuthMessage(
                    "Password must be at least 6 characters."
                );

                return;
            }

            showAuthMessage(
                "Creating account..."
            );

            signupButton.disabled = true;

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({
                        email: email,
                        password: password
                    });

                console.log(
                    "Signup response:",
                    data
                );

                if (error) {

                    console.error(
                        "Signup error:",
                        error
                    );

                    showAuthMessage(
                        error.message
                    );

                    return;
                }

                if (data.session) {

                    showAuthMessage(
                        "Account created successfully."
                    );

                    await showApp();

                } else {

                    showAuthMessage(
                        "Account created. Check your email and confirm your account before logging in."
                    );

                }

            } catch (error) {

                console.error(
                    "Signup exception:",
                    error
                );

                showAuthMessage(
                    error.message ||
                    "Unable to create account."
                );

            } finally {

                signupButton.disabled = false;

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
                emailInput.value.trim();

            const password =
                passwordInput.value;

            if (!email || !password) {

                showAuthMessage(
                    "Please enter your email and password."
                );

                return;
            }

            showAuthMessage(
                "Logging in..."
            );

            loginButton.disabled = true;

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                console.log(
                    "Login response:",
                    data
                );

                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    showAuthMessage(
                        error.message
                    );

                    return;
                }

                if (!data.session) {

                    showAuthMessage(
                        "Login failed. No session was created."
                    );

                    return;
                }

                showAuthMessage(
                    "Login successful."
                );

                await showApp();

            } catch (error) {

                console.error(
                    "Login exception:",
                    error
                );

                showAuthMessage(
                    error.message ||
                    "Unable to login."
                );

            } finally {

                loginButton.disabled = false;

            }

        }
    );

}


// ======================================
// AUTH STATE
// ======================================

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );

        console.log(
            "Session:",
            session
        );

        if (session) {

            await showApp();

        } else {

            showLogin();

        }

    }
);


// ======================================
// CHECK EXISTING SESSION
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

        if (data.session) {

            console.log(
                "Existing session found."
            );

            await showApp();

        } else {

            console.log(
                "No existing session."
            );

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


// ======================================
// LOGOUT FUNCTION
// ======================================

async function logout() {

    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        showLogin();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


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
// VOICES
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
// CREATE VOICE OPTIONS
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
// SUBSCRIPTION
// ======================================

const pricingSection =
    document.getElementById("pricing");

const paymentStatus =
    document.getElementById("paymentStatus");

const subscriptionButton =
    document.getElementById(
        "subscriptionButton"
    );

const limitSubscribeButton =
    document.getElementById(
        "limitSubscribeButton"
    );

const freeUsageText =
    document.getElementById(
        "freeUsageText"
    );

const limitMessage =
    document.getElementById(
        "limitMessage"
    );


let subscriptionActive =
    false;

let freeUses =
    0;

const FREE_GENERATIONS =
    5;


// ======================================
// SUBSCRIPTION DISPLAY
// ======================================

function updateSubscriptionDisplay() {

    if (!freeUsageText) {
        return;
    }

    if (subscriptionActive) {

        freeUsageText.textContent =
            "Subscription active";

    } else {

        const remaining =
            Math.max(
                0,
                FREE_GENERATIONS - freeUses
            );

        freeUsageText.textContent =
            `${remaining} free generation${
                remaining === 1 ? "" : "s"
            } remaining`;

    }

}


// ======================================
// LIMIT DISPLAY
// ======================================

function updateLimitDisplay() {

    if (!limitMessage) {
        return;
    }

    if (
        !subscriptionActive &&
        freeUses >= FREE_GENERATIONS
    ) {

        limitMessage.style.display =
            "block";

    } else {

        limitMessage.style.display =
            "none";

    }

}


// ======================================
// SHOW PRICING
// ======================================

function showPricing() {

    if (!pricingSection) {
        return;
    }

    pricingSection.style.display =
        "block";

    pricingSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ======================================
// HIDE PRICING
// ======================================

function hidePricing() {

    if (pricingSection) {

        pricingSection.style.display =
            "none";

    }

}


// ======================================
// SUBSCRIPTION BUTTONS
// ======================================

if (subscriptionButton) {

    subscriptionButton.addEventListener(
        "click",
        showPricing
    );

}

if (limitSubscribeButton) {

    limitSubscribeButton.addEventListener(
        "click",
        showPricing
    );

}


// ======================================
// LOAD SUBSCRIPTION
// ======================================

async function loadSubscriptionStatus() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        const session =
            data.session;

        if (!session) {
            return;
        }

        const response =
            await fetch(
                `${API_BASE_URL}/subscription`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${session.access_token}`
                    }
                }
            );

        const result =
            await response.json();

        console.log(
            "Subscription response:",
            result
        );

        if (!response.ok) {

            console.error(
                "Subscription error:",
                result
            );

            return;
        }

        subscriptionActive =
            result.active === true;

        freeUses =
            Number(
                result.free_uses || 0
            );

        updateSubscriptionDisplay();
        updateLimitDisplay();

        if (subscriptionActive) {

            hidePricing();

        } else if (
            freeUses >= FREE_GENERATIONS
        ) {

            showPricing();

        }

    } catch (error) {

        console.error(
            "Subscription loading error:",
            error
        );

    }

}


// ======================================
// CHARACTER COUNT
// ======================================

if (text) {

    text.addEventListener(
        "input",
        () => {

            if (count) {

                count.textContent =
                    text.value.length;

            }

        }
    );

}


// ======================================
// SPEED
// ======================================

if (rate) {

    rate.addEventListener(
        "input",
        () => {

            if (rateValue) {

                rateValue.textContent =
                    rate.value;

            }

        }
    );

}


// ======================================
// PITCH
// ======================================

if (pitch) {

    pitch.addEventListener(
        "input",
        () => {

            if (pitchValue) {

                pitchValue.textContent =
                    pitch.value;

            }

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
            "Speak naturally in clear Nigerian English with a natural male speaking style. Keep the pronunciation clear, warm and professional.",

        nigeriaFemale:
            "Speak naturally in clear Nigerian English with a natural female speaking style. Keep the pronunciation clear, warm and professional.",

        ukMale:
            "Speak naturally in clear British English with a natural male speaking style. Keep the pronunciation clear and professional.",

        ukFemale:
            "Speak naturally in clear British English with a natural female speaking style. Keep the pronunciation clear and professional.",

        usMale:
            "Speak naturally in clear American English with a natural male speaking style. Keep the pronunciation clear and professional.",

        usFemale:
            "Speak naturally in clear American English with a natural female speaking style. Keep the pronunciation clear and professional."

    };

    return `
${instructions[selectedVoice] || ""}

Read the following text naturally:

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

        if (status) {

            status.textContent =
                "Please login again.";

        }

        return null;
    }

    const session =
        data.session;

    if (!session) {

        if (status) {

            status.textContent =
                "Please login first.";

        }

        showLogin();

        return null;
    }

    const selectedVoice =
        voiceSelect.value;

    const voice =
        voiceList[selectedVoice];

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

        if (response.status === 401) {

            if (status) {

                status.textContent =
                    "Your login session expired. Please login again.";

            }

            await supabaseClient.auth.signOut();

            return null;
        }


        if (response.status === 402) {

            const data =
                await response.json();

            freeUses =
                Number(
                    data.free_uses ||
                    FREE_GENERATIONS
                );

            subscriptionActive =
                false;

            updateSubscriptionDisplay();
            updateLimitDisplay();

            showPricing();

            if (status) {

                status.textContent =
                    "🔒 Your free generations are finished. Please subscribe.";

            }

            return null;
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "TTS server error:",
                errorText
            );

            throw new Error(
                errorText ||
                `Server returned ${response.status}`
            );

        }


        const blob =
            await response.blob();

        if (!blob.size) {

            throw new Error(
                "Server returned empty audio."
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


        if (!subscriptionActive) {

            freeUses++;

        }


        updateSubscriptionDisplay();
        updateLimitDisplay();


        if (subscriptionActive) {

            if (status) {

                status.textContent =
                    "✅ Voice generated.";

            }

        } else {

            const remaining =
                Math.max(
                    0,
                    FREE_GENERATIONS - freeUses
                );

            if (status) {

                status.textContent =
                    `✅ Voice generated. ${remaining} free generation${
                        remaining === 1 ? "" : "s"
                    } remaining.`;

            }

        }


        if (
            !subscriptionActive &&
            freeUses >= FREE_GENERATIONS
        ) {

            setTimeout(
                () => {

                    showPricing();

                },
                1000
            );

        }


        return {
            blob: blob,
            url: currentAudioURL
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
                    error.message ||
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
                    "Resume error:",
                    error
                );

                if (status) {

                    status.textContent =
                        "❌ Unable to resume.";

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
// PAYSTACK
// ======================================

const PAYSTACK_PUBLIC_KEY =
    "pk_test_238b10087d6e116590057be181d1f6af5849d32e";


const PAYSTACK_PLANS = {

    basic:
        "PLN_77evy40w37571js",

    standard:
        "PLN_2klvnxb9r1exmhi",

    pro:
        "PLN_g3m0doyhzmgp4y7"

};


// ======================================
// VERIFY PAYMENT
// ======================================

async function verifyPayment(
    reference,
    plan
) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        const session =
            data.session;

        if (!session) {

            throw new Error(
                "Please login again."
            );

        }

        const response =
            await fetch(
                `${API_BASE_URL}/verify-payment`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body: JSON.stringify({

                        reference:
                            reference,

                        plan:
                            plan

                    })

                }
            );

        const result =
            await response.json();

        console.log(
            "Payment verification:",
            result
        );

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Payment verification failed."
            );

        }

        subscriptionActive =
            result.active === true;

        freeUses =
            Number(
                result.free_uses || 0
            );

        updateSubscriptionDisplay();
        updateLimitDisplay();

        if (subscriptionActive) {

            hidePricing();

        }

        if (paymentStatus) {

            paymentStatus.textContent =
                "✅ Payment verified successfully.";

        }

        return true;

    } catch (error) {

        console.error(
            "Payment verification error:",
            error
        );

        if (paymentStatus) {

            paymentStatus.textContent =
                "❌ " +
                (
                    error.message ||
                    "Payment verification failed."
                );

        }

        return false;

    }

}


// ======================================
// START PAYSTACK
// ======================================

async function startPaystackPayment(
    planCode,
    planName
) {

    try {

        if (
            typeof PaystackPop ===
            "undefined"
        ) {

            throw new Error(
                "Paystack did not load. Refresh the page."
            );

        }

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (error) {
            throw error;
        }

        const user =
            data.user;

        if (!user) {

            throw new Error(
                "Please login first."
            );

        }

        if (!user.email) {

            throw new Error(
                "Your account has no email."
            );

        }

        if (paymentStatus) {

            paymentStatus.textContent =
                `Opening ${planName} payment...`;

        }

        const popup =
            new PaystackPop();

        popup.newTransaction({

            key:
                PAYSTACK_PUBLIC_KEY,

            email:
                user.email,

            planCode:
                planCode,

            onSuccess:
                async (transaction) => {

                    console.log(
                        "Paystack success:",
                        transaction
                    );

                    if (paymentStatus) {

                        paymentStatus.textContent =
                            "⏳ Payment received. Verifying...";

                    }

                    await verifyPayment(
                        transaction.reference,
                        planName
                    );

                },

            onCancel:
                () => {

                    if (paymentStatus) {

                        paymentStatus.textContent =
                            "Payment cancelled.";

                    }

                },

            onError:
                (error) => {

                    console.error(
                        "Paystack error:",
                        error
                    );

                    if (paymentStatus) {

                        paymentStatus.textContent =
                            "❌ Payment failed.";

                    }

                }

        });

    } catch (error) {

        console.error(
            "Paystack error:",
            error
        );

        if (paymentStatus) {

            paymentStatus.textContent =
                "❌ " +
                (
                    error.message ||
                    "Unable to open payment."
                );

        }

    }

}


// ======================================
// PLAN BUTTONS
// ======================================

const basicPlanButton =
    document.getElementById(
        "basicPlanButton"
    );

if (basicPlanButton) {

    basicPlanButton.addEventListener(
        "click",
        () => {

            startPaystackPayment(
                PAYSTACK_PLANS.basic,
                "basic"
            );

        }
    );

}


const standardPlanButton =
    document.getElementById(
        "standardPlanButton"
    );

if (standardPlanButton) {

    standardPlanButton.addEventListener(
        "click",
        () => {

            startPaystackPayment(
                PAYSTACK_PLANS.standard,
                "standard"
            );

        }
    );

}


const proPlanButton =
    document.getElementById(
        "proPlanButton"
    );

if (proPlanButton) {

    proPlanButton.addEventListener(
        "click",
        () => {

            startPaystackPayment(
                PAYSTACK_PLANS.pro,
                "pro"
            );

        }
    );

}


// ======================================
// START APPLICATION
// ======================================

checkLogin();

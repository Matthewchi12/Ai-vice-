```javascript
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
    ${API_BASE_URL}/tts;


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

    loadSubscriptionStatus();
}


// ======================================
// SIGN UP
// ======================================

signupButton.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {

            authStatus.textContent =
                "Please enter your email and password.";

            return;
        }

        if (password.length < 6) {

            authStatus.textContent =
                "Password must be at least 6 characters.";

            return;
        }

        authStatus.textContent =
            "Creating account...";

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({
                    email,
                    password
                });

            if (error) {

                console.error(
                    "Signup error:",
                    error
                );

                authStatus.textContent =
                    error.message;

                return;
            }

            if (data.session) {

                authStatus.textContent =
                    "Account created successfully.";

                showApp();

            } else {

                authStatus.textContent =
                    "Account created. Please check your email to confirm your account.";

            }

        } catch (error) {

            console.error(
                "Signup exception:",
                error
            );

            authStatus.textContent =
                "Something went wrong. Please try again.";

        }

    }
);


// ======================================
// LOGIN
// ======================================

loginButton.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {

            authStatus.textContent =
                "Please enter your email and password.";

            return;
        }

        authStatus.textContent =
            "Logging in...";

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                authStatus.textContent =
                    error.message;

                return;
            }

            if (data.session) {

                authStatus.textContent =
                    "Login successful.";

                showApp();

            }

        } catch (error) {

            console.error(
                "Login exception:",
                error
            );

            authStatus.textContent =
                "Unable to connect. Please try again.";

        }

    }
);


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

            if (authScreen) {
                authScreen.style.display = "flex";
            }

            if (app) {
                app.style.display = "none";
            }

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

            return;
        }

        if (data.session) {

            showApp();

        } else {

            if (authScreen) {
                authScreen.style.display = "flex";
            }

            if (app) {
                app.style.display = "none";
            }

        }

    } catch (error) {

        console.error(
            "Check login error:",
            error
        );

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
// SUBSCRIPTION ELEMENTS
// ======================================

const pricingSection =
    document.querySelector(".pricing");

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


// ======================================
// ACCOUNT STATE
// ======================================

let subscriptionActive =
    false;

let freeUses =
    0;

const FREE_GENERATIONS =
    5;


// ======================================
// UPDATE SUBSCRIPTION DISPLAY
// ======================================

function updateSubscriptionDisplay() {

    if (freeUsageText) {

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
                `${remaining} free generation${remaining === 1 ? "" : "s"} remaining`;

        }

    }


    if (limitMessage) {

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

}


// ======================================
// TRIAL NOTICE
// ======================================

function updateFreeTrialDisplay() {

    let trialBox =
        document.getElementById(
            "freeTrialNotice"
        );

    if (!trialBox) {

        trialBox =
            document.createElement("div");

        trialBox.id =
            "freeTrialNotice";

        trialBox.style.margin =
            "10px auto 20px";

        trialBox.style.padding =
            "10px 14px";

        trialBox.style.borderRadius =
            "10px";

        trialBox.style.background =
            "#f5f5f5";

        trialBox.style.textAlign =
            "center";

        trialBox.style.maxWidth =
            "500px";

        trialBox.style.fontSize =
            "14px";

        trialBox.style.color =
            "#333";

        const header =
            app?.querySelector("header");

        if (header) {

            header.insertAdjacentElement(
                "afterend",
                trialBox
            );

        }

    }


    if (subscriptionActive) {

        trialBox.innerHTML =
            `
            ⭐ <strong>Subscription active</strong>
            <span style="color:#666;">
                You can generate voices.
            </span>
            `;

    } else {

        const remaining =
            Math.max(
                0,
                FREE_GENERATIONS - freeUses
            );

        if (remaining > 0) {

            trialBox.innerHTML =
                `
                🎁 <strong>${remaining}</strong>
                free voice generation${remaining === 1 ? "" : "s"} remaining.
                <span style="color:#666;">
                    Subscribe when you need more.
                </span>
                `;

        } else {

            trialBox.innerHTML =
                `
                🔒 <strong>Free trial finished.</strong>
                Please subscribe to continue.
                `;

        }

    }

}


// ======================================
// SUBSCRIPTION LOCK
// ======================================

function lockVoiceStudio() {

    const voiceCard =
        document.querySelector(".card");

    if (!voiceCard) {
        return;
    }

    voiceCard.style.position =
        "relative";

    let lockMessage =
        document.getElementById(
            "subscriptionLock"
        );

    if (lockMessage) {
        return;
    }

    lockMessage =
        document.createElement("div");

    lockMessage.id =
        "subscriptionLock";

    lockMessage.style.position =
        "absolute";

    lockMessage.style.inset =
        "0";

    lockMessage.style.background =
        "rgba(255,255,255,0.94)";

    lockMessage.style.display =
        "flex";

    lockMessage.style.flexDirection =
        "column";

    lockMessage.style.justifyContent =
        "center";

    lockMessage.style.alignItems =
        "center";

    lockMessage.style.textAlign =
        "center";

    lockMessage.style.padding =
        "30px";

    lockMessage.style.boxSizing =
        "border-box";

    lockMessage.style.borderRadius =
        "15px";

    lockMessage.style.zIndex =
        "20";

    lockMessage.innerHTML =
        `
        <div style="font-size:42px;">
            🔒
        </div>

        <h2 style="margin:10px 0;">
            Free trial finished
        </h2>

        <p style="max-width:350px;color:#666;">
            You have used your 5 free voice generations.
            Subscribe to continue creating voice-overs.
        </p>

        <button
            id="unlockSubscriptionButton"
            style="
                padding:13px 22px;
                border:none;
                border-radius:10px;
                background:#111;
                color:white;
                font-weight:600;
                cursor:pointer;
            "
        >
            View Subscription Plans
        </button>
        `;

    voiceCard.appendChild(
        lockMessage
    );

    const button =
        document.getElementById(
            "unlockSubscriptionButton"
        );

    if (button) {

        button.addEventListener(
            "click",
            showPricing
        );

    }

}


// ======================================
// UNLOCK VOICE STUDIO
// ======================================

function unlockVoiceStudio() {

    const lockMessage =
        document.getElementById(
            "subscriptionLock"
        );

    if (lockMessage) {
        lockMessage.remove();
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
            data: sessionData
        } =
            await supabaseClient.auth.getSession();

        const session =
            sessionData.session;

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

        const data =
            await response.json();

        if (!response.ok) {

            console.error(
                "Subscription error:",
                data
            );

            return;
        }

        subscriptionActive =
            data.active === true;

        freeUses =
            Number(
                data.free_uses || 0
            );

        updateSubscriptionDisplay();
        updateFreeTrialDisplay();

        if (subscriptionActive) {

            unlockVoiceStudio();
            hidePricing();

        } else if (
            freeUses >= FREE_GENERATIONS
        ) {

            lockVoiceStudio();
            showPricing();

        } else {

            unlockVoiceStudio();
            hidePricing();

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

            count.textContent =
                text.value.length;

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

            rateValue.textContent =
                rate.value;

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

    const originalScript =
        text.value.trim();

    if (!originalScript) {

        status.textContent =
            "Please enter some text.";

        return null;

    }

    const {
        data: sessionData
    } =
        await supabaseClient.auth.getSession();

    const session =
        sessionData.session;

    if (!session) {

        status.textContent =
            "Please login first.";

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

        if (response.status === 402) {

            const data =
                await response.json();

            freeUses =
                Number(
                    data.free_uses || FREE_GENERATIONS
                );

            subscriptionActive =
                false;

            updateSubscriptionDisplay();
            updateFreeTrialDisplay();

            lockVoiceStudio();
            showPricing();

            status.textContent =
                "🔒 Your 5 free generations are finished. Please subscribe.";

            return null;

        }

        if (response.status === 401) {

            status.textContent =
                "Please login again.";

            return null;

        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                `Server error: ${response.status}`
            );

        }

        const blob =
            await response.blob();

        if (!blob.size) {

            throw new Error(
                "The server returned an empty audio file."
            );

        }

        if (!subscriptionActive) {

            freeUses++;

        }

        updateSubscriptionDisplay();
        updateFreeTrialDisplay();

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

                status.textContent =
                    "Finished.";

            };

        currentAudio.onerror =
            () => {

                status.textContent =
                    "❌ Audio could not be played.";

            };

        if (subscriptionActive) {

            status.textContent =
                "✅ Voice generated.";

        } else {

            const remaining =
                Math.max(
                    0,
                    FREE_GENERATIONS - freeUses
                );

            status.textContent =
                `✅ Voice generated. ${remaining} free generation${remaining === 1 ? "" : "s"} remaining.`;

        }

        if (
            !subscriptionActive &&
            freeUses >= FREE_GENERATIONS
        ) {

            setTimeout(
                () => {

                    lockVoiceStudio();
                    showPricing();

                },
                800
            );

        }

        return {
            blob,
            url: currentAudioURL
        };

    } catch (error) {

        console.error(
            "Voice generation error:",
            error
        );

        status.textContent =
            "❌ " + error.message;

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

                status.textContent =
                    "🎤 Speaking...";

            } catch (error) {

                console.error(
                    "Play error:",
                    error
                );

                status.textContent =
                    "❌ Unable to play voice.";

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

                status.textContent =
                    "Nothing is playing.";

                return;

            }

            currentAudio.pause();

            status.textContent =
                "⏸ Paused.";

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

                status.textContent =
                    "Generate a voice first.";

                return;

            }

            try {

                await currentAudio.play();

                status.textContent =
                    "🎤 Speaking...";

            } catch (error) {

                console.error(error);

                status.textContent =
                    "❌ Unable to resume audio.";

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

                status.textContent =
                    "Nothing is playing.";

                return;

            }

            currentAudio.pause();

            currentAudio.currentTime =
                0;

            status.textContent =
                "⏹ Stopped.";

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

                const response =
                    await fetch(
                        currentAudioURL
                    );

                const blob =
                    await response.blob();

                const downloadURL =
                    URL.createObjectURL(
                        blob
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

                setTimeout(
                    () => {

                        URL.revokeObjectURL(
                            downloadURL
                        );

                    },
                    2000
                );

                status.textContent =
                    "⬇️ Download started.";

            } catch (error) {

                console.error(
                    "Download error:",
                    error
                );

                status.textContent =
                    "❌ Download failed.";

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
            data: sessionData
        } =
            await supabaseClient.auth.getSession();

        const session =
            sessionData.session;

        if (!session) {

            throw new Error(
                "Your login session has expired. Please login again."
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

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Payment verification failed."
            );

        }

        if (!data.active) {

            throw new Error(
                "Payment was verified but your subscription is not active."
            );

        }

        subscriptionActive =
            true;

        freeUses =
            Number(
                data.free_uses || freeUses
            );

        unlockVoiceStudio();
        hidePricing();

        updateSubscriptionDisplay();
        updateFreeTrialDisplay();

        if (paymentStatus) {

            paymentStatus.textContent =
                "✅ Payment verified. Your subscription is active.";

        }

        status.textContent =
            "✅ Subscription active. You can continue generating voices.";

        return true;

    } catch (error) {

        console.error(
            "Payment verification error:",
            error
        );

        if (paymentStatus) {

            paymentStatus.textContent =
                "❌ " + error.message;

        }

        return false;

    }

}


// ======================================
// START PAYSTACK PAYMENT
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

            if (paymentStatus) {

                paymentStatus.textContent =
                    "❌ Paystack failed to load. Please refresh the page.";

            }

            return;

        }

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (
            error ||
            !data.user
        ) {

            if (paymentStatus) {

                paymentStatus.textContent =
                    "❌ Please login before subscribing.";

            }

            return;

        }

        const user =
            data.user;

        if (!user.email) {

            if (paymentStatus) {

                paymentStatus.textContent =
                    "❌ Your account does not have an email.";

            }

            return;

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
                        "Paystack transaction:",
                        transaction
                    );

                    if (paymentStatus) {

                        paymentStatus.textContent =
                            "⏳ Payment received. Verifying payment...";

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
                "❌ Unable to open payment.";

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
// INITIALIZE
// ======================================

async function initializeApp() {

    try {

        const {
            data
        } =
            await supabaseClient.auth.getSession();

        if (!data.session) {
            return;
        }

        await loadSubscriptionStatus();

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

    }

}

initializeApp(

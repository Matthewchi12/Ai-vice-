// ============================================
// SUPABASE
// ============================================

const SUPABASE_URL =
    "https://ihoxjwqlvuskkqrfowbr.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_TAesDbD1gUQ5p9IoYhZWJw_tBHL5g4F";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================================
// BACKEND
// ============================================

const API_BASE_URL =
    "https://ai-voice-backend-pl9h.onrender.com";

const API_URL =
    `${API_BASE_URL}/tts`;


// ============================================
// ELEMENTS
// ============================================

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

const text =
    document.getElementById("text");

const voiceSelect =
    document.getElementById("voice");

const count =
    document.getElementById("count");

const rate =
    document.getElementById("rate");

const pitch =
    document.getElementById("pitch");

const rateValue =
    document.getElementById("rateValue");

const pitchValue =
    document.getElementById("pitchValue");

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

const pricing =
    document.getElementById("pricing");

const subscriptionButton =
    document.getElementById("subscriptionButton");

const limitSubscribeButton =
    document.getElementById("limitSubscribeButton");

const limitMessage =
    document.getElementById("limitMessage");

const freeUsageText =
    document.getElementById("freeUsageText");

const paymentStatus =
    document.getElementById("paymentStatus");


// ============================================
// SETTINGS
// ============================================

const FREE_GENERATIONS = 5;

let subscriptionActive = false;

let freeUses = 0;

let currentAudio = null;

let currentAudioURL = null;


// ============================================
// VOICES
// ============================================

const voiceList = {

    nigeriaMale: "Charon",

    nigeriaFemale: "Aoede",

    ukMale: "Charon",

    ukFemale: "Aoede",

    usMale: "Puck",

    usFemale: "Kore"

};


// ============================================
// AUTH MESSAGE
// ============================================

function showAuthMessage(message) {

    authStatus.textContent = message;

}


// ============================================
// SHOW LOGIN
// ============================================

function showLogin() {

    authScreen.style.display = "flex";

    app.style.display = "none";

}


// ============================================
// SHOW APP
// ============================================

async function showApp() {

    authScreen.style.display = "none";

    app.style.display = "block";

    await loadSubscriptionStatus();

}


// ============================================
// SIGN UP
// ============================================

signupButton.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {

            showAuthMessage(
                "Enter your email and password."
            );

            return;
        }

        if (password.length < 6) {

            showAuthMessage(
                "Password must be at least 6 characters."
            );

            return;
        }

        signupButton.disabled = true;

        showAuthMessage(
            "Creating account..."
        );

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({
    email,
    password,
    options: {
        emailRedirectTo: "https://matthewchi12.github.io/Ai-vice-/"
    }
});
    

            if (error) {
                throw error;
            }

            if (data.session) {

                showAuthMessage(
                    "Account created successfully."
                );

                await showApp();

            } else {

                showAuthMessage(
                    "Account created. Check your email to confirm your account."
                );

            }

        } catch (error) {

            console.error(error);

            showAuthMessage(
                error.message
            );

        } finally {

            signupButton.disabled = false;

        }

    }
);


// ============================================
// LOGIN
// ============================================

loginButton.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {

            showAuthMessage(
                "Enter your email and password."
            );

            return;
        }

        loginButton.disabled = true;

        showAuthMessage(
            "Logging in..."
        );

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
                throw error;
            }

            if (!data.session) {

                throw new Error(
                    "Login failed. No session created."
                );

            }

            showAuthMessage(
                "Login successful."
            );

            await showApp();

        } catch (error) {

            console.error(error);

            showAuthMessage(
                error.message
            );

        } finally {

            loginButton.disabled = false;

        }

    }
);


// ============================================
// CHECK LOGIN
// ============================================

async function checkLogin() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (data.session) {

            await showApp();

        } else {

            showLogin();

        }

    } catch (error) {

        console.error(
            "Session error:",
            error
        );

        showLogin();

    }

}


// ============================================
// AUTH STATE
// ============================================

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        if (session) {

            await showApp();

        } else {

            showLogin();

        }

    }
);


// ============================================
// CHARACTER COUNT
// ============================================

text.addEventListener(
    "input",
    () => {

        count.textContent =
            text.value.length;

    }
);


// ============================================
// SPEED
// ============================================

rate.addEventListener(
    "input",
    () => {

        rateValue.textContent =
            rate.value;

    }
);


// ============================================
// PITCH
// ============================================

pitch.addEventListener(
    "input",
    () => {

        pitchValue.textContent =
            pitch.value;

    }
);


// ============================================
// SUBSCRIPTION DISPLAY
// ============================================

function updateSubscriptionDisplay() {

    if (subscriptionActive) {

        freeUsageText.textContent =
            "Subscription active";

        return;
    }

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


// ============================================
// LIMIT
// ============================================

function updateLimitDisplay() {

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


// ============================================
// PRICING
// ============================================

function showPricing() {

    pricing.style.display =
        "block";

    pricing.scrollIntoView({
        behavior: "smooth"
    });

}


function hidePricing() {

    pricing.style.display =
        "none";

}


subscriptionButton.addEventListener(
    "click",
    showPricing
);


limitSubscribeButton.addEventListener(
    "click",
    showPricing
);


// ============================================
// LOAD SUBSCRIPTION
// ============================================

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

        if (!data.session) {
            return;
        }

        const response =
            await fetch(
                `${API_BASE_URL}/subscription`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${data.session.access_token}`
                    }
                }
            );

        if (!response.ok) {

            console.error(
                "Subscription endpoint returned:",
                response.status
            );

            return;
        }

        const result =
            await response.json();

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

    } catch (error) {

        console.error(
            "Subscription error:",
            error
        );

    }

}


// ============================================
// BUILD SCRIPT
// ============================================

function buildVoiceScript(
    originalText,
    selectedVoice
) {

    const instructions = {

        nigeriaMale:
            "Speak naturally in clear Nigerian English with a natural male voice. Keep the pronunciation clear, warm and professional.",

        nigeriaFemale:
            "Speak naturally in clear Nigerian English with a natural female voice. Keep the pronunciation clear, warm and professional.",

        ukMale:
            "Speak naturally in clear British English with a natural male voice. Keep the pronunciation clear and professional.",

        ukFemale:
            "Speak naturally in clear British English with a natural female voice. Keep the pronunciation clear and professional.",

        usMale:
            "Speak naturally in clear American English with a natural male voice. Keep the pronunciation clear and professional.",

        usFemale:
            "Speak naturally in clear American English with a natural female voice. Keep the pronunciation clear and professional."

    };

    return `
${instructions[selectedVoice]}

Read the following text naturally:

${originalText}
`;

}


// ============================================
// GENERATE AUDIO
// ============================================

async function generateAudio() {

    const originalText =
        text.value.trim();

    if (!originalText) {

        status.textContent =
            "Please enter some text.";

        return null;

    }


    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();

    if (error || !data.session) {

        status.textContent =
            "Please login again.";

        showLogin();

        return null;

    }


    status.textContent =
        "⏳ Generating voice...";


    const selectedVoice =
        voiceSelect.value;

    const voice =
        voiceList[selectedVoice];

    const script =
        buildVoiceScript(
            originalText,
            selectedVoice
        );


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${data.session.access_token}`

                    },

                    body: JSON.stringify({

                        text: script,

                        voice: voice

                    })

                }
            );


        if (response.status === 401) {

            status.textContent =
                "Session expired. Please login again.";

            await supabaseClient.auth.signOut();

            return null;

        }


        if (response.status === 402) {

            const result =
                await response.json();

            freeUses =
                Number(
                    result.free_uses ||
                    FREE_GENERATIONS
                );

            subscriptionActive =
                false;

            updateSubscriptionDisplay();

            updateLimitDisplay();

            showPricing();

            status.textContent =
                "🔒 Your free generations are finished.";

            return null;

        }


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                `Server error ${response.status}`
            );

        }


        const blob =
            await response.blob();


        if (!blob.size) {

            throw new Error(
                "The server returned empty audio."
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

                status.textContent =
                    "Finished.";

            };


        currentAudio.onerror =
            () => {

                status.textContent =
                    "❌ Audio playback failed.";

            };


        status.textContent =
            "✅ Voice generated successfully.";

        return true;

    } catch (error) {

        console.error(
            "TTS error:",
            error
        );

        status.textContent =
            "❌ " + error.message;

        return null;

    }

}


// ============================================
// PLAY
// ============================================

playButton.addEventListener(
    "click",
    async () => {

        if (!currentAudio) {

            const generated =
                await generateAudio();

            if (!generated) {
                return;
            }

        }

        try {

            currentAudio.currentTime = 0;

            await currentAudio.play();

            status.textContent =
                "🎤 Speaking...";

        } catch (error) {

            console.error(error);

            status.textContent =
                "❌ Unable to play audio.";

        }

    }
);


// ============================================
// PAUSE
// ============================================

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


// ============================================
// RESUME
// ============================================

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
                "❌ Unable to resume.";

        }

    }
);


// ============================================
// STOP
// ============================================

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


// ============================================
// DOWNLOAD
// ============================================

downloadButton.addEventListener(
    "click",
    async () => {

        if (!currentAudio) {

            const generated =
                await generateAudio();

            if (!generated) {
                return;
            }

        }


        const link =
            document.createElement("a");

        link.href =
            currentAudioURL;

        link.download =
            "voice-over.wav";

        document.body.appendChild(link);

        link.click();

        link.remove();

        status.textContent =
            "⬇️ Download started.";

    }
);


// ============================================
// PAYSTACK
// ============================================

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


// ============================================
// START PAYMENT
// ============================================

async function startPayment(
    planCode,
    planName
) {

    if (
        typeof PaystackPop ===
        "undefined"
    ) {

        paymentStatus.textContent =
            "❌ Paystack failed to load.";

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();


    if (error || !data.user) {

        paymentStatus.textContent =
            "Please login first.";

        return;

    }


    paymentStatus.textContent =
        `Opening ${planName} payment...`;


    try {

        const popup =
            new PaystackPop();


        popup.newTransaction({

            key:
                PAYSTACK_PUBLIC_KEY,

            email:
                data.user.email,

            planCode:
                planCode,

            onSuccess:
                async (transaction) => {

                    console.log(
                        "Paystack transaction:",
                        transaction
                    );


                    paymentStatus.textContent =
                        "⏳ Payment received. Verifying...";


                    await verifyPayment(
                        transaction.reference,
                        planName
                    );

                },


            onCancel:
                () => {

                    paymentStatus.textContent =
                        "Payment cancelled.";

                },


            onError:
                (error) => {

                    console.error(
                        "Paystack error:",
                        error
                    );

                    paymentStatus.textContent =
                        "❌ Payment failed.";

                }

        });

    } catch (error) {

        console.error(error);

        paymentStatus.textContent =
            "❌ " + error.message;

    }

}


// ============================================
// VERIFY PAYMENT
// ============================================

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


        if (error || !data.session) {

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

                        Authorization:
                            `Bearer ${data.session.access_token}`

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


        paymentStatus.textContent =
            "✅ Payment verified successfully.";


    } catch (error) {

        console.error(
            "Verification error:",
            error
        );

        paymentStatus.textContent =
            "❌ " + error.message;

    }

}


// ============================================
// PLAN BUTTONS
// ============================================

document
    .getElementById("basicPlanButton")
    .addEventListener(
        "click",
        () => {

            startPayment(
                PAYSTACK_PLANS.basic,
                "basic"
            );

        }
    );


document
    .getElementById("standardPlanButton")
    .addEventListener(
        "click",
        () => {

            startPayment(
                PAYSTACK_PLANS.standard,
                "standard"
            );

        }
    );


document
    .getElementById("proPlanButton")
    .addEventListener(
        "click",
        () => {

            startPayment(
                PAYSTACK_PLANS.pro,
                "pro"
            );

        }
    );


// ============================================
// START
// ============================================

checkLogin();

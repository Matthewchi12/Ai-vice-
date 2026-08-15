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

    updateFreeTrialDisplay();
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

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });

            if (error) {

                authStatus.textContent =
                    error.message;

                return;
            }

            if (data.session) {

                authStatus.textContent =
                    "Account created successfully!";

                showApp();

            } else {

                authStatus.textContent =
                    "Account created. Check your email to confirm your account.";

            }

        }

        catch (error) {

            console.error(error);

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

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (error) {

                console.error(error);

                authStatus.textContent =
                    error.message;

                return;
            }

            if (data.session) {

                authStatus.textContent =
                    "Login successful!";

                showApp();

            }

        }

        catch (error) {

            console.error(error);

            authStatus.textContent =
                "Unable to connect. Please try again.";

        }

    }
);


// ======================================
// CHECK EXISTING LOGIN
// ======================================

async function checkLogin() {

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(error);

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

    }

    catch (error) {

        console.error(error);

    }

}

checkLogin();


// ======================================
// RENDER BACKEND
// ======================================

const API_URL =
    "https://ai-voice-backend-pl9h.onrender.com/tts";


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


// ======================================
// FREE TRIAL SYSTEM
// ======================================

const FREE_GENERATIONS = 5;

let freeGenerationsUsed = 0;


// ======================================
// UNIQUE STORAGE KEY FOR USER
// ======================================

async function getTrialStorageKey() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {

        return null;

    }

    return "voiceTrial_" + data.user.id;

}


// ======================================
// LOAD FREE GENERATIONS
// ======================================

async function loadFreeGenerations() {

    const key =
        await getTrialStorageKey();

    if (!key) {

        freeGenerationsUsed = 0;

        return;

    }

    const saved =
        localStorage.getItem(key);

    if (saved === null) {

        freeGenerationsUsed = 0;

    } else {

        freeGenerationsUsed =
            Number(saved) || 0;

    }

}


// ======================================
// SAVE FREE GENERATIONS
// ======================================

async function saveFreeGenerations() {

    const key =
        await getTrialStorageKey();

    if (!key) {

        return;

    }

    localStorage.setItem(
        key,
        freeGenerationsUsed.toString()
    );

}


// ======================================
// CHECK FREE ACCESS
// ======================================

function hasFreeAccess() {

    return (
        freeGenerationsUsed <
        FREE_GENERATIONS
    );

}


// ======================================
// UPDATE TRIAL DISPLAY
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
            app.querySelector("header");


        if (header) {

            header.insertAdjacentElement(
                "afterend",
                trialBox
            );

        }

    }


    const remaining =
        Math.max(
            0,
            FREE_GENERATIONS -
            freeGenerationsUsed
        );


    if (remaining > 0) {

        trialBox.innerHTML =
            `🎁 <strong>${remaining}</strong> free voice generation${remaining === 1 ? "" : "s"} remaining. 
            <span style="color:#666;">
            Subscription plans available below.
            </span>`;

    } else {

        trialBox.innerHTML =
            `🔒 <strong>Free trial finished.</strong> 
            Please subscribe to continue generating voices.`;

    }

}


// ======================================
// PRICING SECTION
// ======================================

const pricingSection =
    document.querySelector(".pricing");


// ======================================
// HIDE PRICING INITIALLY
// ======================================

if (pricingSection) {

    pricingSection.style.display =
        "none";

}


// ======================================
// SHOW PRICING
// ======================================

function showPricing() {

    if (pricingSection) {

        pricingSection.style.display =
            "block";

        pricingSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// ======================================
// LOCK VOICE STUDIO
// ======================================

function lockVoiceStudio() {

    const voiceCard =
        document.querySelector(
            ".card"
        );

    if (!voiceCard) {

        return;

    }


    voiceCard.style.position =
        "relative";


    let lockMessage =
        document.getElementById(
            "subscriptionLock"
        );


    if (!lockMessage) {

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


        lockMessage.innerHTML = `

            <div style="font-size:42px;">
                🔒
            </div>

            <h2 style="margin:10px 0;">
                Free trial finished
            </h2>

            <p style="max-width:350px;color:#666;">
                You have used your 5 free voice generations.
                Subscribe to a plan to continue creating voice-overs.
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


        document
            .getElementById(
                "unlockSubscriptionButton"
            )
            .addEventListener(
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
// INITIALIZE TRIAL
// ======================================

async function initializeTrial() {

    await loadFreeGenerations();

    updateFreeTrialDisplay();

    if (!hasFreeAccess()) {

        lockVoiceStudio();

    }

}


initializeTrial();


// ======================================
// CHARACTER COUNT
// ======================================

text.addEventListener(
    "input",
    () => {

        count.textContent =
            text.value.length;

    }
);


// ======================================
// SPEED
// ======================================

rate.addEventListener(
    "input",
    () => {

        rateValue.textContent =
            rate.value;

    }
);


// ======================================
// PITCH
// ======================================

pitch.addEventListener(
    "input",
    () => {

        pitchValue.textContent =
            pitch.value;

    }
);


// ======================================
// AUDIO
// ======================================

let currentAudio = null;

let currentAudioURL = null;


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


    // ==================================
    // CHECK FREE LIMIT
    // ==================================

    if (!hasFreeAccess()) {

        status.textContent =
            "🔒 Your 5 free generations are finished. Please subscribe.";

        showPricing();

        lockVoiceStudio();

        return null;

    }


    const selectedVoice =
        voiceSelect.value;


    const voice =
        voiceList[selectedVoice];


    let script =
        originalScript;


    if (selectedVoice === "nigeriaMale") {

        script =
            `Speak this text naturally using a clear Nigerian English male speaking style. Use natural Nigerian English pronunciation. Keep the voice professional, warm and easy to understand. Do not exaggerate the accent.

Text:
${originalScript}`;

    }


    if (selectedVoice === "nigeriaFemale") {

        script =
            `Speak this text naturally using a clear Nigerian English female speaking style. Use natural Nigerian English pronunciation. Keep the voice professional, warm and easy to understand. Do not exaggerate the accent.

Text:
${originalScript}`;

    }


    if (selectedVoice === "ukMale") {

        script =
            `Speak this text naturally using a clear British English male speaking style. Use natural UK English pronunciation. Keep the voice professional and easy to understand.

Text:
${originalScript}`;

    }


    if (selectedVoice === "ukFemale") {

        script =
            `Speak this text naturally using a clear British English female speaking style. Use natural UK English pronunciation. Keep the voice professional and easy to understand.

Text:
${originalScript}`;

    }


    if (selectedVoice === "usMale") {

        script =
            `Speak this text naturally using a clear American English male speaking style. Use natural American pronunciation. Keep the voice professional and easy to understand.

Text:
${originalScript}`;

    }


    if (selectedVoice === "usFemale") {

        script =
            `Speak this text naturally using a clear American English female speaking style. Use natural American pronunciation. Keep the voice professional and easy to understand.

Text:
${originalScript}`;

    }


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
                "Server error: " +
                response.status
            );

        }


        const blob =
            await response.blob();


        if (!blob.size) {

            throw new Error(
                "The server returned an empty audio file."
            );

        }


        // ==================================
        // ONLY COUNT SUCCESSFUL GENERATION
        // ==================================

        freeGenerationsUsed++;

        await saveFreeGenerations();

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


        status.textContent =
            `✅ Voice generated. ${Math.max(0, FREE_GENERATIONS - freeGenerationsUsed)} free generation${Math.max(0, FREE_GENERATIONS - freeGenerationsUsed) === 1 ? "" : "s"} remaining.`;


        // ==================================
        // LOCK AFTER 5TH GENERATION
        // ==================================

        if (!hasFreeAccess()) {

            setTimeout(
                () => {

                    lockVoiceStudio();

                    showPricing();

                },
                1000
            );

        }


        return {

            blob: blob,

            url: currentAudioURL

        };

    }

    catch (error) {

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

        }

        catch (error) {

            console.error(
                "Play error:",
                error
            );

            status.textContent =
                "❌ Unable to play voice.";

        }

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

        }

        catch (error) {

            console.error(error);

            status.textContent =
                "❌ Unable to resume audio.";

        }

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

        currentAudio.currentTime =
            0;

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

        try {

            // If there is no generated audio,
            // generate one first.
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

        }

        catch (error) {

            console.error(
                "Download error:",
                error
            );

            status.textContent =
                "❌ Download failed.";

        }

    }
);


// ======================================
// PAYSTACK
// ======================================

const PAYSTACK_PUBLIC_KEY =
    "pk_test_238b10087d6e116590057be181d1f6af5849d32e";


// ======================================
// PAYSTACK PLAN CODES
// ======================================

const PAYSTACK_PLANS = {

    basic:
        "PLN_77evy40w37571js",

    standard:
        "PLN_2klvnxb9r1exmhi",

    pro:
        "PLN_g3m0doyhzmgp4y7"

};


// ======================================
// PAYMENT STATUS
// ======================================

const paymentStatus =
    document.getElementById(
        "paymentStatus"
    );


// ======================================
// START PAYSTACK PAYMENT
// ======================================

async function startPaystackPayment(
    planCode
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


        if (error || !data.user) {

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
                "Opening secure payment...";

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
                            "✅ Payment successful! Your subscription is active.";

                    }


                    // ==================================
                    // UNLOCK AFTER PAYMENT
                    // ==================================

                    unlockVoiceStudio();

                    if (pricingSection) {

                        pricingSection.style.display =
                            "none";

                    }


                    if (status) {

                        status.textContent =
                            "✅ Subscription active. You can continue generating voices.";

                    }

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

    }

    catch (error) {

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
// BASIC BUTTON
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
                PAYSTACK_PLANS.basic
            );

        }
    );

}


// ======================================
// STANDARD BUTTON
// ======================================

const standardPlanButton =
    document.getElementById(
        "standardPlanButton"
    );


if (standardPlanButton) {

    standardPlanButton.addEventListener(
        "click",
        () => {

            startPaystackPayment(
                PAYSTACK_PLANS.standard
            );

        }
    );

}


// ======================================
// PRO BUTTON
// ======================================

const proPlanButton =
    document.getElementById(
        "proPlanButton"
    );


if (proPlanButton) {

    proPlanButton.addEventListener(
        "click",
        () => {

            startPaystackPayment(
                PAYSTACK_PLANS.pro
            );

        }
    );

}

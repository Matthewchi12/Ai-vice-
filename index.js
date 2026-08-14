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


// ==========================================
// BROWSER SPEECH ENGINE
// ==========================================

const synth = window.speechSynthesis;

let voices = [];


// ==========================================
// ONLY THESE FOUR VOICE OPTIONS
// ==========================================

const voiceTypes = {

    ukMan: {
        language: "en-GB",
        gender: "male"
    },

    ukWoman: {
        language: "en-GB",
        gender: "female"
    },

    usMan: {
        language: "en-US",
        gender: "male"
    },

    usWoman: {
        language: "en-US",
        gender: "female"
    }

};


// ==========================================
// LOAD AVAILABLE BROWSER VOICES
// ==========================================

function loadVoices() {

    voices = synth.getVoices();

    if (!voices.length) {
        return;
    }

    voiceSelect.innerHTML = "";


    // UK MAN
    addVoiceOption(
        "ukMan",
        "🇬🇧 UK Man"
    );


    // US MAN
    addVoiceOption(
        "usMan",
        "🇺🇸 American Man"
    );


    // UK WOMAN
    addVoiceOption(
        "ukWoman",
        "🇬🇧 UK Woman"
    );


    // US WOMAN
    addVoiceOption(
        "usWoman",
        "🇺🇸 American Woman"
    );


    // Select UK Man by default

    voiceSelect.value = "ukMan";

}


// ==========================================
// CREATE THE FOUR OPTIONS
// ==========================================

function addVoiceOption(
    value,
    text
) {

    const option =
        document.createElement("option");

    option.value = value;

    option.textContent = text;

    voiceSelect.appendChild(option);

}


// ==========================================
// FIND THE BEST AVAILABLE VOICE
// ==========================================

function findVoice(
    type
) {

    const settings =
        voiceTypes[type];


    const language =
        settings.language;


    const gender =
        settings.gender;


    // --------------------------------------
    // FIRST: Try exact language
    // --------------------------------------

    let matches =
        voices.filter(
            voice =>
                voice.lang === language
        );


    // --------------------------------------
    // SECOND: Try language prefix
    // --------------------------------------

    if (!matches.length) {

        matches =
            voices.filter(
                voice =>
                    voice.lang
                        .toLowerCase()
                        .startsWith(
                            language
                                .substring(0, 2)
                                .toLowerCase()
                        )
            );

    }


    // --------------------------------------
    // Look for gender in voice name
    // --------------------------------------

    const genderMatches =
        matches.filter(
            voice => {

                const name =
                    voice.name.toLowerCase();


                if (
                    gender === "male"
                ) {

                    return (
                        name.includes("male") ||
                        name.includes("man") ||
                        name.includes("guy") ||
                        name.includes("david") ||
                        name.includes("daniel") ||
                        name.includes("george") ||
                        name.includes("alex")
                    );

                }


                if (
                    gender === "female"
                ) {

                    return (
                        name.includes("female") ||
                        name.includes("woman") ||
                        name.includes("samantha") ||
                        name.includes("zira") ||
                        name.includes("susan") ||
                        name.includes("hazel") ||
                        name.includes("sara") ||
                        name.includes("victoria")
                    );

                }


                return false;

            }
        );


    if (genderMatches.length) {

        return genderMatches[0];

    }


    // --------------------------------------
    // If gender isn't exposed by browser,
    // use a sensible voice from that language
    // --------------------------------------

    if (matches.length) {

        return matches[0];

    }


    return null;

}


// ==========================================
// LOAD VOICES
// ==========================================

loadVoices();


if (
    "onvoiceschanged" in synth
) {

    synth.onvoiceschanged =
        loadVoices;

}


// ==========================================
// CHARACTER COUNTER
// ==========================================

text.addEventListener(
    "input",
    function () {

        count.textContent =
            text.value.length;

    }
);


// ==========================================
// SPEED
// ==========================================

rate.addEventListener(
    "input",
    function () {

        rateValue.textContent =
            rate.value;

    }
);


// ==========================================
// PITCH
// ==========================================

pitch.addEventListener(
    "input",
    function () {

        pitchValue.textContent =
            pitch.value;

    }
);


// ==========================================
// CREATE SPEECH
// ==========================================

function createSpeech() {

    const value =
        text.value.trim();


    if (!value) {

        status.textContent =
            "Please enter your script.";

        return null;

    }


    const selectedType =
        voiceSelect.value;


    const selectedVoice =
        findVoice(
            selectedType
        );


    if (!selectedVoice) {

        status.textContent =
            "This voice is not available on your device.";

        return null;

    }


    const speech =
        new SpeechSynthesisUtterance(
            value
        );


    speech.voice =
        selectedVoice;


    speech.lang =
        selectedVoice.lang;


    speech.rate =
        Number(rate.value);


    speech.pitch =
        Number(pitch.value);


    speech.volume =
        1;


    return speech;

}


// ==========================================
// PLAY
// ==========================================

playButton.addEventListener(
    "click",
    function () {

        const speech =
            createSpeech();


        if (!speech) {
            return;
        }


        synth.cancel();


        speech.onstart =
            function () {

                status.textContent =
                    "🔊 Speaking...";

            };


        speech.onend =
            function () {

                status.textContent =
                    "Finished.";

            };


        speech.onerror =
            function (event) {

                console.log(
                    event
                );


                status.textContent =
                    "Unable to play this voice.";

            };


        synth.speak(
            speech
        );

    }
);


// ==========================================
// PAUSE
// ==========================================

pauseButton.addEventListener(
    "click",
    function () {

        if (
            synth.speaking
        ) {

            synth.pause();

            status.textContent =
                "⏸ Paused.";

        }

    }
);


// ==========================================
// RESUME
// ==========================================

resumeButton.addEventListener(
    "click",
    function () {

        if (
            synth.paused
        ) {

            synth.resume();

            status.textContent =
                "▶ Speaking...";

        }

    }
);


// ==========================================
// STOP
// ==========================================

stopButton.addEventListener(
    "click",
    function () {

        synth.cancel();

        status.textContent =
            "⏹ Stopped.";

    }
);
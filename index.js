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

const synth = window.speechSynthesis;

let voices = [];


// ======================================
// LOAD VOICES
// ======================================

function loadVoices() {

    voices = synth.getVoices();

    console.log("Voices:", voices);

    voiceSelect.innerHTML = "";

    if (voices.length === 0) {

        const option =
            document.createElement("option");

        option.textContent =
            "Loading voices...";

        voiceSelect.appendChild(option);

        return;
    }


    // Show available English voices

    const englishVoices =
        voices.filter(
            voice =>
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
        );


    englishVoices.forEach(
        (voice, index) => {

            const option =
                document.createElement("option");

            option.value =
                voice.name;

            option.textContent =
                `${voice.name} (${voice.lang})`;

            voiceSelect.appendChild(option);

        }
    );


    // If no English voice exists,
    // show all voices

    if (englishVoices.length === 0) {

        voices.forEach(
            voice => {

                const option =
                    document.createElement("option");

                option.value =
                    voice.name;

                option.textContent =
                    `${voice.name} (${voice.lang})`;

                voiceSelect.appendChild(option);

            }
        );

    }

}


// Try immediately
loadVoices();


// Some browsers load them later
synth.onvoiceschanged =
    loadVoices;


// ======================================
// CHARACTER COUNTER
// ======================================

text.addEventListener(
    "input",
    function () {

        count.textContent =
            text.value.length;

    }
);


// ======================================
// SPEED
// ======================================

rate.addEventListener(
    "input",
    function () {

        rateValue.textContent =
            rate.value;

    }
);


// ======================================
// PITCH
// ======================================

pitch.addEventListener(
    "input",
    function () {

        pitchValue.textContent =
            pitch.value;

    }
);


// ======================================
// GET SELECTED VOICE
// ======================================

function getSelectedVoice() {

    const selectedName =
        voiceSelect.value;


    return voices.find(
        voice =>
            voice.name ===
            selectedName
    );

}


// ======================================
// SPEAK
// ======================================

playButton.addEventListener(
    "click",
    function () {

        const message =
            text.value.trim();


        if (!message) {

            status.textContent =
                "Please type something first.";

            return;

        }


        // Stop anything currently speaking

        synth.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                message
            );


        const selectedVoice =
            getSelectedVoice();


        if (selectedVoice) {

            utterance.voice =
                selectedVoice;

            utterance.lang =
                selectedVoice.lang;

        } else {

            // Safe fallback

            utterance.lang =
                "en-US";

        }


        utterance.rate =
            Number(rate.value);


        utterance.pitch =
            Number(pitch.value);


        utterance.volume =
            1;


        utterance.onstart =
            function () {

                status.textContent =
                    "🎤 Speaking...";

            };


        utterance.onend =
            function () {

                status.textContent =
                    "✅ Finished.";

            };


        utterance.onerror =
            function (event) {

                console.log(
                    "Speech error:",
                    event
                );


                status.textContent =
                    "❌ Speech failed.";

            };


        // Speak

        synth.speak(
            utterance
        );

    }
);


// ======================================
// PAUSE
// ======================================

pauseButton.addEventListener(
    "click",
    function () {

        if (synth.speaking) {

            synth.pause();

            status.textContent =
                "⏸ Paused.";

        }

    }
);


// ======================================
// RESUME
// ======================================

resumeButton.addEventListener(
    "click",
    function () {

        if (synth.paused) {

            synth.resume();

            status.textContent =
                "▶️ Speaking...";

        }

    }
);


// ======================================
// STOP
// ======================================

stopButton.addEventListener(
    "click",
    function () {

        synth.cancel();

        status.textContent =
            "⏹ Stopped.";

    }
);

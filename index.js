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
// RENDER BACKEND
// ======================================

const API_URL =
    "https://ai-voice-backend-pl9h.onrender.com/tts";


// ======================================
// GEMINI VOICES
// ======================================

const voices = {

    ukMale: "Charon",

    ukFemale: "Aoede",

    usMale: "Puck",

    usFemale: "Kore"

};


voiceSelect.innerHTML = "";

const voiceOptions = [

    ["ukMale", "🇬🇧 UK Man"],

    ["ukFemale", "🇬🇧 UK Woman"],

    ["usMale", "🇺🇸 American Man"],

    ["usFemale", "🇺🇸 American Woman"]

];


voiceOptions.forEach(
    ([value, name]) => {

        const option =
            document.createElement("option");

        option.value = value;

        option.textContent = name;

        voiceSelect.appendChild(option);

    }
);


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
// GENERATE AUDIO
// ======================================

async function generateAudio() {

    const script =
        text.value.trim();

    if (!script) {

        status.textContent =
            "Please enter your script.";

        return null;

    }


    const selectedVoice =
        voices[voiceSelect.value];


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

                        voice:
                            selectedVoice

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Voice generation failed."
            );

        }


        if (!data.audio) {

            throw new Error(
                "No audio was returned."
            );

        }


        const mimeType =
            data.mimeType ||
            "audio/wav";


        const binary =
            atob(data.audio);


        const bytes =
            new Uint8Array(
                binary.length
            );


        for (
            let i = 0;
            i < binary.length;
            i++
        ) {

            bytes[i] =
                binary.charCodeAt(i);

        }


        const blob =
            new Blob(
                [bytes],
                {
                    type: mimeType
                }
            );


        const audioURL =
            URL.createObjectURL(blob);


        status.textContent =
            "✅ Voice generated.";

        return {
            blob,
            audioURL
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

        const result =
            await generateAudio();


        if (!result) return;


        const audio =
            new Audio(
                result.audioURL
            );


        audio.play();


        audio.onended =
            () => {

                status.textContent =
                    "Finished.";

            };

    }
);


// ======================================
// PAUSE
// ======================================

let currentAudio = null;


pauseButton.addEventListener(
    "click",
    () => {

        if (currentAudio) {

            currentAudio.pause();

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
    () => {

        if (currentAudio) {

            currentAudio.play();

            status.textContent =
                "▶ Speaking...";

        }

    }
);


// ======================================
// STOP
// ======================================

stopButton.addEventListener(
    "click",
    () => {

        if (currentAudio) {

            currentAudio.pause();

            currentAudio.currentTime = 0;

        }

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

        const result =
            await generateAudio();


        if (!result) return;


        const link =
            document.createElement("a");


        link.href =
            result.audioURL;


        link.download =
            "voice-over.wav";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        status.textContent =
            "⬇️ Audio downloaded.";

    }
);

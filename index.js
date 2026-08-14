 // ============================================
// VOICE OVER STUDIO - index.js
// ============================================

const text = document.getElementById("text");
const voice = document.getElementById("voice");

const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const stopButton = document.getElementById("stop");
const generateButton = document.getElementById("generate");
const downloadButton = document.getElementById("download");

const audio = document.getElementById("audio");
const status = document.getElementById("status");

const rate = document.getElementById("rate");
const pitch = document.getElementById("pitch");


// ============================================
// AUDIO FILE
// ============================================

let audioURL = null;


// ============================================
// AVAILABLE HUMAN VOICES
// ============================================

const voices = {

    ukMale: {
        name: "UK Male",
        id: "en-GB-male"
    },

    ukFemale: {
        name: "UK Female",
        id: "en-GB-female"
    },

    usMale: {
        name: "American Male",
        id: "en-US-male"
    },

    usFemale: {
        name: "American Female",
        id: "en-US-female"
    }

};


// ============================================
// LOAD VOICES INTO SELECT
// ============================================

function loadVoices() {

    voice.innerHTML = "";

    Object.entries(voices).forEach(
        ([key, data]) => {

            const option =
                document.createElement("option");

            option.value = data.id;

            option.textContent =
                data.name;

            voice.appendChild(option);

        }
    );

}


// Load voices
loadVoices();


// ============================================
// GENERATE HUMAN VOICE
// ============================================

generateButton.addEventListener(
    "click",
    async function () {

        const script =
            text.value.trim();


        if (!script) {

            status.textContent =
                "Please enter your script.";

            return;

        }


        status.textContent =
            "🎤 Creating natural human voice...";


        generateButton.disabled =
            true;

        downloadButton.disabled =
            true;


        try {

            /*
             * IMPORTANT:
             *
             * Replace this URL with the
             * TTS provider you choose.
             */

            const response =
                await fetch(
                    "YOUR_TTS_API_ENDPOINT",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            text: script,

                            voice:
                                voice.value,

                            rate:
                                Number(rate.value),

                            pitch:
                                Number(pitch.value),

                            format:
                                "mp3"

                        })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "TTS request failed"
                );

            }


            // ==================================
            // GET ACTUAL MP3
            // ==================================

            const blob =
                await response.blob();


            if (!blob.size) {

                throw new Error(
                    "Empty audio file"
                );

            }


            // Remove previous audio URL

            if (audioURL) {

                URL.revokeObjectURL(
                    audioURL
                );

            }


            // Create new MP3 URL

            audioURL =
                URL.createObjectURL(
                    blob
                );


            // ==================================
            // PUT AUDIO INTO PLAYER
            // ==================================

            audio.src =
                audioURL;


            audio.style.display =
                "block";


            audio.load();


            // ==================================
            // ENABLE BUTTONS
            // ==================================

            playButton.disabled =
                false;

            pauseButton.disabled =
                false;

            stopButton.disabled =
                false;

            downloadButton.disabled =
                false;


            status.textContent =
                "✅ Voice-over ready. Press Play to listen.";

        }

        catch (error) {

            console.error(error);

            status.textContent =
                "❌ Could not generate the voice.";

        }

        finally {

            generateButton.disabled =
                false;

        }

    }
);


// ============================================
// PLAY
// ============================================

playButton.addEventListener(
    "click",
    function () {

        if (!audioURL) {

            status.textContent =
                "Generate the voice first.";

            return;

        }


        audio.play();


        status.textContent =
            "▶️ Playing...";

    }
);


// ============================================
// PAUSE
// ============================================

pauseButton.addEventListener(
    "click",
    function () {

        audio.pause();


        status.textContent =
            "⏸️ Paused.";

    }
);


// ============================================
// STOP
// ============================================

stopButton.addEventListener(
    "click",
    function () {

        audio.pause();

        audio.currentTime =
            0;


        status.textContent =
            "⏹️ Stopped.";

    }
);


// ============================================
// DOWNLOAD MP3
// ============================================

downloadButton.addEventListener(
    "click",
    function () {

        if (!audioURL) {

            status.textContent =
                "Generate the voice first.";

            return;

        }


        const link =
            document.createElement("a");


        link.href =
            audioURL;


        link.download =
            "my-voiceover.mp3";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        status.textContent =
            "⬇️ MP3 downloaded. You can import it into CapCut.";

    }
);


// ============================================
// WHEN AUDIO FINISHES
// ============================================

audio.addEventListener(
    "ended",
    function () {

        status.textContent =
            "Voice-over finished.";

    }
);

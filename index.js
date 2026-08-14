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

const synth = window.speechSynthesis;

let voices = [];


// ======================================
// LOAD VOICES
// ======================================

function loadVoices() {

    voices = synth.getVoices();

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
}

loadVoices();

synth.onvoiceschanged = loadVoices;


// ======================================
// FIND VOICE
// ======================================

function findVoice(type) {

    let language = "";
    let genderWords = [];

    if (type === "ukMale") {
        language = "en-GB";
        genderWords = [
            "male",
            "man",
            "daniel",
            "george",
            "oliver"
        ];
    }

    if (type === "ukFemale") {
        language = "en-GB";
        genderWords = [
            "female",
            "woman",
            "hazel",
            "susan",
            "victoria"
        ];
    }

    if (type === "usMale") {
        language = "en-US";
        genderWords = [
            "male",
            "man",
            "david",
            "mark",
            "alex"
        ];
    }

    if (type === "usFemale") {
        language = "en-US";
        genderWords = [
            "female",
            "woman",
            "samantha",
            "zira",
            "susan"
        ];
    }

    let matches = voices.filter(
        voice =>
            voice.lang === language
    );

    let genderMatch = matches.find(
        voice => {

            const name =
                voice.name.toLowerCase();

            return genderWords.some(
                word =>
                    name.includes(word)
            );
        }
    );

    return genderMatch || matches[0];
}


// ======================================
// CREATE SPEECH
// ======================================

function createSpeech() {

    const value =
        text.value.trim();

    if (!value) {

        status.textContent =
            "Please enter some text.";

        return null;
    }

    const utterance =
        new SpeechSynthesisUtterance(value);

    const selectedVoice =
        findVoice(voiceSelect.value);

    if (selectedVoice) {

        utterance.voice =
            selectedVoice;

        utterance.lang =
            selectedVoice.lang;
    }

    utterance.rate =
        Number(rate.value);

    utterance.pitch =
        Number(pitch.value);

    utterance.volume = 1;

    return utterance;
}


// ======================================
// PLAY
// ======================================

playButton.addEventListener(
    "click",
    () => {

        const utterance =
            createSpeech();

        if (!utterance) return;

        synth.cancel();

        utterance.onstart = () => {

            status.textContent =
                "🎤 Speaking...";

        };

        utterance.onend = () => {

            status.textContent =
                "Finished.";

        };

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
    () => {

        synth.pause();

        status.textContent =
            "Paused.";

    }
);


// ======================================
// RESUME
// ======================================

resumeButton.addEventListener(
    "click",
    () => {

        synth.resume();

        status.textContent =
            "Speaking...";

    }
);


// ======================================
// STOP
// ======================================

stopButton.addEventListener(
    "click",
    () => {

        synth.cancel();

        status.textContent =
            "Stopped.";

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
// DOWNLOAD
// ======================================

downloadButton.addEventListener(
    "click",
    async () => {

        status.textContent =
            "Preparing browser audio...";

        /*
        IMPORTANT:

        The browser's SpeechSynthesis API
        does NOT expose its audio stream.

        Therefore JavaScript cannot directly
        record speechSynthesis into a WebM/MP3
        file.

        The browser must provide an audio
        capture stream, such as tab/system
        audio capture.
        */


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getDisplayMedia
        ) {

            status.textContent =
                "Your browser does not support browser audio capture.";

            return;
        }


        try {

            status.textContent =
                "Choose this browser tab and enable audio.";

            const displayStream =
                await navigator
                    .mediaDevices
                    .getDisplayMedia({

                        video: true,

                        audio: true

                    });


            const audioTracks =
                displayStream.getAudioTracks();


            if (!audioTracks.length) {

                displayStream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

                status.textContent =
                    "Audio sharing was not enabled.";

                return;
            }


            const audioStream =
                new MediaStream(
                    audioTracks
                );


            const recorder =
                new MediaRecorder(
                    audioStream
                );


            const chunks = [];


            recorder.ondataavailable =
                event => {

                    if (
                        event.data.size > 0
                    ) {

                        chunks.push(
                            event.data
                        );

                    }

                };


            recorder.onstop =
                () => {

                    const blob =
                        new Blob(
                            chunks,
                            {
                                type:
                                    "audio/webm"
                            }
                        );


                    const url =
                        URL.createObjectURL(
                            blob
                        );


                    const link =
                        document.createElement(
                            "a"
                        );


                    link.href = url;

                    link.download =
                        "voice-over.webm";


                    document.body.appendChild(
                        link
                    );


                    link.click();


                    link.remove();


                    URL.revokeObjectURL(
                        url
                    );


                    displayStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );


                    status.textContent =
                        "✅ Audio downloaded. Import voice-over.webm into CapCut.";

                };


            recorder.start();


            const utterance =
                createSpeech();


            if (!utterance) {

                recorder.stop();

                return;
            }


            utterance.onstart =
                () => {

                    status.textContent =
                        "🎤 Recording voice...";

                };


            utterance.onend =
                () => {

                    setTimeout(
                        () => {

                            if (
                                recorder.state !==
                                "inactive"
                            ) {

                                recorder.stop();

                            }

                        },
                        500
                    );

                };


            utterance.onerror =
                () => {

                    if (
                        recorder.state !==
                        "inactive"
                    ) {

                        recorder.stop();

                    }

                    status.textContent =
                        "Speech generation failed.";

                };


            synth.cancel();

            synth.speak(
                utterance
            );

        }

        catch (error) {

            console.error(error);

            status.textContent =
                "Audio recording was cancelled or unavailable.";

        }

    }
);

const DeepSpeech = require('deepspeech');
const Fs = require('fs');
const Sox = require('sox-stream');
const MemoryStream = require('memory-stream');
const Duplex = require('stream').Duplex;
const Wav = require('node-wav');

/* const DEEPSPEECH_MODEL = __dirname + '/models/deepspeech-0.8.0-models';
let SILENCE_THRESHOLD = 200; // how many milliseconds of inactivity before processing the audio

// const VAD_MODE = VAD.Mode.NORMAL;
// const VAD_MODE = VAD.Mode.LOW_BITRATE;
// const VAD_MODE = VAD.Mode.AGGRESSIVE;
const VAD_MODE = VAD.Mode.VERY_AGGRESSIVE;
const vad = new VAD(VAD_MODE);

function createModel(modelDir) {
    let modelPath = modelDir + '.pbmm';
    let scorerPath = modelDir + '.scorer';
    let model = new DeepSpeech.Model(modelPath);
    model.enableExternalScorer(scorerPath);
    return model;
}

let englishModel = createModel(DEEPSPEECH_MODEL);

let modelStream;
let recordedChunks = 0;
let silenceStart = null;
let recordedAudioLength = 0;
let endTimeout = null;
let silenceBuffers = [];
let firstChunkVoice = false;

function processAudioStream(data, callback) {
    vad.processAudio(data, 16000).then(res => {
        if (firstChunkVoice) {
            firstChunkVoice = false;
            processVoice(data);
            return;
        }
        switch (res) {
            case VAD.Event.ERROR:
                console.log('VAD ERROR');
                break;
            case VAD.Event.NOISE:
                console.log('VAD NOISE');
                break;
            case VAD.Event.SILENCE:
                processSilence(data, callback);
                break;
            case VAD.Event.VOICE:
                processVoice(data);
                break;
            default:
                console.log('default', res);
        }
    });

    // timeout after 1s of inactivity
    clearTimeout(endTimeout);
    endTimeout = setTimeout(function () {
        console.log('timeout');
        resetAudioStream();
    }, SILENCE_THRESHOLD * 3);
}

function endAudioStream(callback) {
    console.log('[end]');
    let results = intermediateDecode();
    if (results) {
        if (callback) {
            callback(results);
        }
    }
}

function resetAudioStream() {
    clearTimeout(endTimeout);
    console.log('[reset]');
    intermediateDecode(); // ignore results
    recordedChunks = 0;
    silenceStart = null;
}

function processSilence(data, callback) {
    if (recordedChunks > 0) {
        // recording is on
        process.stdout.write('-'); // silence detected while recording

        feedAudioContent(data);

        if (silenceStart === null) {
            silenceStart = new Date().getTime();
        } else {
            let now = new Date().getTime();
            if (now - silenceStart > SILENCE_THRESHOLD) {
                silenceStart = null;
                console.log('[end]');
                let results = intermediateDecode();
                if (results) {
                    if (callback) {
                        callback(results);
                    }
                }
            }
        }
    } else {
        process.stdout.write('.'); // silence detected while not recording
        bufferSilence(data);
    }
}

function bufferSilence(data) {
    // VAD has a tendency to cut the first bit of audio data from the start of a recording
    // so keep a buffer of that first bit of audio and in addBufferedSilence() reattach it to the beginning of the recording
    silenceBuffers.push(data);
    if (silenceBuffers.length >= 3) {
        silenceBuffers.shift();
    }
}

function addBufferedSilence(data) {
    let audioBuffer;
    if (silenceBuffers.length) {
        silenceBuffers.push(data);
        let length = 0;
        silenceBuffers.forEach(function (buf) {
            length += buf.length;
        });
        audioBuffer = Buffer.concat(silenceBuffers, length);
        silenceBuffers = [];
    } else audioBuffer = data;
    return audioBuffer;
}

function processVoice(data) {
    silenceStart = null;
    if (recordedChunks === 0) {
        console.log('');
        process.stdout.write('[start]'); // recording started
    } else {
        process.stdout.write('='); // still recording
    }
    recordedChunks++;

    data = addBufferedSilence(data);
    feedAudioContent(data);
}

function createStream() {
    modelStream = englishModel.createStream();
    recordedChunks = 0;
    recordedAudioLength = 0;
}

function finishStream() {
    if (modelStream) {
        let start = new Date();
        let text = modelStream.finishStream();
        if (text) {
            let recogTime = new Date().getTime() - start.getTime();
            return {
                text,
                recogTime,
                audioLength: Math.round(recordedAudioLength),
            };
        }
    }
    silenceBuffers = [];
    modelStream = null;
}

function intermediateDecode() {
    let results = finishStream();
    createStream();
    return results;
}

function feedAudioContent(chunk) {
    recordedAudioLength += (chunk.length / 2) * (1 / 16000) * 1000;
    modelStream.feedAudioContent(chunk);
}

function onRecognize(results) {
    if (results.text === 'quit') {
        console.log('quitting...');
    } else {
        console.log('recognized:', results);
    }
} */

let modelPath = './models/deepspeech-0.8.0-models.pbmm';

let model = new DeepSpeech.Model(modelPath);

let desiredSampleRate = model.sampleRate();

let scorerPath = './models/deepspeech-0.8.0-models.scorer';

model.enableExternalScorer(scorerPath);



module.exports = async function listenToUser(member) {
    const connection = await member.voice.channel.join();

    /* createStream(); */

    const audioStream = connection.receiver.createStream(member, { mode: 'pcm' });

    /* audioStream.on('data', function (data) {
        processAudioStream(data, results => {
            onRecognize(results);
        });
    }); */

    audioStream.on('end', () => {
        let audioBuffer = audioStream.toBuffer();
    
        const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate);
        console.log('audio length', audioLength);
    
        let result = model.stt(audioBuffer);
    
        console.log('result:', result);
    });

    /* stream.on('close', () => console.log('stream closed')) */
};

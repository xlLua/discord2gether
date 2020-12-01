const DeepSpeech = require('deepspeech');
const MemoryStream = require('memory-stream');
const prism = require('prism-media');

let modelPath = './models/deepspeech-0.9.1-models.pbmm';
let scorerPath = './models/deepspeech-0.9.1-models.scorer';
let model = new DeepSpeech.Model(modelPath);
let desiredSampleRate = model.sampleRate();
model.enableExternalScorer(scorerPath);

module.exports = async function listenToUser({ member, playFromDir, inspireMe }) {
    const connection = await member.voice.channel.join();

    const audioStream = connection.receiver.createStream(member);

    const decodedStream = new prism.opus.Decoder({ channels: 1, rate: 16000, frameSize: 2000 });
    audioStream.pipe(decodedStream);

    let memoryStream = new MemoryStream();
    decodedStream.pipe(memoryStream);

    decodedStream.on('finish', () => {
        let audioBuffer = memoryStream.toBuffer();
        const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate);

        console.log(member.user.username, ' spoke for ', audioLength);

        if (audioLength >= 1.4 || audioLength <= .7) {
            // console.log('Not worth, ', member.user.username, 'spoke for more than 1.6 seconds or less than .6 seconds.');
            return;
        }

        let result = model.stt(audioBuffer);

        console.log(member.user.username, result);

        if (
            result.includes('nice') ||
            ['he is', 'i', 'this', 'is', 'night', 'nights', 'it', 'my', 'most', 'like'].includes(result)
        ) {
            playFromDir(member.voice.channel, './sounds/nice/');
            return console.log(member.user.username, '(probably) nice:', result);
        }

        if (result.includes('inspire') || ['spare me', 'aspiring', 'in spite'].includes(result)) {
            return inspireMe();
        }

        if (result.includes('music')) {
            return console.log(member.user.username, '(probably) music:', result);
        }

        if (result) {
            console.log(member.user.username, result);
        }
    });
};

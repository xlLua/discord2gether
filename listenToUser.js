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

    let audioLength = 0;
    const modelStream = model.createStream();

    const numberOfSilenceBytes = 2000; // 16000bits -> 2000bytes -> 250ms is 500bytes
    modelStream.feedAudioContent(Buffer.alloc(numberOfSilenceBytes, 0));

    decodedStream.on('data', data => {
        audioLength += (data.length / 2) * (1 / desiredSampleRate);

        if (audioLength >= 1.4) {
            // Do not uncomment, spams console and slows things down
            // console.log('Stopped feeding audio to model, ', member.user.username, 'spoke for more than 1.4 seconds.');
            return;
        }

        modelStream.feedAudioContent(data);
    });

    decodedStream.on('finish', () => {
        console.log(member.user.username, ' spoke for ', audioLength);

        if (audioLength < .5) {
            return;
        }

        let result = modelStream.finishStream();

        console.log(member.user.username, result);

        if (
            result.includes('nice') ||
            ['he is', 'this', 'is', 'night', 'nights', 'it', 'my', 'most', 'like'].includes(result)
        ) {
            playFromDir(member.voice.channel, './sounds/nice/');
            return console.log(member.user.username, '(probably) nice:', result);
        }

        if (result.includes('inspire') || ['spare me', 'in sparing me', 'aspiring', 'in spite', 'despite me in', 'despite me', 'being spied me'].includes(result)) {
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

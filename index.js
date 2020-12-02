const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const vision = require('@google-cloud/vision');
const selectRandomFile = require('./helpers/select-random-file');
const listenToUser = require('./listenToUser');

require('dotenv').config();

let generalChannel = null;
let lastEmbeddedVideoUrl = null;
let democratMode = false;
let republicanMode = false;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    generalChannel = client.channels.cache.find(channel => channel.name === 'general');
});

client.on('message', msg => {
    const [url] = msg.content.match(
        /((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?/
    ) || [null];

    lastEmbeddedVideoUrl = url || lastEmbeddedVideoUrl;

    if (msg.content.startsWith('w2g')) {
        getWatchTogetherLink(lastEmbeddedVideoUrl).then(url => msg.reply(`Room created at: ${url}`));

        return;
    }

    if (msg.content === 'democrat mode') {
        democratMode = !democratMode;
        msg.reply('Democrat mode is now ' + (democratMode ? 'on' : 'off'));
    }

    if (msg.content === 'republican mode') {
        republicanMode = !republicanMode;
        msg.reply('Republican mode is now ' + (republicanMode ? 'on' : 'off'));
    }

    if (msg.content.toLowerCase().includes('inspir')) {
        inspireMe(msg.channel);
    }
});

function inspireMe(channel = generalChannel) {
    if (!channel) {
        return;
    }

    getFastQuote().then(({ quote, url }) => {
        console.log(url);
        const embed = new Discord.MessageEmbed().setImage(url);
        channel.send(quote, { tts: true, embed: embed });
    });
}

client.on('guildMemberSpeaking', (member, speaking) => {
    if (speaking.bitfield) {
        listenToUser({ member, playFromDir, inspireMe });
    }

    if (democratMode && speaking.bitfield > 0) {
        playFromDir(member.voice.channel, './sounds/biden/');
    }
    if (republicanMode && speaking.bitfield > 0) {
        playFromDir(member.voice.channel, './sounds/trump/');
    }
});

// client.on('typingStart', (channel, user) => {
// console.log(user.presence);
// if (user.presence.member.voice) {
//     playFromDir(user.presence.member.voice.channel, './sounds/typing/')
// }
// });

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.channel !== newState.channel) {
        // left general
        if (oldState.channel && oldState.channel.name === 'General') {
            playFromDir(oldState.channel, './sounds/disconnected/');
        }

        // joined general
        if (newState.channel && newState.channel.name === 'General') {
        }
    }

    // unmute
    if (oldState.selfDeaf && !newState.selfDeaf) {
        playFromDir(oldState.channel, './sounds/undeafened/');
    }
});

client.login(process.env.DISCORD_TOKEN);

async function getWatchTogetherLink(videoUrl = '') {
    const response = await fetch('https://w2g.tv/rooms/create.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            share: videoUrl,
            api_key: process.env.W2G_API_KEY,
        }),
    });

    const res = await response.json();

    return `https://w2g.tv/rooms/${res.streamkey}`;
}

let quotePromise;
async function getFastQuote() {
    if (quotePromise) {
        promiseToReturn = quotePromise;
    } else {
        promiseToReturn = getQuote();
    }

    quotePromise = getQuote();

    return promiseToReturn;
}
getFastQuote();

async function getQuote() {
    const response = await fetch('http://inspirobot.me/api?generate=true');

    const url = await response.text();

    const client = new vision.ImageAnnotatorClient();
    client.api_key;

    const [result] = await client.textDetection(url);
    let quote =
        result.textAnnotations[0]?.description ||
        'WATCH FOR MASSIVE BALLOT COUNTING ABUSE AND, JUST LIKE THE EARLY VACCINE, REMEMBER I TOLD YOU SO!';
    quote = quote.replace(/(\r\n|\n|\r)/gm, ' ').toLowerCase();

    console.log(quote);

    return { quote, url };
}

async function playFromDir(channel, dir) {
    const file = await selectRandomFile(dir);

    return play(channel, dir + file);
}

async function play(channel, file) {
    const connection = await channel.join();

    connection.play(file);
}

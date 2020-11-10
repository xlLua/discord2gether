const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const vision = require('@google-cloud/vision');

require('dotenv').config()

let lastEmbeddedVideoUrl = null;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    const [url] = msg.content.match(/((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?/) || [null];

    lastEmbeddedVideoUrl = url || lastEmbeddedVideoUrl;

    if (msg.content.startsWith('w2g')) {
        getWatchTogetherLink(lastEmbeddedVideoUrl)
            .then(url => msg.reply(`Room created at: ${url}`));

        return;
    }

    if (msg.content.toLowerCase().startsWith('inspire me')) {
        getQuote().then(({quote, url}) => {
            console.log(url);
            const embed = new Discord.MessageEmbed().setImage(url);
            msg.channel
                .send(quote, { tts: true, embed: embed});
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

async function getWatchTogetherLink(videoUrl = '') {
    const response = await fetch("https://w2g.tv/rooms/create.json", {
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

async function getQuote() {
    const response = await fetch("http://inspirobot.me/api?generate=true");

    const url = await response.text();

    const client = new vision.ImageAnnotatorClient();
    client.api_key

    const [result] = await client.textDetection(url);
    let quote = result.textAnnotations[0]?.description || 'WATCH FOR MASSIVE BALLOT COUNTING ABUSE AND, JUST LIKE THE EARLY VACCINE, REMEMBER I TOLD YOU SO!';
    quote = quote.replace(/(\r\n|\n|\r)/gm, " ").toLowerCase();

    console.log(quote);

    return {quote, url};
}

function textToSpeech(text) {
    console.log(text);
}
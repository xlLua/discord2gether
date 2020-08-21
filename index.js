const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
require('dotenv').config()

let lastEmbeddedVideoUrl = null;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    const embed = msg.embeds.find(embed => embed.type === 'video');

    lastEmbeddedVideoUrl = embed ? embed.url : lastEmbeddedVideoUrl;

    if (msg.content.startsWith('w2g')) {
        getWatchTogetherLink(lastEmbeddedVideoUrl)
            .then(url => msg.reply(`Room created at: ${url}`));
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

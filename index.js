const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const FormData = require('formdata-node');
require('dotenv').config()

var lastYoutubeUrl;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    
    //pushes every message in to an array
    if(msg.embeds[0] && msg.embeds[0].type == "video"){
       lastYoutubeUrl = msg.embeds[0].url;
    }

    if (!msg.content.startsWith('w2g')) {
        return;
    }

    //TO DO => could use regex here instead
    const videoUrl = msg.content.replace('w2g', '').trim() || lastYoutubeUrl;

    getWatchTogetherLink(videoUrl).then(url => msg.reply(`Room created at: ${url}`));
});

client.login(process.env.DISCORD_TOKEN);

async function getWatchTogetherLink(videoUrl = '') {

    const response = await fetch("https://w2g.tv/rooms/create.json", {
        method: "POST",
        json: {
            share: videoUrl,
            api_key: process.env.W2G_API_KEY,
        },
    });

    const res = await response.json();

    return `https://w2g.tv/rooms/${res.streamkey}`;
}

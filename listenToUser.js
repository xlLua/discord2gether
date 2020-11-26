const fs = require("fs");


module.exports = async function listenToUser(member) {
    async function listenToMember(member) {
        const connection = await member.voice.channel.join();

        console.log(member)

        const audio = connection.receiver.createStream(member, { mode: 'pcm' });
        
        

        /* stream.on('close', () => console.log('stream closed')) */
    }   
};

const Discord = require('discord.js');
const { prefix, token } = require('./disconfig.json');
const client = new Discord.Client();
const ga = require('./gsAPI.js');

ga.googleAPI();

client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {

    let msg = message.content;
    
    if(msg.substring(0,1) == '!') {
        let args = msg.substring(1).split(' ');

        console.log(args);
    }
});

client.login(token);
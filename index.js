const Discord = require('discord.js');
const {google} = require('googleapis');
const { prefix, token } = require('./disconfig.json');
const client = new Discord.Client();

const googclient = connect();

client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {
    
    let msg = message.content;
    
    if(msg.substring(0,1) == '!') {
        let args = msg.substring(1).split(' ');
        
        if(args.length == 2) {
            search(message, args);
        }
    }
});

client.login(token);

/* Functions */

function connect() {
    console.log('Connected to Google API');

    const keys = require('./credentials.json');
    
    const client = new google.auth.JWT(keys.client_email, null, keys.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    
    client.authorize(function(err, tokens) {
        if(err) {
            console.log(err);
            return;
        }
    });

    return client;
}

async function search(message, args, client = googclient) {

    const gsapi = google.sheets({version: 'v4', auth: client});
    
    const opt = {
        spreadsheetId: '10j-LLoQIdnMLGFUoPfs0hyjUjl13lv1d3ilAsxoNFNE',
        range: 'Data!A2:E',
    };

    let data = await gsapi.spreadsheets.values.get(opt);
    let dataArr = data.data.values;
    
    for(i in dataArr) {
        if(dataArr[i][0] == args[0] && dataArr[i][1] == args[1]) {
            let res_arr = dataArr[i];
            return message.channel.send(`Min: ${res_arr[2]}, max: ${res_arr[3]}, avg: ${res_arr[4]}`);
        }        
    }

    message.channel.send(`No records were found with ${args[0]} ${args[1]}`);

}
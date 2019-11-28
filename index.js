const Discord = require('discord.js');
const {google} = require('googleapis');
const { prefix, token } = require('./disconfig.json');
const client = new Discord.Client();
const keys = require('./credentials.json');

const googclient = connect();

client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {    
    let msg = message.content;
    
    if(msg.substring(0,1) == prefix) {
        let args = msg.substring(1).split(' ');

        
        if(args.length <= 6) {

            if(args.length == 2) {
                search(message, args);
            } else if(args[0] == 'add') {
                let reqArr = [];
                reqArr.push(args.slice(1));
                updateStore(message, reqArr);
            } else if (args[0] == 'test') {     // Dev purpose
                updateResultsSheet(args.slice(1));            
            } else {
                message.channel.send("I don't know this command.\nIn order to retrieve data from the table, please provide 2 argument after the exclamation mark.\nIf you want to add data to the table, please use command '!add' followed by 3 arguments");
            }

        } else {
            message.channel.send("Oops! Your request seems too long. I only store data in 5 columns.");
        }
        
    }
});

client.login(token);

/* Functions */

function connect() {
    console.log('Connected to Google API');
    
    const client = new google.auth.JWT(keys.client_email, null, keys.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    
    client.authorize(function(err, tokens) {
        if(err) {
            console.log(err);
            return;
        }
    });

    return client;
}

function search(message, args) {
    let dataArr = getData();

    for(i in dataArr) {
        if(dataArr[i][0] == args[0] && dataArr[i][1] == args[1]) {
            let res_arr = dataArr[i];
            return message.channel.send(`Min: ${res_arr[2]}, max: ${res_arr[3]}, avg: ${res_arr[4]}`);
        }        
    }
    
    message.channel.send(`No records were found with ${args[0]} ${args[1]}`);
}

async function updateResultsSheet(args, client = googclient) {
    
    const gsapi = google.sheets({version: 'v4', auth: client});
    
    const opt = {
        spreadsheetId: keys.spreadsheet_id,
        range: 'data_store!A2:C',
    };
    
    let data = await gsapi.spreadsheets.values.get(opt);
    let store_items = data.data.values;
    
    let res_arr = [];

    for (i in store_items) {
        if (store_items[i][0] == args[0] && store_items[i][1] == args[1]) {
            res_arr.push(store_items[i]);
            var res_index = Number(i) + 2;
        }
    }

    let end = res_arr.length > 1 ? res_arr.length - 1 : res_index;
    
    const opt2 = {
        spreadsheetId: keys.spreadsheet_id,
        range: 'data_results!A2:E'
    }

    let data2 = await gsapi.spreadsheets.values.get(opt2);
    let result_items = data2.data.values;

    if (result_items) {
    
        for (i in result_items) {
            
            if (result_items[i][0] == args[0] && result_items[i][1] == args[1]) {
                let start = Number(i) + 2;
                let fn_range = [start, end];
                console.log('exists');
                return modifyResultsRow(args, fn_range);
            }
            
        }
        
        let fn_range = [res_index, end];
        console.log('does not exist');
        return updateResults(args, fn_range);
        
    } else {
        let fn_range = res_arr ? [2, res_arr.length + 1] : [2, 2];
        return updateResults(args, fn_range);

    }

}

async function getData(client = googclient) {
    const gsapi = google.sheets({version: 'v4', auth: client});
    
    const opt = {
        spreadsheetId: keys.spreadsheet_id,
        range: 'data_results!A2:E',
    };
    
    let data = await gsapi.spreadsheets.values.get(opt);
    return data.data.values;    
}

async function updateStore(message, args, client = googclient) {   

    const gsapi = google.sheets({version: 'v4', auth: client});

    const opt = {
        spreadsheetId: keys.spreadsheet_id,
        range: 'data_store!A2:C',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: args }
    };

    await gsapi.spreadsheets.values.append(opt, (err) => {
        if(err) {
            console.log(err);
            message.channel.send('An error has occurred. Please check the console or try again.');
            return;
        }
        message.channel.send(`New row has been added to the table as col 1: ${args[0][0]}, col 2: ${args[0][1]}, value: ${args[0][2]}`);
    });

}

async function updateResults(args, range, client = googclient) {   

    const gsapi = google.sheets({version: 'v4', auth: client});

    const opt = {
        spreadsheetId: keys.spreadsheet_id,
        range: 'data_results!A2:E',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [[
            args[0],
            args[1],
            `=FLOOR.PRECISE(AVERAGE(data_store!C${range[0]}:C${range[1]});0,01)`,
            `=MIN(data_store!C${range[0]}:C${range[1]})`,
            `=MAX(data_store!C${range[0]}:C${range[1]})`
        ]]}
    };

    await gsapi.spreadsheets.values.append(opt, (err) => {
        if(err) {
            console.log(err);
            return;
        }
    });

}

async function modifyResultsRow(args, range, client = googclient) {

    const gsapi = google.sheets({version: 'v4', auth: client});

    const opt = {
        spreadsheetId: keys.spreadsheet_id,
        range: `data_results!A${range[0]}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[
            args[0],
            args[1],
            `=FLOOR.PRECISE(AVERAGE(data_store!C${range[0]}:C${range[1]});0,01)`,
            `=MIN(data_store!C${range[0]}:C${range[1]})`,
            `=MAX(data_store!C${range[0]}:C${range[1]})`
        ]]}
    };

    await gsapi.spreadsheets.values.update(opt, (err) => {
        if(err) {
            console.log(err);
            return;
        }
    });

}
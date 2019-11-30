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
        for (i in args)
            args[i] = args[i].toLowerCase();

        if(args.length <= 6) {
            if(args.length == 2) {
                search(message, args);
            } else if(args[0] == 'add') {
                let reqArr = [];
                reqArr.push(args.slice(1));
                if(reqArr[0].length == 3) {
                    updateStore(message, reqArr);
                    updateResultsSheet(reqArr[0]);
                    // setTimeout(function(){updateResultsSheet(reqArr[0])}, 1000);
                } else {
                    message.channel.send("I need 3 arguments in order to store a new record. A value for column A, a value for column B and a number.");
                }
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

    dataArr.then(function(res){
        for(i in res) {
            if(res[i][0] == args[0] && res[i][1] == args[1]) {
                let res_arr = res[i];
                return message.channel.send(`Min: ${res_arr[2]}, max: ${res_arr[3]}, avg: ${res_arr[4]}`);
            }        
        }    
        message.channel.send(`No records were found with ${args[0]} ${args[1]}`);
    })
}

function storeSearch(arr, args, item) {
    let res = [];

    for (i in arr) {
        if (arr[i][0] == args[0] && arr[i][1] == args[1])
            if(item == 'arr')
                res.push(arr[i]);
            else
                return Number(i) + 2;
    }
    return res;
}

function updateResultsLoop(arr1, arr2) {
    for (row in arr2) {
        let args = [arr2[row][0],arr2[row][1]],
            row_index = Number(row) + 2;
            res_arr = storeSearch(arr1, args, 'arr'),
            res_index = storeSearch(arr1, args, 'index'),
            end = res_arr.length > 1 ? (res_index + res_arr.length - 1) : res_index,
            fn_range = [res_index, end];

        console.log(args, row_index, fn_range);
        modifyResultsRow(args, row_index, fn_range);
    }
}

function updateResultsSheet(args) {
    let store_items = getData('store');
    store_items.then(function(res_store){
        let res_arr = storeSearch(res_store, args, 'arr'),
            res_index = storeSearch(res_store, args, 'index'),
            end = res_arr.length > 1 ? (res_index + res_arr.length - 1) : res_index,
            result_items = getData();

        result_items.then(function(res_results){
            if (res_results) {    
                let match = 0,
                    fn_range = [res_index, end];
                
                for (i in res_results) {
                    if (res_results[i][0] == args[0] && res_results[i][1] == args[1])
                        match = 1;
                }

                if (!match)
                    updateResults(args, fn_range);

                setTimeout(function(){updateResultsLoop(res_store, res_results)}, 1000);
            } else {
                let fn_range = res_arr ? [2, res_arr.length + 1] : [2, 2];
                return updateResults(args, fn_range);
            }            
        });    
    });
}

async function getData(db = 0, client = googclient) {
    const gsapi = google.sheets({version: 'v4', auth: client}),
        sheet_range = db == 'store' ? 'data_store!A2:C' : 'data_results!A2:E',    
        opt = {
            spreadsheetId: keys.spreadsheet_id,
            range: sheet_range,
        };
    
    let data = await gsapi.spreadsheets.values.get(opt);
    return data.data.values;    
}

async function updateStore(message, args, client = googclient) { 
    const gsapi = google.sheets({version: 'v4', auth: client}),
        opt = {
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
        message.channel.send(`New row has been added to the table as col A: ${args[0][0]}, col B: ${args[0][1]}, value: ${args[0][2]}`);
    });

}

async function updateResults(args, range, client = googclient) {  
    const gsapi = google.sheets({version: 'v4', auth: client}),
        opt = {
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

async function modifyResultsRow(args, row, range, client = googclient) {
    const gsapi = google.sheets({version: 'v4', auth: client}),
        opt = {
            spreadsheetId: keys.spreadsheet_id,
            range: `data_results!A${row}`,
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
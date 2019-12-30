const Discord = require('discord.js'),
    {google} = require('googleapis'),
    { prefix, token } = require('./disconfig.json'),
    client = new Discord.Client(),
    keys = require('./credentials.json');

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
                if(args[0] == 'counter') {
                    topAverages(message, args[1]);
                } else {
                    updateResultsSheet();
                    setTimeout(function(){search(message, args)}, 1000);
                }
            } else if(args[0] == 'add') {
                let reqArr = [];
                reqArr.push(args.slice(1));
                if(reqArr[0].length == 3) {
                    const store_updated = updateStore(message, reqArr);
                    store_updated.then(function(res) {
                        if(res)
                            setTimeout(function(){updateResultsSheet()}, 2000);
                    });
                } else {
                    message.channel.send("I need 3 arguments in order to store a new record. A value for column A, a value for column B and a number.");
                }
            } else {
                message.channel.send("I don't know this command.\nIn order to retrieve data from the table, please provide 2 arguments after the exclamation mark.\nIf you want to add data to the table, please use command '!add' followed by 3 arguments");
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

function updateResultsSheet() {
    let store_items = getData('store');
    store_items.then(function(res_store){
        let arg1 = null, 
            arg2 = null,
            new_results = [];

        for (row in res_store) {
            if (res_store[row][0] == arg1 && res_store[row][1] == arg2)
                continue;

            arg1 = res_store[row][0];
            arg2 = res_store[row][1];
            let start = storeSearch(res_store, [arg1, arg2], 'index'),
                match_arr = storeSearch(res_store, [arg1, arg2], 'arr'),
                end = match_arr.length > 1 ? (start + match_arr.length -1) : start,
                avg = `=FLOOR.PRECISE(AVERAGE(data_store!C${start}:C${end});0,01)`,
                min = `=MIN(data_store!C${start}:C${end})`,
                max = `=MAX(data_store!C${start}:C${end})`;
            
            new_results.push([arg1, arg2, avg, min, max]);
        }
        modifyResultsSheet(new_results);
    });
}

function topAverages(message, target, amount = 5) {
    let res_items = getData();
    res_items.then(function(res_results){
        let arr = [];

        for (row in res_results) {
            if (res_results[row][1] == target)
                arr.push([res_results[row][0], res_results[row][2]]);
        }

        let res_arr = arr.slice(0,amount).sort(Comparator),
            res_str = '';

        for (row in res_arr) {
            res_str += `avg: ${res_arr[row][1]} with ${res_arr[row][0]}\n`;
        }

        return message.channel.send(`Top averages against ${target}:\n${res_str}`);
    });

    function Comparator(a,b) {
        var x = parseInt(a[1], 10);
        var y = parseInt(b[1], 10);

        if (x === 0 && y === 0)
            return 1 / x - 1 / y || 0;
        else return y - x;
    }
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
    if (isNaN(Number(args[0][2])))
        return message.channel.send(`The last argument, in this case "${args[0][2]}", should be a number.`);

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
    return 1;
}

async function modifyResultsSheet(vals, client = googclient) {
    const gsapi = google.sheets({version: 'v4', auth: client}),
        opt = {
            spreadsheetId: keys.spreadsheet_id,
            range: `data_results!A2`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: vals }
        };

    await gsapi.spreadsheets.values.update(opt, (err) => {
        if(err) {
            console.log(err);
            return;
        }
    });
}
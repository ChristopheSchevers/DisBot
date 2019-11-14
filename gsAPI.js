exports.googleAPI = function() {

    const {google} = require('googleapis');
    const keys = require('./credentials.json');
    
    const client = new google.auth.JWT(keys.client_email, null, keys.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    
    client.authorize(function(err, tokens) {
        if(err) {
            console.log(err);
            return;
        } else {
            console.log('Connected');
            gsrun(client);
        }
    });
    
    async function gsrun(client) {
        const gsapi = google.sheets({version: 'v4', auth: client});
    
        const opt = {
            spreadsheetId: '10j-LLoQIdnMLGFUoPfs0hyjUjl13lv1d3ilAsxoNFNE',
            range: 'Data!A2:E10',
        };
    
        let data = await gsapi.spreadsheets.values.get(opt);
        let dataArr = data.data.values;
        let newDataArr = dataArr.map(function(r){
            // r.push(r[0] + '-' + r[1]);
            return r;
        });
        
        console.log(newDataArr);
        
        // const updateOptions = {
        //     spreadsheetId: '10j-LLoQIdnMLGFUoPfs0hyjUjl13lv1d3ilAsxoNFNE',
        //     range: 'Data!G2',
        //     valueInputOption: 'USER_ENTERED',
        //     resource: { values: newDataArr }
        // };
    
        // let res = await gsapi.spreadsheets.values.update(updateOptions);
    
    };

}


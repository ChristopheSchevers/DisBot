# DisBot
## Description

This is a project I made for a friend of mine. It is a Discord bot build with Discord.js that will listen for commands in a chat and will interact with a Google Sheets API to read and store data. So this could easily be modified to interact with a database.


## What you need

* Node.js
* Google account
* A Google Spreadsheet with a sheet "data_store" and a sheet "data_results"
* Discord account


## How to use

In your terminal navigate to your project folder and run ``` npm start ``` or ``` node index.js ```.

All commands will start with prefix *'!'*.

To **add** an item to the spreadsheet, write *!add* in the Discord chat followed by 3 arguments seperated by blank spaces. *(e.g. !add column1 column2 value)*

To **search** for data in the spreadsheet, begin with *!* followed by 2 arguments seperated by a blank space. *(e.g. !column1 column2)* The bot will look if this combination exists in the **data_results** sheet.


## Getting started

After cloning the files to the preferred location, run ``` npm install ``` in that folder.


### Discord

Navigate to the **Developer Portal** of Discord. Then go to the **Applications** section and create a **new Application**.

After that click **Bot** in the menu and then click **Add Bot**.

Go to **Permissions Calculator** and select the permissions your bot needs. In this case you'll need **Read Messages** and **Send Messages** permissions. You also need to copy and paste the client ID for your bot. This can be found in the **General Information** of your Application.

You'll receive a link. Follow this link and add your bot to the server.

Go to the **Bot** section of your Application and copy the **token**.

In your project folder create a file named **disconfig.json** and store the following: 
``` json
{
    "prefix": "!",
    "token": "paste_your_discord_token_here"
}
```


### Google

Navigate to **Google API's** and create a new **Project**. After creation, go to that new Project and click **Library**. There look for and select **Google Sheets API** and enable it.

Then **Create Credentials**. Call the API from a **Webserver** and select **Application data**. We're not **not** using the API with App Engine or Compute Engine.

Create a service account and add the **Editor** role under **Project** of the dropdown menu. Make sure you'll receive a **JSON** file. Save this .json file in your project folder with the name **credentials.json**.

In your browser, go to your **Google Spreadsheet** and get the id from the URL. It's the string immediately following *'...docs.google.com/spreadsheets/d/'* til the next slash. Go back to your **credentials.json** file and add the following property: 

```json
{
    ... other properties ...
    "spreadsheet_id": "paste_spreadsheet_id_here"
}
```

In order to grant your bot permission to your spreadsheet, go to your project **Dashboard** at **Google API's** and click **Credentials** in the menu. Then click **Manage service accounts**. Copy the entire email address of your bot from the list.

Go to your **Google Spreadsheet** and **Share** the spreadsheet with your bot using the email address you just copied.

In order for this bot to work well your spreadsheet should automatically order the first 2 columns of your sheets with each change.

With your **Google Spreadsheet** open in the browser, look for **Tools** in de menu and click **Script editor**. You'll be referred to a **Google Apps Script** page with a default **Code.gs** file.

In your project folder you find a folder **google-scripts**. Add these files to the **Google Apps Script** without *.example* in their names. Make sure to save each file.

After this open the **CreateChangeEvent.gs** file in Google Scripts and run this code (the **play button** right under the upper toolbar). This will create the onChange trigger and will enable your spreadsheet to get sorted automatically.



Enjoy!

---

While creating this bot I consulted these tutorials:

[Discord.js by DesignCourse.](https://youtu.be/We2ijSkByw0)

[Google Sheets API by Learn Google Spreadsheets.](https://youtu.be/MiPpQzW_ya0)
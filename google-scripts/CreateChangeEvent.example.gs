function createSpreadsheetChangeTrigger() {
  
  var triggers = ScriptApp.getProjectTriggers();
  var change = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getEventType() == ScriptApp.EventType.ON_CHANGE) {
      change = 1;
    }
  }
  
  if(!change) {
    var ss = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('onChange')
    .forSpreadsheet(ss)
    .onChange()
    .create();
  }  
}

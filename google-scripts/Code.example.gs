createSpreadsheetChangeTrigger();

function doGet(e){
  multiColSortStore();
  multiColSortResults();
}
function onChange(e){
  multiColSortStore();
  multiColSortResults();
}
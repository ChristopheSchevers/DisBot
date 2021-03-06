function multiColSortResults() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("data_results");
  var range = sheet.getRange("A2:E999");
  range.sort([
  {column: 1, ascending: true}, // 1 = column number, sort by ascending order 
  {column: 2, ascending: true}
]);
  ss.toast('Sort complete.');
}

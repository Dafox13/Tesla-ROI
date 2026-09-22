// Vehicle Running Cost Duel — Google Apps Script backend
// Paste this into Extensions > Apps Script on your Google Sheet, then deploy as a Web App.
// Stores odometer log entries (date, odometer, optional kWh and fuel price, notes) and
// the app's Admin settings (vehicles, rates, infra costs). All cost math happens in the
// page itself — this script is just storage.

const SHEET_NAME = 'Entries';
const SETTINGS_SHEET_NAME = 'Settings';

function doGet(e) {
  e = e || { parameter: {} };
  const sheet = getSheet_();

  if (e.parameter.action === 'add') {
    sheet.appendRow([
      new Date(),                        // Timestamp — also doubles as this row's unique id
      e.parameter.date || '',             // Date
      Number(e.parameter.odometer) || 0,  // Odometer_km
      e.parameter.kwh === '' ? '' : Number(e.parameter.kwh),             // kWh (optional)
      e.parameter.fuelPrice === '' ? '' : Number(e.parameter.fuelPrice), // Fuel_Price (optional)
      e.parameter.freeEnergy === 'true',  // Free_Energy (source vehicle's energy cost excluded)
      e.parameter.notes || ''             // Notes
    ]);
    return jsonOut_({ status: 'ok' });
  }

  if (e.parameter.action === 'delete') {
    const id = e.parameter.entryId || '';
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) { // row 0 is the header
      const cellDate = data[i][0];
      if (cellDate instanceof Date && cellDate.toISOString() === id) {
        sheet.deleteRow(i + 1); // sheet rows are 1-indexed
        return jsonOut_({ status: 'ok' });
      }
    }
    return jsonOut_({ status: 'error', message: 'Entry not found (already deleted, or added before this feature existed)' });
  }

  if (e.parameter.action === 'getSettings') {
    const s = getSettingsSheet_();
    const raw = s.getRange('A1').getValue();
    if (!raw) return jsonOut_({ status: 'empty' });
    try {
      return jsonOut_({ status: 'ok', settings: JSON.parse(raw) });
    } catch (err) {
      return jsonOut_({ status: 'error', message: 'Stored settings are not valid JSON' });
    }
  }

  // default: list all entries
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const rows = data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return jsonOut_(rows);
}

function doPost(e) {
  e = e || { parameter: {}, postData: { contents: '' } };
  if (e.parameter.action === 'saveSettings') {
    try {
      const raw = e.postData.contents;
      JSON.parse(raw); // validate before storing
      const s = getSettingsSheet_();
      s.getRange('A1').setValue(raw);
      s.getRange('B1').setValue(new Date());
      return jsonOut_({ status: 'ok' });
    } catch (err) {
      return jsonOut_({ status: 'error', message: String(err) });
    }
  }
  return jsonOut_({ status: 'error', message: 'Unknown action' });
}

function getSettingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!s) {
    s = ss.insertSheet(SETTINGS_SHEET_NAME);
    s.getRange('A2').setValue('Column A holds the app settings as JSON. Column B is the last-saved timestamp. Edit via the app, not by hand.');
  }
  return s;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp','Date','Odometer_km','kWh','Fuel_Price','Free_Energy','Notes']);
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

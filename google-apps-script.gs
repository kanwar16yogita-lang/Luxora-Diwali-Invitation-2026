/**
 * Luxora guest list: paste into Extensions > Apps Script of YOUR Google Sheet.
 * Set SHEET_ID and SHARED_SECRET below. Deploy as Web app: Execute as Me,
 * Who has access: Anyone. The secret is checked for each request.
 */
const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHARED_SECRET = 'PASTE_A_LONG_RANDOM_SECRET_HERE';
const TAB_NAME = 'Guest List';
const HEADERS = ['Guest Name', 'Phone Number', 'Opened', 'RSVP', 'Last Activity (IST)', 'First Opened (IST)', 'Visitor ID'];

function setupSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const tab = spreadsheet.getSheetByName(TAB_NAME) || spreadsheet.insertSheet(TAB_NAME);
  if (tab.getLastRow() === 0) {
    tab.appendRow(HEADERS);
    tab.setFrozenRows(1);
    tab.getRange(1,1,1,HEADERS.length).setBackground('#0b3b3b').setFontColor('#f9d6a0').setFontWeight('bold');
    tab.autoResizeColumns(1,HEADERS.length);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) throw Error('Missing payload');
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SHARED_SECRET || SHARED_SECRET.startsWith('PASTE_')) throw Error('Unauthorized');
    if (!['Opened','Yes','No'].includes(data.status)) throw Error('Invalid status');
    if (!/^[A-Za-z0-9_-]{12,100}$/.test(String(data.visitorId || ''))) throw Error('Invalid visitor ID');
    lock.waitLock(15000);
    setupSheet();
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB_NAME);
    const last = sheet.getLastRow();
    const ids = last > 1 ? sheet.getRange(2,7,last-1,1).getDisplayValues().flat() : [];
    const idx = ids.indexOf(data.visitorId);
    const row = idx >= 0 ? idx + 2 : last + 1;
    const now = Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd HH:mm:ss');
    const previous = idx >= 0 ? sheet.getRange(row,1,1,7).getValues()[0] : ['', '', '', '', '', '', ''];
    // Preserve a Yes/No answer if an Opened event arrives later.
    const response = data.status === 'Opened' ? (previous[3] || 'Pending') : data.status;
    const originalOpened = previous[5] || now;
    const phone = data.status === 'Yes' ? String(data.phone || '').replace(/\D/g, '') : (previous[1] || '');
    if (data.status === 'Yes' && !/^[6-9]\d{9}$/.test(phone)) throw Error('Invalid phone');
    const guest = String(data.guest || '').slice(0,80).replace(/^[=+@\-]/,'’$&');
    const values = [guest, phone, 'Yes', response, now, originalOpened, data.visitorId];
    sheet.getRange(row,1,1,7).setNumberFormat('@').setValues([values]);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message)})).setMimeType(ContentService.MimeType.JSON);
  } finally { try { lock.releaseLock(); } catch (_) {} }
}

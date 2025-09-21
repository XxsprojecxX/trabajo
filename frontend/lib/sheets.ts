import { google } from 'googleapis';

export async function readSheetRange(sheetId: string, range: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values ?? [];
}

export async function readSheetAsObjects(sheetId: string, tab: string, endCol = 'Z', endRow = 10000) {
  const range = `${tab}!A1:${endCol}${endRow}`;
  const rows = await readSheetRange(sheetId, range);
  if (!rows.length) return [];
  const [headers, ...data] = rows;
  return data.map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((h: string, i: number) => (obj[h] = row[i] ?? null));
    return obj;
  });
}

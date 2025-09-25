import { google } from "googleapis";

type SheetsClient = ReturnType<typeof google.sheets>;

let cachedSheets: SheetsClient | null = null;

function env(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === null) return undefined;
  const trimmed = typeof value === "string" ? value.trim() : String(value);
  return trimmed === "" ? undefined : trimmed;
}

function decodeServiceAccount(): { client_email: string; private_key: string } | null {
  const raw = env("BIGQUERY_SERVICE_ACCOUNT_JSON") || env("GOOGLE_SERVICE_ACCOUNT_JSON");
  const b64 = env("BIGQUERY_SERVICE_ACCOUNT_BASE64");
  if (!raw && !b64) return null;
  const json = raw ? raw : Buffer.from(String(b64), "base64").toString("utf8");
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("CREDENCIAL_SHEETS_INVALIDA_JSON");
  }
  const client_email = parsed?.client_email;
  let private_key = parsed?.private_key;
  if (!client_email || !private_key) {
    throw new Error("CREDENCIAL_SHEETS_INCOMPLETA");
  }
  if (typeof private_key === "string") {
    private_key = private_key.replace(/\\n/g, "\n");
  }
  return { client_email, private_key };
}

async function getSheetsClient(): Promise<SheetsClient> {
  if (cachedSheets) return cachedSheets;

  const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const credentials = (() => {
    try {
      return decodeServiceAccount();
    } catch (err) {
      throw err;
    }
  })();

  const authOptions: any = { scopes };
  if (credentials) {
    authOptions.credentials = credentials;
    if (env("GOOGLE_PROJECT_ID")) {
      authOptions.projectId = env("GOOGLE_PROJECT_ID");
    }
  } else {
    const keyFilename = env("GOOGLE_APPLICATION_CREDENTIALS");
    if (keyFilename) {
      authOptions.keyFilename = keyFilename;
      if (env("GOOGLE_PROJECT_ID")) {
        authOptions.projectId = env("GOOGLE_PROJECT_ID");
      }
    }
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  const client = await auth.getClient();
  cachedSheets = google.sheets({ version: "v4", auth: auth });
  return cachedSheets;
}

function normalizeHeader(value: any, index: number): string {
  const str = typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
  const slug = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (slug) return slug;
  return `col_${index + 1}`;
}

function rowToObject(headers: string[], row: any[]): Record<string, any> {
  const obj: Record<string, any> = {};
  headers.forEach((key, idx) => {
    obj[key] = idx < row.length ? row[idx] ?? null : null;
  });
  return obj;
}

export async function readSheetAsObjects(
  sheetId: string,
  tab: string,
  endColumn: string,
  limit?: number
): Promise<Record<string, any>[]> {
  if (!sheetId) throw new Error("sheetId requerido");
  if (!tab) throw new Error("tab requerido");
  const sheets = await getSheetsClient();

  const sanitizedTab = tab.replace(/'/g, "''");
  const range = `'${sanitizedTab}'!A1:${endColumn}`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
    majorDimension: "ROWS",
  });

  const values = res.data.values || [];
  if (!values.length) {
    return [];
  }

  const headers = values[0].map((cell, idx) => normalizeHeader(cell, idx));
  const rows = values.slice(1, limit ? 1 + limit : undefined);

  const objects = rows
    .map((row) => rowToObject(headers, row))
    .filter((obj) => Object.values(obj).some((value) => value !== null && value !== "" && value !== undefined));

  return objects;
}
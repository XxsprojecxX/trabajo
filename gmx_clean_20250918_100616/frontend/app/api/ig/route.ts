import { NextResponse } from 'next/server';
import { readSheetAsObjects } from '@/lib/sheets';

export async function GET() {
  try {
    const sheetId = process.env.IG_SHEET_ID!;
    const tab = process.env.IG_SHEET_TAB || 'ig_master';
    const rows = await readSheetAsObjects(sheetId, tab, 'Z', 20000);
    return NextResponse.json({ count: rows.length, rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

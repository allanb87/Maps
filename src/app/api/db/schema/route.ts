import { NextRequest, NextResponse } from 'next/server';
import pool, { dbConfigError, classifyDbError } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  const table = request.nextUrl.searchParams.get('table');

  if (!table) {
    return NextResponse.json(
      { error: 'table query parameter is required' },
      { status: 400 }
    );
  }

  if (!pool) {
    return NextResponse.json(
      { error: dbConfigError ?? 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>('DESCRIBE ??', [table]);
    return NextResponse.json({ table, columns: rows });
  } catch (error) {
    console.error(`Error describing table ${table}:`, error);
    const classified = classifyDbError(error);
    return NextResponse.json(
      { error: classified.message || 'Failed to describe table' },
      { status: classified.status }
    );
  }
}

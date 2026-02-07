import { NextResponse } from 'next/server';
import pool, { dbConfigError, classifyDbError } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DriverRow extends RowDataPacket {
  driver_id: number;
  display_name: string;
}

export async function GET() {
  if (!pool) {
    return NextResponse.json(
      { error: dbConfigError ?? 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const [rows] = await pool.query<DriverRow[]>(
      'SELECT driver_id, display_name FROM tbl_driver ORDER BY display_name'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    const classified = classifyDbError(error);
    return NextResponse.json(
      { error: classified.message || 'Failed to fetch drivers' },
      { status: classified.status }
    );
  }
}

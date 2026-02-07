import { NextResponse } from 'next/server';
import pool, { dbConfigError } from '@/lib/db';
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
    const err = error as { code?: string };
    if (err?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error:
            'Database connection refused. Check MYSQL_HOST/MYSQL_PORT and that MySQL is running.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

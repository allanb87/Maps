import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DriverRow extends RowDataPacket {
  driver_id: number;
  display_name: string;
}

export async function GET() {
  try {
    const [rows] = await pool.query<DriverRow[]>(
      'SELECT driver_id, display_name FROM tbl_driver ORDER BY display_name'
    );
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching drivers:', message);
    console.error('DB config:', {
      host: process.env.MYSQL_HOST ?? '(not set)',
      port: process.env.MYSQL_PORT ?? '(not set)',
      user: process.env.MYSQL_USER ?? '(not set)',
      database: process.env.MYSQL_DATABASE ?? '(not set)',
      passwordSet: !!process.env.MYSQL_PASSWORD,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

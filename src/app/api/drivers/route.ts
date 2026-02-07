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
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

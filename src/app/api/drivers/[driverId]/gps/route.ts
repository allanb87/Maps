import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface GPSRow extends RowDataPacket {
  lat: number;
  lng: number;
  datetime: string;
  speed: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const { driverId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date query parameter is required (YYYY-MM-DD)' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query<GPSRow[]>(
      `SELECT lat, lng, datetime, speed
       FROM tbl_driver_stats_2020_q3
       WHERE driver_id = ? AND DATE(datetime) = ?
       ORDER BY datetime ASC`,
      [driverId, date]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching GPS data:', error);
    return NextResponse.json({ error: 'Failed to fetch GPS data' }, { status: 500 });
  }
}

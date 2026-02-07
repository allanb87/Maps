import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DeliveryRow extends RowDataPacket {
  job_id: number;
  job_datetime: string;
  latitude: number;
  longitude: number;
  status: string;
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
    const [rows] = await pool.query<DeliveryRow[]>(
      `SELECT job_id, job_datetime, latitude, longitude, status
       FROM tbl_job_history
       WHERE new_driver_id = ? AND DATE(job_datetime) = ?
         AND status IN ('in transit', 'order delivered')
       ORDER BY job_datetime ASC`,
      [driverId, date]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
  }
}

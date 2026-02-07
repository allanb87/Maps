import { NextRequest, NextResponse } from 'next/server';
import pool, { dbConfigError, classifyDbError } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DeliveryRow extends RowDataPacket {
  job_id: number;
  job_datetime: string;
  latitude: number;
  longitude: number;
  status: string;
  [key: string]: unknown;
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

  if (!pool) {
    return NextResponse.json(
      { error: dbConfigError ?? 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const [rows] = await pool.query<DeliveryRow[]>(
      `SELECT h.job_id, h.job_datetime, h.latitude, h.longitude, h.status,
              j.*
       FROM tbl_job_history h
       LEFT JOIN tbl_job j ON j.id = h.job_id
       WHERE h.new_driver_id = ? AND DATE(h.job_datetime) = ?
         AND h.status IN ('in transit', 'order delivered')
       ORDER BY h.job_datetime ASC`,
      [driverId, date]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    const classified = classifyDbError(error);
    return NextResponse.json(
      { error: classified.message || 'Failed to fetch deliveries' },
      { status: classified.status }
    );
  }
}

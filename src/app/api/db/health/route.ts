import { NextResponse } from 'next/server';
import pool, { dbConfigError, classifyDbError } from '@/lib/db';

export async function GET(request: Request) {
  const requiredToken = process.env.HEALTHCHECK_TOKEN;
  if (requiredToken) {
    const providedToken = request.headers.get('x-healthcheck-token');
    if (providedToken !== requiredToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!pool) {
    return NextResponse.json(
      { ok: false, error: dbConfigError ?? 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    await pool.query('SELECT 1');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Database healthcheck failed:', error);
    const classified = classifyDbError(error);
    return NextResponse.json(
      { ok: false, error: classified.message || 'Database not reachable' },
      { status: classified.status }
    );
  }
}

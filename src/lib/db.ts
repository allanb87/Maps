import mysql from 'mysql2/promise';

const requiredEnvVars = [
  'MYSQL_HOST_V2',
  'MYSQL_USER_V2',
  'MYSQL_PASSWORD_V2',
  'MYSQL_DATABASE_V2',
] as const;

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

const portEnv = process.env.MYSQL_PORT_V2;
const port = portEnv ? Number(portEnv) : 3306;
const invalidPort = portEnv ? Number.isNaN(port) : false;

export const dbConfigError = missingEnvVars.length
  ? `Missing required database env vars: ${missingEnvVars.join(', ')}`
  : invalidPort
    ? `Invalid MYSQL_PORT_V2 value: ${portEnv}`
    : null;

const pool = dbConfigError
  ? null
  : mysql.createPool({
      host: process.env.MYSQL_HOST_V2,
      port,
      user: process.env.MYSQL_USER_V2,
      password: process.env.MYSQL_PASSWORD_V2,
      database: process.env.MYSQL_DATABASE_V2,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      connectTimeout: 10000,
    });

if (!dbConfigError && process.env.NODE_ENV !== 'production') {
  console.info(
    `MySQL pool configured for ${process.env.MYSQL_HOST_V2}:${port}/${process.env.MYSQL_DATABASE_V2}`
  );
}

const CONNECTION_ERRORS = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'PROTOCOL_CONNECTION_LOST',
]);

export function classifyDbError(error: unknown): { message: string; status: number } {
  const code = (error as { code?: string })?.code;
  if (code && CONNECTION_ERRORS.has(code)) {
    return {
      message: `Database connection failed (${code}). Check MYSQL_HOST_V2/MYSQL_PORT_V2 and that MySQL is running.`,
      status: 503,
    };
  }
  // Surface the actual error in development so it's diagnosable
  if (process.env.NODE_ENV !== 'production') {
    const msg = error instanceof Error ? error.message : String(error);
    return { message: msg, status: 500 };
  }
  return { message: '', status: 500 };
}

export default pool;

import mysql from 'mysql2/promise';

const requiredEnvVars = [
  'MYSQL_HOST',
  'MYSQL_USER',
  'MYSQL_PASSWORD',
  'MYSQL_DATABASE',
] as const;

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

const portEnv = process.env.MYSQL_PORT;
const port = portEnv ? Number(portEnv) : 3306;
const invalidPort = portEnv ? Number.isNaN(port) : false;

export const dbConfigError = missingEnvVars.length
  ? `Missing required database env vars: ${missingEnvVars.join(', ')}`
  : invalidPort
    ? `Invalid MYSQL_PORT value: ${portEnv}`
    : null;

const pool = dbConfigError
  ? null
  : mysql.createPool({
      host: process.env.MYSQL_HOST,
      port,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      connectTimeout: 10000,
    });

if (!dbConfigError && process.env.NODE_ENV !== 'production') {
  console.info(
    `MySQL pool configured for ${process.env.MYSQL_HOST}:${port}/${process.env.MYSQL_DATABASE}`
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
      message: `Database connection failed (${code}). Check MYSQL_HOST/MYSQL_PORT and that MySQL is running.`,
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

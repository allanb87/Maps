import mysql from 'mysql2/promise';

const requiredEnvVars = [
  'MYSQL_HOST',
  'MYSQL_USER',
  'MYSQL_PASSWORD',
  'MYSQL_DATABASE',
] as const;

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required database env vars: ${missingEnvVars.join(', ')}`
  );
}

const portEnv = process.env.MYSQL_PORT;
const port = portEnv ? Number(portEnv) : 3306;
if (portEnv && Number.isNaN(port)) {
  throw new Error(`Invalid MYSQL_PORT value: ${portEnv}`);
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
});

if (process.env.NODE_ENV !== 'production') {
  console.info(
    `MySQL pool configured for ${process.env.MYSQL_HOST}:${port}/${process.env.MYSQL_DATABASE}`
  );
}

export default pool;

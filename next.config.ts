import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  env: {
    MYSQL_HOST_V2: process.env.MYSQL_HOST_V2 || "sandboxdb.smartwayslogistics.com",
    MYSQL_USER_V2: process.env.MYSQL_USER_V2 || "smartway_webuser_sandbox",
    MYSQL_PASSWORD_V2: process.env.MYSQL_PASSWORD_V2 || "AW9gz4FPfN3DeVjyvggs",
    MYSQL_PORT_V2: process.env.MYSQL_PORT_V2 || "3306",
    MYSQL_DATABASE_V2: process.env.MYSQL_DATABASE_V2 || "osmartway",
  },
};

export default nextConfig;

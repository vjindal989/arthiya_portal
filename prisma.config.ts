import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// For Turso remote databases, embed the auth token in the URL for CLI operations
const datasourceUrl = authToken && url.startsWith("libsql://")
  ? `${url}?authToken=${authToken}`
  : url;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});

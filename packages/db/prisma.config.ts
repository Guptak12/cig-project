import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load root .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://cig:cig_secret@localhost:5432/cig_db",
  },
});

import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env then .env.local (local overrides) — mirrors Next.js behaviour
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  }
});

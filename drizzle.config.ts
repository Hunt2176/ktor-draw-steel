import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/backend/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    dbCredentials: {
        url: "./draw_steel.sqlite",
    },
    verbose: true,
    strict: true,
});

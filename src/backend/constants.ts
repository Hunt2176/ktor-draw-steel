import * as path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND_ROOT = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(BACKEND_ROOT, "..", "..");
export const FILES_DIR = path.join(PROJECT_ROOT, "files");
export const DB_PATH = path.join(PROJECT_ROOT, "draw_steel.sqlite");
export const KANKA_API_BASE = "https://api.kanka.io/1.0";

export const STATIC_ROOTS = [
    path.join(PROJECT_ROOT, "dist", "app"),
    path.join(PROJECT_ROOT, "src", "app", "public"),
];

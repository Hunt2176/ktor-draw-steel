import * as path from "node:path";

export const PROJECT_ROOT = process.cwd();
export const FILES_DIR = path.join(PROJECT_ROOT, "files");
export const DB_PATH = path.join(PROJECT_ROOT, "draw_steel.sqlite");
export const KANKA_API_BASE = "https://api.kanka.io/1.0";

export const STATIC_ROOTS = [
    path.join(PROJECT_ROOT, "build", "resources", "main", "static"),
    path.join(PROJECT_ROOT, "src", "main", "resources", "static"),
];

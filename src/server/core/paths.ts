import { join } from "node:path";

const ROOT = process.cwd();

export const FILES_DIR = join(ROOT, "files");
export const STATIC_DIR = join(ROOT, "src", "main", "resources", "static");
export const BUILT_STATIC_DIR = join(ROOT, "build", "resources", "main", "static");

import * as fs from "node:fs";
import * as path from "node:path";
import { STATIC_ROOTS } from "./constants";

export function decodePathSegment(segment: string): string {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

export function resolveUnderRoot(root: string, relativePath: string): string | null {
    const resolved = path.resolve(root, relativePath);
    if (resolved === root || resolved.startsWith(root + path.sep)) {
        return resolved;
    }
    return null;
}

export function findStaticFile(relativePath: string): string | null {
    const normalized = relativePath.replace(/^\/+/, "");
    for (const root of STATIC_ROOTS) {
        const resolved = resolveUnderRoot(root, normalized);
        if (resolved != null && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
            return resolved;
        }
    }
    return null;
}

export function getSpaIndexPath(): string | null {
    const preferred = findStaticFile("app/index.html");
    if (preferred != null) {
        return preferred;
    }
    return findStaticFile("index.html");
}

export function serveDiskFile(filePath: string): Response {
    return new Response(Bun.file(filePath));
}

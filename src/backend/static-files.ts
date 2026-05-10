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

function contentTypeForPath(filePath: string): string {
    switch (path.extname(filePath).toLowerCase()) {
        case ".html":
            return "text/html; charset=utf-8";
        case ".js":
        case ".mjs":
            return "text/javascript; charset=utf-8";
        case ".css":
            return "text/css; charset=utf-8";
        case ".json":
            return "application/json; charset=utf-8";
        case ".svg":
            return "image/svg+xml";
        case ".png":
            return "image/png";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".webp":
            return "image/webp";
        case ".ico":
            return "image/x-icon";
        case ".map":
            return "application/json; charset=utf-8";
        default:
            return "application/octet-stream";
    }
}

export function serveDiskFile(filePath: string): Response {
    const content = fs.readFileSync(filePath);

    return new Response(content, {
        headers: {
            "Content-Type": contentTypeForPath(filePath),
        },
    });
}

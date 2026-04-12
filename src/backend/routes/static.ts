import { Hono } from "hono";
import { decodePathSegment, findStaticFile, getSpaIndexPath, serveDiskFile } from "../static-files";

export function registerStaticRoutes(app: Hono): void {
    app.get("/static/*", (c) => {
        const wildcard = decodePathSegment(c.req.param("*") ?? "");
        const resolved = findStaticFile(wildcard);

        if (resolved == null) {
            return c.notFound();
        }

        return serveDiskFile(resolved);
    });

    app.get("*", (c) => {
        const { pathname } = new URL(c.req.url);

        if (
            pathname.startsWith("/api") ||
            pathname.startsWith("/watch") ||
            pathname.startsWith("/kanka") ||
            pathname === "/files" ||
            pathname.startsWith("/files/") ||
            pathname.startsWith("/static/")
        ) {
            return c.notFound();
        }

        if (pathname !== "/") {
            const exactFile = findStaticFile(pathname.replace(/^\/+/, ""));
            if (exactFile != null) {
                return serveDiskFile(exactFile);
            }
        }

        const spaIndex = getSpaIndexPath();
        if (spaIndex == null) {
            return c.text("Static index not found", 404);
        }

        return serveDiskFile(spaIndex);
    });
}

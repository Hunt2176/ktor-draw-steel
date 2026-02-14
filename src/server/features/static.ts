import { join } from "node:path";
import { BUILT_STATIC_DIR, STATIC_DIR } from "../core/paths.js";
import { responseText } from "../core/http.js";

export async function serveStatic(pathname: string): Promise<Response> {
    if (pathname.startsWith("/static/")) {
        const rel = pathname.replace("/static/", "");
        const built = Bun.file(join(BUILT_STATIC_DIR, rel));
        if (await built.exists()) {
            return new Response(built);
        }

        const src = Bun.file(join(STATIC_DIR, rel));
        if (await src.exists()) {
            return new Response(src);
        }

        return responseText("Not found", 404);
    }

    if (pathname.startsWith("/app/") || pathname === "/") {
        const rel = pathname === "/" ? "index.html" : pathname.replace("/app/", "");

        const builtAsset = Bun.file(join(BUILT_STATIC_DIR, "app", rel));
        if (await builtAsset.exists()) {
            return new Response(builtAsset);
        }

        const builtIndex = Bun.file(join(BUILT_STATIC_DIR, "app", "index.html"));
        if (await builtIndex.exists()) {
            return new Response(builtIndex);
        }

        const srcIndex = Bun.file(join(STATIC_DIR, "app", "index.html"));
        if (await srcIndex.exists()) {
            return new Response(srcIndex);
        }

        return responseText("Frontend build not found", 404);
    }

    return responseText("Not found", 404);
}

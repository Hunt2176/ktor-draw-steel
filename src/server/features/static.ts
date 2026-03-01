import { join, resolve, sep } from "node:path";
import { SITE_DIR } from "../core/paths.js";
import { responseText } from "../core/http.js";

function resolveSitePath(relativePath: string): string | null {
	let decodedPath: string;

	// Remove leading slashes to prevent absolute path issues
	relativePath = relativePath.replace(/^\/+/, "");

	try {
		decodedPath = decodeURIComponent(relativePath);
	} catch {
		return null;
	}

	const absolutePath = resolve(SITE_DIR, decodedPath);
	if (absolutePath === SITE_DIR || absolutePath.startsWith(`${SITE_DIR}${sep}`)) {
		return absolutePath;
	}

	return null;
}

export async function serveStatic(pathname: string): Promise<Response> {
	const assetPath = resolveSitePath(pathname) ?? resolveSitePath("index.html");
	if (!assetPath) {
		return responseText("Not found", 404);
	}

	const builtAsset = Bun.file(assetPath);
	if (await builtAsset.exists()) {
		return new Response(builtAsset);
	}

	const builtIndex = Bun.file(join(SITE_DIR, "index.html"));
	if (await builtIndex.exists()) {
		return new Response(builtIndex);
	}

	return responseText("Frontend build not found", 404);
}

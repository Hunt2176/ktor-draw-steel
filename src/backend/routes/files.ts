import { Hono } from "hono";
import * as fs from "node:fs";
import * as path from "node:path";
import { FILES_DIR } from "../constants";
import { decodePathSegment, resolveUnderRoot, serveDiskFile } from "../static-files";

export function registerFileRoutes(app: Hono): void {
	fs.mkdirSync(FILES_DIR, { recursive: true });

	app.get("/files", (c) => {
		const files = fs
			.readdirSync(FILES_DIR, { withFileTypes: true })
			.filter((entry) => entry.isFile())
			.map((entry) => entry.name);

		return c.json({ files });
	});

	app.post("/files", async (c) => {
		const body = await c.req.parseBody({ all: true });
		const candidate = body.file;

		const uploadedFile = Array.isArray(candidate)
			? candidate.find((item): item is File => item instanceof File)
			: candidate instanceof File
				? candidate
				: null;

		if (uploadedFile == null) {
			return c.text("No file provided", 400);
		}

		const extension = path.extname(uploadedFile.name).replace(/^\./, "");
		const generatedName = extension.length > 0 ? `${crypto.randomUUID()}.${extension}` : crypto.randomUUID();

		const destination = path.join(FILES_DIR, generatedName);
		const buffer = Buffer.from(await uploadedFile.arrayBuffer());
		await fs.promises.writeFile(destination, buffer);

		return c.json({ fileName: generatedName });
	});

	app.get("/files/*", (c) => {
		const pathname = new URL(c.req.url).pathname;
		const relativePath = decodePathSegment(pathname.replace(/^\/files\/+/, ""));
		const resolved = resolveUnderRoot(FILES_DIR, relativePath);

		if (resolved == null || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
			return c.notFound();
		}

		return serveDiskFile(resolved);
	});
}

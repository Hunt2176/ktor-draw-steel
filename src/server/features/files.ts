import { mkdir, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { FILES_DIR } from "../core/paths.js";
import { responseJson, responseText } from "../core/http.js";

export async function handleFiles(req: Request, pathname: string): Promise<Response | null> {
    if (pathname === "/files") {
        if (req.method === "GET") {
            await mkdir(FILES_DIR, { recursive: true });
            const files = await readdir(FILES_DIR);
            return responseJson({ files });
        }

        if (req.method === "POST") {
            await mkdir(FILES_DIR, { recursive: true });
            const formData = await req.formData();
            const file = formData.get("file");
            if (!(file instanceof File)) {
                return responseJson({ error: "Missing file form field" }, 400);
            }

            const extension = extname(file.name);
            const name = `${crypto.randomUUID()}${extension}`;
            await Bun.write(join(FILES_DIR, name), file);

            return responseJson({ fileName: name });
        }

        return responseText("Method not allowed", 405);
    }

    if (pathname.startsWith("/files/") && req.method === "GET") {
        const safeName = basename(pathname.replace("/files/", ""));
        const filePath = join(FILES_DIR, safeName);
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
            return responseText("Not found", 404);
        }

        return new Response(file);
    }

    return null;
}

import { responseJson } from "../core/http.js";
import { RequestRouter } from "../core/router.js";
import { registerApiRoutes } from "./api.js";
import { registerFilesRoutes } from "./files.js";
import { registerKankaRoutes } from "./kanka.js";
import { registerStaticRoutes } from "./static.js";
import { registerWatchRoute } from "./watch.js";

export function createRequestRouter(): RequestRouter {
    const router = new RequestRouter()
        .interceptResponse((_ctx, response) => {
            if (response.headers.has("x-request-router")) {
                return response;
            }

            const headers = new Headers(response.headers);
            headers.set("x-request-router", "chainable-v1");
            return new Response(response.body, {
                status: response.status,
                headers,
            });
        })
        .interceptError((ctx, error) => {
            console.error("Unhandled request error", {
                method: ctx.method,
                pathname: ctx.pathname,
                error,
            });

            return responseJson({ error: "Internal Server Error" }, 500);
        });

    registerWatchRoute(router);
    registerFilesRoutes(router);
    registerKankaRoutes(router);
    registerApiRoutes(router);
    registerStaticRoutes(router);

    return router;
}

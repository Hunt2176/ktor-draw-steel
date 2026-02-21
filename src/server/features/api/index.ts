import { responseJson } from "../../core/http.js";
import { RequestRouter } from "../../core/router.js";
import { registerCampaignRoutes } from "./routes/campaigns.js";
import { registerCharacterRoutes } from "./routes/characters.js";
import { registerCharacterConditionRoutes } from "./routes/character-conditions.js";
import { registerInventoryRoutes } from "./routes/inventory.js";
import { registerDisplayEntryRoutes } from "./routes/display-entries.js";
import { registerCombatRoutes } from "./routes/combats.js";
import { registerCombatantRoutes } from "./routes/combatants.js";
import { registerUserRoutes } from "./routes/users.js";

const apiRouter = new RequestRouter()
    .interceptRequest((ctx) => {
        if (!ctx.pathname.startsWith("/api")) {
            return new Response(null, { status: 404 });
        }

        return undefined;
    })
    .interceptResponse((_ctx, response) => {
        if (!response.headers.has("x-api-router")) {
            const headers = new Headers(response.headers);
            headers.set("x-api-router", "chainable-v1");
            return new Response(response.body, {
                status: response.status,
                headers,
            });
        }

        return response;
    })
    .interceptError((_ctx, error) => {
        console.error("Unhandled API error", error);
        return responseJson({ error: "Internal Server Error" }, 500);
    });

registerCampaignRoutes(apiRouter);
registerCharacterRoutes(apiRouter);
registerCharacterConditionRoutes(apiRouter);
registerInventoryRoutes(apiRouter);
registerDisplayEntryRoutes(apiRouter);
registerCombatRoutes(apiRouter);
registerCombatantRoutes(apiRouter);
registerUserRoutes(apiRouter);

export async function handleApi(req: Request, pathname: string): Promise<Response | null> {
    if (!pathname.startsWith("/api")) {
        return null;
    }

    const response = await apiRouter.handle(req);

    if (response.status === 404 && !pathname.startsWith("/api")) {
        return null;
    }

    return response;
}

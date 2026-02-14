import { eq } from "drizzle-orm";
import { campaigns, characters, combats, db } from "../../../db.js";
import { compact, parseBody, parseId, responseJson, responseText } from "../../../core/http.js";
import { notifyCampaign } from "../../../core/socket.js";
import { campaignCreateSchema, campaignPatchSchema, modifyValueSchema } from "../schemas.js";
import { buildCharacterDtos, campaignRowToDto, getCampaignDetails, getCombatDtoById } from "../dto.js";
import { ApiRouter } from "../router.js";

export function registerCampaignRoutes(router: ApiRouter) {
    router.route("GET", /^\/api\/campaigns$/, () => responseJson(getCampaignDetails()));

    router.route("POST", /^\/api\/campaigns$/, async ({ req }) => {
        const body = await parseBody(req, campaignCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const inserted = db.insert(campaigns).values({
            name: body.name,
            background: body.background ?? null,
            heroTokens: body.heroTokens ?? 0,
            kankaApiId: body.kankaApiId ?? null,
        }).returning().get();

        const dto = campaignRowToDto(inserted);
        notifyCampaign(dto.id, "Created", "ExposedCampaign", dto.id, dto);
        return responseJson(dto, 201);
    });

    router.route("GET", /^\/api\/campaigns\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const details = getCampaignDetails([id])[0];
        if (!details) {
            return responseText("Campaign not found", 404);
        }

        return responseJson(details);
    });

    router.route("PATCH", /^\/api\/campaigns\/(\d+)$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, campaignPatchSchema);
        if (body instanceof Response) {
            return body;
        }

        const update = compact({
            name: body.name,
            background: body.background,
            heroTokens: body.heroTokens,
            kankaApiId: body.kankaApiId,
        });

        if (Object.keys(update).length > 0) {
            db.update(campaigns).set(update).where(eq(campaigns.id, id)).run();
        }

        const details = getCampaignDetails([id])[0];
        if (!details) {
            return responseText("Campaign not found", 404);
        }

        notifyCampaign(id, "Updated", "ExposedCampaign", id, details.campaign);
        return responseJson(details);
    });

    router.route("DELETE", /^\/api\/campaigns\/(\d+)$/, ({ params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const existing = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
        if (!existing) {
            return responseText("Campaign not found", 404);
        }

        db.delete(campaigns).where(eq(campaigns.id, id)).run();
        notifyCampaign(id, "Removed", "ExposedCampaign", id, null);
        return responseText("Entity deleted", 200);
    });

    router.route("PATCH", /^\/api\/campaigns\/(\d+)\/modify\/heroTokens$/, async ({ req, params }) => {
        const id = parseId(params[0]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, modifyValueSchema);
        if (body instanceof Response) {
            return body;
        }

        const row = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
        if (!row) {
            return responseText("Campaign not found", 404);
        }

        const heroTokens = Math.max(0, row.heroTokens + (body.type === "INCREASE" ? body.modifyBy : -body.modifyBy));
        db.update(campaigns).set({ heroTokens }).where(eq(campaigns.id, id)).run();

        const details = getCampaignDetails([id])[0];
        if (!details) {
            return responseText("Campaign not found", 404);
        }

        notifyCampaign(id, "Updated", "ExposedCampaign", id, details.campaign);
        return responseJson(details);
    });

    router.route("GET", /^\/api\/campaigns\/(\d+)\/combats$/, ({ params }) => {
        const campaignId = parseId(params[0]);
        if (campaignId instanceof Response) {
            return campaignId;
        }

        const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, campaignId)).get();
        if (!campaignExists) {
            return responseText("Campaign not found", 404);
        }

        const rows = db.select().from(combats).where(eq(combats.campaign, campaignId)).all();
        return responseJson(rows.map((row) => getCombatDtoById(row.id)).filter((row) => row != null));
    });

    router.route("GET", /^\/api\/campaigns\/(\d+)\/characters$/, ({ params }) => {
        const campaignId = parseId(params[0]);
        if (campaignId instanceof Response) {
            return campaignId;
        }

        const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, campaignId)).get();
        if (!campaignExists) {
            return responseText("Campaign not found", 404);
        }

        const rows = db.select().from(characters).where(eq(characters.campaign, campaignId)).all();
        return responseJson(buildCharacterDtos(rows));
    });
}

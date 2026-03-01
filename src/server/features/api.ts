export { handleApi } from "./api/index.js";

/*

const modifyValueSchema = z.object({
    modifyBy: z.number().int().nonnegative(),
    type: z.enum(["INCREASE", "DECREASE"]),
});

const campaignCreateSchema = z.object({
    name: z.string().min(1),
    background: z.string().nullable().optional(),
    heroTokens: z.number().int().nonnegative().optional(),
    kankaApiId: z.number().int().nullable().optional(),
});

const campaignPatchSchema = campaignCreateSchema.partial();

const characterCreateSchema = z.object({
    name: z.string().min(1),
    might: z.number().int().optional(),
    agility: z.number().int().optional(),
    reason: z.number().int().optional(),
    intuition: z.number().int().optional(),
    presence: z.number().int().optional(),
    removedHp: z.number().int().nonnegative().optional(),
    maxHp: z.number().int().optional(),
    temporaryHp: z.number().int().nonnegative().optional(),
    removedRecoveries: z.number().int().nonnegative().optional(),
    maxRecoveries: z.number().int().optional(),
    temporaryRecoveries: z.number().int().nonnegative().optional(),
    victories: z.number().int().optional(),
    minions: z.number().int().nonnegative().optional(),
    offstage: z.boolean().optional(),
    resourceName: z.string().nullable().optional(),
    pictureUrl: z.string().nullable().optional(),
    border: z.string().nullable().optional(),
    campaign: z.number().int().positive(),
    user: z.number().int().positive(),
});

const characterPatchSchema = characterCreateSchema.partial();

const characterHealthSchema = z.object({
    mod: z.number().int().nonnegative(),
    type: z.enum(["HEAL", "DAMAGE"]),
});

const characterRecoveriesSchema = z.object({
    mod: z.number().int().nonnegative(),
    type: z.enum(["INCREASE", "DECREASE"]),
});

const characterConditionCreateSchema = z.object({
    character: z.number().int().positive(),
    name: z.string().min(1),
    endType: z.enum(["endOfTurn", "save"]),
});

const characterConditionPatchSchema = characterConditionCreateSchema.partial();

const inventoryCreateSchema = z.object({
    name: z.string().min(1),
    character: z.number().int().positive(),
    quantity: z.number().int().nonnegative(),
});

const inventoryPatchSchema = inventoryCreateSchema.partial();

const displayEntryCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string().nullable(),
    pictureUrl: z.string().nullable(),
    type: z.enum(["Portrait", "Background"]),
    campaign: z.number().int().positive(),
});

const displayEntryPatchSchema = displayEntryCreateSchema.partial();

const combatCreateSchema = z.object({
    campaign: z.number().int().positive(),
    characters: z.array(z.number().int().positive()),
});

const combatPatchSchema = z
    .object({
        round: z.number().int().positive().optional(),
        campaign: z.number().int().positive().optional(),
    })
    .partial();

const combatRoundSchema = z.object({
    fromRound: z.number().int().positive(),
    reset: z.boolean(),
    updateConditions: z.boolean(),
});

const combatantRequestSchema = z.object({
    character: z.number().int().positive(),
});

const combatModifySchema = z.object({
    add: z.array(z.number().int().positive()).optional(),
    remove: z.array(z.number().int().positive()).optional(),
});

const combatQuickAddSchema = z.object({
    character: characterCreateSchema.omit({ campaign: true }).partial().extend({
        name: z.string().min(1),
        user: z.number().int().positive(),
        maxHp: z.number().int(),
        offstage: z.boolean(),
    }),
});

const combatantCreateSchema = z.object({
    available: z.boolean().optional(),
    surges: z.number().int().nonnegative().optional(),
    resources: z.number().int().nonnegative().optional(),
    combat: z.number().int().positive(),
    character: z.number().int().positive(),
});

const combatantPatchSchema = combatantCreateSchema.partial();

const combatantValueSchema = z.object({
    value: z.number().int().nonnegative(),
    type: z.enum(["INCREASE", "DECREASE"]),
});

const userCreateSchema = z.object({ name: z.string().min(1) });
const userPatchSchema = userCreateSchema.partial();

function campaignRowToDto(campaign: typeof campaigns.$inferSelect) {
    return {
        id: campaign.id,
        name: campaign.name,
        heroTokens: campaign.heroTokens,
        background: campaign.background,
        kankaApiId: campaign.kankaApiId,
    };
}

function characterConditionRowToDto(row: typeof characterConditions.$inferSelect) {
    return {
        id: row.id,
        character: row.character,
        name: row.name,
        endType: row.endType,
    };
}

function inventoryRowToDto(row: typeof inventoryItems.$inferSelect) {
    return {
        id: row.id,
        name: row.name,
        characterId: row.character,
        quantity: row.quantity,
    };
}

function displayEntryRowToDto(row: typeof displayEntries.$inferSelect) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        pictureUrl: row.pictureUrl,
        type: row.type,
        campaign: row.campaign,
    };
}

function buildCharacterDtos(rows: (typeof characters.$inferSelect)[]) {
    if (rows.length === 0) {
        return [] as Array<{
            id: number;
            name: string;
            might: number;
            agility: number;
            reason: number;
            intuition: number;
            presence: number;
            removedHp: number;
            maxHp: number;
            temporaryHp: number;
            removedRecoveries: number;
            maxRecoveries: number;
            temporaryRecoveries: number;
            victories: number;
            campaign: number;
            user: number;
            minions: number;
            offstage: boolean;
            resourceName: string | null;
            pictureUrl: string | null;
            border: string | null;
            conditions: ReturnType<typeof characterConditionRowToDto>[];
            inventory: ReturnType<typeof inventoryRowToDto>[];
        }>;
    }

    const ids = rows.map((row) => row.id);
    const conditions = db.select().from(characterConditions).where(inArray(characterConditions.character, ids)).all();
    const inventory = db.select().from(inventoryItems).where(inArray(inventoryItems.character, ids)).all();

    const byCharConditions = new Map<number, ReturnType<typeof characterConditionRowToDto>[]>();
    for (const condition of conditions) {
        const arr = byCharConditions.get(condition.character) ?? [];
        arr.push(characterConditionRowToDto(condition));
        byCharConditions.set(condition.character, arr);
    }

    const byCharInventory = new Map<number, ReturnType<typeof inventoryRowToDto>[]>();
    for (const item of inventory) {
        const arr = byCharInventory.get(item.character) ?? [];
        arr.push(inventoryRowToDto(item));
        byCharInventory.set(item.character, arr);
    }

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        might: row.might,
        agility: row.agility,
        reason: row.reason,
        intuition: row.intuition,
        presence: row.presence,
        removedHp: row.removedHp,
        maxHp: row.maxHp,
        temporaryHp: row.temporaryHp,
        removedRecoveries: row.removedRecoveries,
        maxRecoveries: row.maxRecoveries,
        temporaryRecoveries: row.temporaryRecoveries,
        victories: row.victories,
        campaign: row.campaign,
        user: row.user,
        minions: row.minions,
        offstage: row.offstage,
        resourceName: row.resourceName,
        pictureUrl: row.pictureUrl,
        border: row.border,
        conditions: byCharConditions.get(row.id) ?? [],
        inventory: byCharInventory.get(row.id) ?? [],
    }));
}

function getCharacterDtoById(id: number) {
    const row = db.select().from(characters).where(eq(characters.id, id)).get();
    if (!row) {
        return null;
    }
    return buildCharacterDtos([row])[0] ?? null;
}

function getCombatDtoById(id: number) {
    const combat = db.select().from(combats).where(eq(combats.id, id)).get();
    if (!combat) {
        return null;
    }

    const cbs = db.select().from(combatants).where(eq(combatants.combat, combat.id)).all();
    const characterIds = cbs.map((row) => row.character);
    const characterRows = characterIds.length
        ? db.select().from(characters).where(inArray(characters.id, characterIds)).all()
        : [];

    const dtoCharacters = buildCharacterDtos(characterRows);
    const characterById = new Map<number, (typeof dtoCharacters)[number]>(dtoCharacters.map((row) => [row.id, row]));

    return {
        id: combat.id,
        round: combat.round,
        campaign: combat.campaign,
        combatants: cbs.map((cb) => ({
            id: cb.id,
            available: cb.available,
            surges: cb.surges,
            resources: cb.resources,
            combat: cb.combat,
            character: characterById.get(cb.character),
        })).filter((cb) => cb.character != null),
    };
}

function getCampaignDetails(ids?: number[]) {
    const campaignRows = ids && ids.length > 0
        ? db.select().from(campaigns).where(inArray(campaigns.id, ids)).all()
        : db.select().from(campaigns).all();

    const campaignIds = campaignRows.map((row) => row.id);
    if (campaignIds.length === 0) {
        return [];
    }

    const charRows = db.select().from(characters).where(inArray(characters.campaign, campaignIds)).all();
    const entryRows = db.select().from(displayEntries).where(inArray(displayEntries.campaign, campaignIds)).all();

    const characterDtos = buildCharacterDtos(charRows);

    const byCampaignCharacters = new Map<number, typeof characterDtos>();
    for (const character of characterDtos) {
        const arr = byCampaignCharacters.get(character.campaign) ?? [];
        arr.push(character);
        byCampaignCharacters.set(character.campaign, arr);
    }

    const byCampaignEntries = new Map<number, ReturnType<typeof displayEntryRowToDto>[]>();
    for (const entry of entryRows) {
        const arr = byCampaignEntries.get(entry.campaign) ?? [];
        arr.push(displayEntryRowToDto(entry));
        byCampaignEntries.set(entry.campaign, arr);
    }

    return campaignRows.map((campaign) => ({
        campaign: campaignRowToDto(campaign),
        characters: byCampaignCharacters.get(campaign.id) ?? [],
        entries: byCampaignEntries.get(campaign.id) ?? [],
    }));
}

export async function handleApi(req: Request, pathname: string): Promise<Response | null> {
    if (!pathname.startsWith("/api")) {
        return null;
    }

    if (pathname === "/api/campaigns" && req.method === "GET") {
        return responseJson(getCampaignDetails());
    }

    if (pathname === "/api/campaigns" && req.method === "POST") {
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
    }

    let match = pathname.match(/^\/api\/campaigns\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const details = getCampaignDetails([id])[0];
            if (!details) {
                return responseText("Campaign not found", 404);
            }
            return responseJson(details);
        }

        if (req.method === "PATCH") {
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

            if (Object.keys(update).length === 0) {
                const row = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
                if (!row) {
                    return responseText("Campaign not found", 404);
                }
                return responseJson(campaignRowToDto(row));
            }

            db.update(campaigns).set(update).where(eq(campaigns.id, id)).run();
            const details = getCampaignDetails([id])[0];
            if (!details) {
                return responseText("Campaign not found", 404);
            }

            notifyCampaign(id, "Updated", "ExposedCampaign", id, details.campaign);
            return responseJson(details);
        }

        if (req.method === "DELETE") {
            const existing = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
            if (!existing) {
                return responseText("Campaign not found", 404);
            }

            db.delete(campaigns).where(eq(campaigns.id, id)).run();
            notifyCampaign(id, "Removed", "ExposedCampaign", id, null);
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }

/*




    match = pathname.match(/^\/api\/campaigns\/(\d+)\/modify\/heroTokens$/);
    if (match && req.method === "PATCH") {
        const id = parseId(match[1]);
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
    }

    match = pathname.match(/^\/api\/campaigns\/(\d+)\/combats$/);
    if (match && req.method === "GET") {
        const campaignId = parseId(match[1]);
        if (campaignId instanceof Response) {
            return campaignId;
        }

        const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, campaignId)).get();
        if (!campaignExists) {
            return responseText("Campaign not found", 404);
        }

        const rows = db.select().from(combats).where(eq(combats.campaign, campaignId)).all();
        const result = rows
            .map((row) => getCombatDtoById(row.id))
            .filter((row) => row != null);

        return responseJson(result);
    }

    match = pathname.match(/^\/api\/campaigns\/(\d+)\/characters$/);
    if (match && req.method === "GET") {
        const campaignId = parseId(match[1]);
        if (campaignId instanceof Response) {
            return campaignId;
        }

        const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, campaignId)).get();
        if (!campaignExists) {
            return responseText("Campaign not found", 404);
        }

        const rows = db.select().from(characters).where(eq(characters.campaign, campaignId)).all();
        return responseJson(buildCharacterDtos(rows));
    }

    if (pathname === "/api/characters" && req.method === "GET") {
        const rows = db.select().from(characters).all();
        return responseJson(buildCharacterDtos(rows));
    }

    if (pathname === "/api/characters" && req.method === "POST") {
        const body = await parseBody(req, characterCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
        if (!campaignExists) {
            return responseText("Campaign not found", 404);
        }

        const userExists = db.select().from(users).where(eq(users.id, body.user)).get();
        if (!userExists) {
            return responseText("User not found", 404);
        }

        const inserted = db.insert(characters).values({
            name: body.name,
            might: body.might ?? 0,
            agility: body.agility ?? 0,
            reason: body.reason ?? 0,
            intuition: body.intuition ?? 0,
            presence: body.presence ?? 0,
            removedHp: body.removedHp ?? 0,
            maxHp: body.maxHp ?? 0,
            temporaryHp: body.temporaryHp ?? 0,
            removedRecoveries: body.removedRecoveries ?? 0,
            maxRecoveries: body.maxRecoveries ?? 0,
            temporaryRecoveries: body.temporaryRecoveries ?? 0,
            victories: body.victories ?? 0,
            minions: body.minions ?? 0,
            offstage: body.offstage ?? false,
            resourceName: body.resourceName ?? null,
            pictureUrl: body.pictureUrl ?? null,
            border: body.border ?? null,
            campaign: body.campaign,
            user: body.user,
        }).returning().get();

        const dto = getCharacterDtoById(inserted.id);
        notifyCampaign(body.campaign, "Created", "ExposedCharacter", inserted.id, dto);
        return responseJson(dto, 201);
    }

    match = pathname.match(/^\/api\/characters\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }
            return responseJson(dto);
        }

        if (req.method === "PATCH") {
            const before = db.select().from(characters).where(eq(characters.id, id)).get();
            if (!before) {
                return responseText("Character not found", 404);
            }

            const body = await parseBody(req, characterPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            if (body.campaign != null) {
                const campaignExists = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
                if (!campaignExists) {
                    return responseText("Campaign not found", 404);
                }
            }

            if (body.user != null) {
                const userExists = db.select().from(users).where(eq(users.id, body.user)).get();
                if (!userExists) {
                    return responseText("User not found", 404);
                }
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(characters).set(update).where(eq(characters.id, id)).run();
            }

            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }

            notifyCampaign(dto.campaign, "Updated", "ExposedCharacter", id, dto);
            return responseJson(dto);
        }

        if (req.method === "DELETE") {
            const dto = getCharacterDtoById(id);
            if (!dto) {
                return responseText("Character not found", 404);
            }

            db.delete(characters).where(eq(characters.id, id)).run();
            notifyCampaign(dto.campaign, "Removed", "ExposedCharacter", id, null);
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }



    match = pathname.match(/^\/api\/characters\/(\d+)\/modify\/health$/);
    if (match && req.method === "PATCH") {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, characterHealthSchema);
        if (body instanceof Response) {
            return body;
        }

        const row = db.select().from(characters).where(eq(characters.id, id)).get();
        if (!row) {
            return responseText("Character not found", 404);
        }

        let removedHp = Math.max(row.removedHp, 0);
        let temporaryHp = Math.max(row.temporaryHp, 0);

        if (body.type === "HEAL") {
            removedHp = Math.max(0, removedHp - body.mod);
        } else {
            if (temporaryHp > 0) {
                const after = temporaryHp - body.mod;
                temporaryHp = Math.max(0, after);
                if (after < 0) {
                    removedHp += Math.max(0, -after);
                }
            } else {
                removedHp += body.mod;
            }
        }

        db.update(characters).set({ removedHp, temporaryHp }).where(eq(characters.id, id)).run();

        const dto = getCharacterDtoById(id);
        if (!dto) {
            return responseText("Character not found", 404);
        }

        notifyCampaign(dto.campaign, "Updated", "ExposedCharacter", id, dto);
        return responseJson(dto);
    }

    match = pathname.match(/^\/api\/characters\/(\d+)\/modify\/recoveries$/);
    if (match && req.method === "PATCH") {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, characterRecoveriesSchema);
        if (body instanceof Response) {
            return body;
        }

        const row = db.select().from(characters).where(eq(characters.id, id)).get();
        if (!row) {
            return responseText("Character not found", 404);
        }

        let removedRecoveries = Math.max(row.removedRecoveries, 0);
        let temporaryRecoveries = Math.max(row.temporaryRecoveries, 0);

        if (body.type === "INCREASE") {
            removedRecoveries = Math.max(0, removedRecoveries - body.mod);
        } else {
            if (temporaryRecoveries > 0) {
                const after = temporaryRecoveries - body.mod;
                temporaryRecoveries = Math.max(0, after);
                if (after < 0) {
                    removedRecoveries += Math.max(0, -after);
                }
            } else {
                removedRecoveries += body.mod;
            }
        }

        db.update(characters).set({ removedRecoveries, temporaryRecoveries }).where(eq(characters.id, id)).run();

        const dto = getCharacterDtoById(id);
        if (!dto) {
            return responseText("Character not found", 404);
        }

        notifyCampaign(dto.campaign, "Updated", "ExposedCharacter", id, dto);
        return responseJson(dto);
    }

    if (pathname === "/api/characterConditions" && req.method === "GET") {
        const rows = db.select().from(characterConditions).all();
        return responseJson(rows.map(characterConditionRowToDto));
    }

    if (pathname === "/api/characterConditions" && req.method === "POST") {
        const body = await parseBody(req, characterConditionCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const character = db.select().from(characters).where(eq(characters.id, body.character)).get();
        if (!character) {
            return responseText("Character not found", 404);
        }

        const inserted = db.insert(characterConditions).values(body).returning().get();
        const dto = characterConditionRowToDto(inserted);

        notifyCampaign(character.campaign, "Created", "ExposedCharacterCondition", inserted.id, dto);
        return responseJson(dto, 201);
    }

    match = pathname.match(/^\/api\/characterConditions\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const row = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }
            return responseJson(characterConditionRowToDto(row));
        }

        if (req.method === "PATCH") {
            const before = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
            if (!before) {
                return responseText("Entity not found", 404);
            }

            const body = await parseBody(req, characterConditionPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(characterConditions).set(update).where(eq(characterConditions.id, id)).run();
            }

            const row = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
            if (character) {
                notifyCampaign(character.campaign, "Updated", "ExposedCharacterCondition", id, characterConditionRowToDto(row));
            }

            return responseJson(characterConditionRowToDto(row));
        }

        if (req.method === "DELETE") {
            const row = db.select().from(characterConditions).where(eq(characterConditions.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
            db.delete(characterConditions).where(eq(characterConditions.id, id)).run();
            if (character) {
                notifyCampaign(character.campaign, "Removed", "ExposedCharacterCondition", id, null);
            }
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }

    if (pathname === "/api/inventoryItem" && req.method === "GET") {
        const rows = db.select().from(inventoryItems).all();
        return responseJson(rows.map(inventoryRowToDto));
    }

    if (pathname === "/api/inventoryItem" && req.method === "POST") {
        const body = await parseBody(req, inventoryCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const character = db.select().from(characters).where(eq(characters.id, body.character)).get();
        if (!character) {
            return responseText("Character not found", 404);
        }

        const inserted = db.insert(inventoryItems).values(body).returning().get();
        const dto = inventoryRowToDto(inserted);
        notifyCampaign(character.campaign, "Created", "ExposedInventoryItem", inserted.id, dto);
        return responseJson(dto, 201);
    }

    match = pathname.match(/^\/api\/inventoryItem\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }
            return responseJson(inventoryRowToDto(row));
        }

        if (req.method === "PATCH") {
            const before = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
            if (!before) {
                return responseText("Entity not found", 404);
            }

            const body = await parseBody(req, inventoryPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(inventoryItems).set(update).where(eq(inventoryItems.id, id)).run();
            }

            const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
            if (character) {
                notifyCampaign(character.campaign, "Updated", "ExposedInventoryItem", id, inventoryRowToDto(row));
            }

            return responseJson(inventoryRowToDto(row));
        }

        if (req.method === "DELETE") {
            const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            const character = db.select().from(characters).where(eq(characters.id, row.character)).get();
            db.delete(inventoryItems).where(eq(inventoryItems.id, id)).run();
            if (character) {
                notifyCampaign(character.campaign, "Removed", "ExposedInventoryItem", id, null);
            }
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }

    match = pathname.match(/^\/api\/inventoryItem\/(\d+)\/modify\/quantity$/);
    if (match && req.method === "PATCH") {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, modifyValueSchema);
        if (body instanceof Response) {
            return body;
        }

        const row = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!row) {
            return responseText("Entity not found", 404);
        }

        const quantity = Math.max(0, row.quantity + (body.type === "INCREASE" ? body.modifyBy : -body.modifyBy));
        db.update(inventoryItems).set({ quantity }).where(eq(inventoryItems.id, id)).run();

        const updated = db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
        if (!updated) {
            return responseText("Entity not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, updated.character)).get();
        if (character) {
            notifyCampaign(character.campaign, "Updated", "ExposedInventoryItem", id, inventoryRowToDto(updated));
        }

        return responseJson(inventoryRowToDto(updated));
    }

    if (pathname === "/api/displayEntry" && req.method === "GET") {
        const rows = db.select().from(displayEntries).all();
        return responseJson(rows.map(displayEntryRowToDto));
    }

    if (pathname === "/api/displayEntry" && req.method === "POST") {
        const body = await parseBody(req, displayEntryCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const campaign = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
        if (!campaign) {
            return responseText("Campaign not found", 404);
        }

        const inserted = db.insert(displayEntries).values(body).returning().get();
        const dto = displayEntryRowToDto(inserted);
        notifyCampaign(campaign.id, "Created", "ExposedDisplayEntry", inserted.id, dto);
        return responseJson(dto, 201);
    }

    match = pathname.match(/^\/api\/displayEntry\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const row = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }
            return responseJson(displayEntryRowToDto(row));
        }

        if (req.method === "PATCH") {
            const before = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
            if (!before) {
                return responseText("Entity not found", 404);
            }

            const body = await parseBody(req, displayEntryPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(displayEntries).set(update).where(eq(displayEntries.id, id)).run();
            }

            const row = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            notifyCampaign(row.campaign, "Updated", "ExposedDisplayEntry", id, displayEntryRowToDto(row));
            return responseJson(displayEntryRowToDto(row));
        }

        if (req.method === "DELETE") {
            const row = db.select().from(displayEntries).where(eq(displayEntries.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            db.delete(displayEntries).where(eq(displayEntries.id, id)).run();
            notifyCampaign(row.campaign, "Removed", "ExposedDisplayEntry", id, null);
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }

    if (pathname === "/api/combats" && req.method === "GET") {
        const rows = db.select().from(combats).all();
        return responseJson(rows.map((row) => getCombatDtoById(row.id)).filter((row) => row != null));
    }

    if (pathname === "/api/combats" && req.method === "POST") {
        const body = await parseBody(req, combatPatchSchema.extend({ campaign: z.number().int().positive() }));
        if (body instanceof Response) {
            return body;
        }

        const inserted = db.insert(combats).values({
            campaign: body.campaign,
            round: body.round ?? 1,
        }).returning().get();

        const dto = getCombatDtoById(inserted.id);
        notifyCampaign(inserted.campaign, "Created", "ExposedCombat", inserted.id, dto);
        return responseJson(dto, 201);
    }

    if (pathname === "/api/combats/create" && req.method === "POST") {
        const body = await parseBody(req, combatCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const campaign = db.select().from(campaigns).where(eq(campaigns.id, body.campaign)).get();
        if (!campaign) {
            return responseText("Campaign not found", 404);
        }

        const existingCharacters = body.characters.length > 0
            ? db.select().from(characters).where(and(eq(characters.campaign, body.campaign), inArray(characters.id, body.characters))).all()
            : [];

        if (existingCharacters.length !== body.characters.length) {
            return responseText("One or more characters not found for campaign", 404);
        }

        const combatId = db.transaction((tx) => {
            const inserted = tx.insert(combats).values({ campaign: body.campaign, round: 1 }).returning().get();
            for (const charId of body.characters) {
                tx.insert(combatants).values({ combat: inserted.id, character: charId }).run();
            }
            return inserted.id;
        });

        const dto = getCombatDtoById(combatId);
        notifyCampaign(body.campaign, "Created", "ExposedCombat", combatId, dto);
        return responseJson(dto, 201);
    }

    match = pathname.match(/^\/api\/combats\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const dto = getCombatDtoById(id);
            if (!dto) {
                return responseText("Combat not found", 404);
            }
            return responseJson(dto);
        }

        if (req.method === "PATCH") {
            const before = db.select().from(combats).where(eq(combats.id, id)).get();
            if (!before) {
                return responseText("Combat not found", 404);
            }

            const body = await parseBody(req, combatPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(combats).set(update).where(eq(combats.id, id)).run();
            }

            const dto = getCombatDtoById(id);
            if (!dto) {
                return responseText("Combat not found", 404);
            }

            notifyCampaign(dto.campaign, "Updated", "ExposedCombat", id, dto);
            return responseJson(dto);
        }

        if (req.method === "DELETE") {
            const before = db.select().from(combats).where(eq(combats.id, id)).get();
            if (!before) {
                return responseText("Combat not found", 404);
            }

            db.delete(combats).where(eq(combats.id, id)).run();
            notifyCampaign(before.campaign, "Removed", "ExposedCombat", id, null);
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }

    match = pathname.match(/^\/api\/combats\/(\d+)\/nextRound$/);
    if (match && req.method === "PATCH") {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        const body = await parseBody(req, combatRoundSchema);
        if (body instanceof Response) {
            return body;
        }

        const updatedCombatId = db.transaction((tx) => {
            const combat = tx.select().from(combats).where(eq(combats.id, id)).get();
            if (!combat) {
                throw new Error("Combat not found");
            }

            if (combat.round !== body.fromRound) {
                throw new Error("Combat round has changed");
            }

            tx.update(combats).set({ round: combat.round + 1 }).where(eq(combats.id, id)).run();

            if (body.reset) {
                tx.update(combatants).set({ available: true }).where(eq(combatants.combat, id)).run();
            }

            if (body.updateConditions) {
                const cbs = tx.select().from(combatants).where(eq(combatants.combat, id)).all();
                const charIds = cbs.map((row) => row.character);
                if (charIds.length > 0) {
                    tx.delete(characterConditions)
                        .where(and(inArray(characterConditions.character, charIds), eq(characterConditions.endType, "endOfTurn")))
                        .run();
                }
            }

            return id;
        });

        const dto = getCombatDtoById(updatedCombatId);
        if (!dto) {
            return responseText("Combat not found", 404);
        }

        notifyCampaign(dto.campaign, "Updated", "ExposedCombat", id, dto);
        return responseJson(dto);
    }

    match = pathname.match(/^\/api\/combats\/(\d+)\/(add|remove)$/);
    if (match && req.method === "PATCH") {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        const mode = match[2];
        const body = await parseBody(req, combatantRequestSchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, id)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        if (mode === "add") {
            const character = db
                .select()
                .from(characters)
                .where(and(eq(characters.id, body.character), eq(characters.campaign, combat.campaign)))
                .get();

            if (!character) {
                return responseText("Character not found in campaign", 404);
            }

            db.insert(combatants).values({ combat: id, character: body.character }).run();
        } else {
            const existing = db
                .select()
                .from(combatants)
                .where(and(eq(combatants.combat, id), eq(combatants.id, body.character)))
                .get();

            if (!existing) {
                return responseText("Combatant not found in combat", 404);
            }

            db.delete(combatants).where(eq(combatants.id, existing.id)).run();
            notifyCampaign(combat.campaign, "Removed", "ExposedCombatant", existing.id, null);
        }

        const dto = getCombatDtoById(id);
        if (!dto) {
            return responseText("Combat not found", 404);
        }

        notifyCampaign(combat.campaign, "Updated", "ExposedCombat", id, dto);
        return responseJson(dto);
    }

    match = pathname.match(/^\/api\/combats\/(\d+)\/quickAdd$/);
    if (match && req.method === "PATCH") {
        const combatId = parseId(match[1]);
        if (combatId instanceof Response) {
            return combatId;
        }

        const body = await parseBody(req, combatQuickAddSchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, combatId)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        const userExists = db.select().from(users).where(eq(users.id, body.character.user)).get();
        if (!userExists) {
            return responseText("User not found", 404);
        }

        const newCharacterId = db.transaction((tx) => {
            const insertedCharacter = tx.insert(characters).values({
                name: body.character.name,
                might: body.character.might ?? 0,
                agility: body.character.agility ?? 0,
                reason: body.character.reason ?? 0,
                intuition: body.character.intuition ?? 0,
                presence: body.character.presence ?? 0,
                removedHp: body.character.removedHp ?? 0,
                maxHp: body.character.maxHp ?? 0,
                temporaryHp: body.character.temporaryHp ?? 0,
                removedRecoveries: body.character.removedRecoveries ?? 0,
                maxRecoveries: body.character.maxRecoveries ?? 0,
                temporaryRecoveries: body.character.temporaryRecoveries ?? 0,
                victories: body.character.victories ?? 0,
                minions: body.character.minions ?? 0,
                offstage: body.character.offstage ?? false,
                resourceName: body.character.resourceName ?? null,
                pictureUrl: body.character.pictureUrl ?? null,
                border: body.character.border ?? null,
                campaign: combat.campaign,
                user: body.character.user,
            }).returning().get();

            tx.insert(combatants).values({
                combat: combatId,
                character: insertedCharacter.id,
            }).run();

            return insertedCharacter.id;
        });

        const dto = getCombatDtoById(combatId);
        notifyCampaign(combat.campaign, "Created", "ExposedCharacter", newCharacterId, getCharacterDtoById(newCharacterId));
        notifyCampaign(combat.campaign, "Updated", "ExposedCombat", combatId, dto);
        return responseJson(dto);
    }

    match = pathname.match(/^\/api\/combats\/(\d+)\/modify$/);
    if (match && req.method === "PATCH") {
        const combatId = parseId(match[1]);
        if (combatId instanceof Response) {
            return combatId;
        }

        const body = await parseBody(req, combatModifySchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, combatId)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        db.transaction((tx) => {
            for (const charId of body.add ?? []) {
                const character = tx
                    .select()
                    .from(characters)
                    .where(and(eq(characters.id, charId), eq(characters.campaign, combat.campaign)))
                    .get();
                if (!character) {
                    throw new Error(`Character ${charId} not found in campaign`);
                }
                tx.insert(combatants).values({ combat: combatId, character: charId }).run();
            }

            for (const charId of body.remove ?? []) {
                const combatant = tx
                    .select()
                    .from(combatants)
                    .where(and(eq(combatants.combat, combatId), eq(combatants.character, charId)))
                    .get();
                if (!combatant) {
                    throw new Error(`Combatant ${charId} not found in combat`);
                }
                tx.delete(combatants).where(eq(combatants.id, combatant.id)).run();
            }
        });

        const dto = getCombatDtoById(combatId);
        notifyCampaign(combat.campaign, "Updated", "ExposedCombat", combatId, dto);
        return responseJson(dto);
    }

    if (pathname === "/api/combatants" && req.method === "GET") {
        const rows = db.select().from(combatants).all();
        const result = rows.map((row) => {
            const character = getCharacterDtoById(row.character);
            return {
                id: row.id,
                available: row.available,
                surges: row.surges,
                resources: row.resources,
                combat: row.combat,
                character,
            };
        }).filter((row) => row.character != null);
        return responseJson(result);
    }

    if (pathname === "/api/combatants" && req.method === "POST") {
        const body = await parseBody(req, combatantCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const combat = db.select().from(combats).where(eq(combats.id, body.combat)).get();
        if (!combat) {
            return responseText("Combat not found", 404);
        }

        const character = db.select().from(characters).where(eq(characters.id, body.character)).get();
        if (!character) {
            return responseText("Character not found", 404);
        }

        const inserted = db.insert(combatants).values({
            available: body.available ?? true,
            surges: body.surges ?? 0,
            resources: body.resources ?? 0,
            combat: body.combat,
            character: body.character,
        }).returning().get();

        const dto = {
            id: inserted.id,
            available: inserted.available,
            surges: inserted.surges,
            resources: inserted.resources,
            combat: inserted.combat,
            character: getCharacterDtoById(inserted.character),
        };

        notifyCampaign(combat.campaign, "Created", "ExposedCombatant", inserted.id, dto);
        return responseJson(dto, 201);
    }

    match = pathname.match(/^\/api\/combatants\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            return responseJson({
                id: row.id,
                available: row.available,
                surges: row.surges,
                resources: row.resources,
                combat: row.combat,
                character: getCharacterDtoById(row.character),
            });
        }

        if (req.method === "PATCH") {
            const before = db.select().from(combatants).where(eq(combatants.id, id)).get();
            if (!before) {
                return responseText("Entity not found", 404);
            }

            const body = await parseBody(req, combatantPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(combatants).set(update).where(eq(combatants.id, id)).run();
            }

            const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            const combat = db.select().from(combats).where(eq(combats.id, row.combat)).get();

            const dto = {
                id: row.id,
                available: row.available,
                surges: row.surges,
                resources: row.resources,
                combat: row.combat,
                character: getCharacterDtoById(row.character),
            };

            if (combat) {
                notifyCampaign(combat.campaign, "Updated", "ExposedCombatant", id, dto);
            }

            return responseJson(dto);
        }

        if (req.method === "DELETE") {
            const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            const combat = db.select().from(combats).where(eq(combats.id, row.combat)).get();
            db.delete(combatants).where(eq(combatants.id, id)).run();
            if (combat) {
                notifyCampaign(combat.campaign, "Removed", "ExposedCombatant", id, null);
            }
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }

    match = pathname.match(/^\/api\/combatants\/(\d+)\/(resources|surges)$/);
    if (match && req.method === "PATCH") {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        const key = match[2];
        const body = await parseBody(req, combatantValueSchema);
        if (body instanceof Response) {
            return body;
        }

        const row = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!row) {
            return responseText("Combatant not found", 404);
        }

        const delta = body.type === "INCREASE" ? body.value : -body.value;
        const nextVal = Math.max(0, (key === "resources" ? row.resources : row.surges) + delta);

        if (key === "resources") {
            db.update(combatants).set({ resources: nextVal }).where(eq(combatants.id, id)).run();
        } else {
            db.update(combatants).set({ surges: nextVal }).where(eq(combatants.id, id)).run();
        }

        const updated = db.select().from(combatants).where(eq(combatants.id, id)).get();
        if (!updated) {
            return responseText("Combatant not found", 404);
        }

        const combat = db.select().from(combats).where(eq(combats.id, updated.combat)).get();
        const dto = {
            id: updated.id,
            available: updated.available,
            surges: updated.surges,
            resources: updated.resources,
            combat: updated.combat,
            character: getCharacterDtoById(updated.character),
        };

        if (combat) {
            notifyCampaign(combat.campaign, "Updated", "ExposedCombatant", id, dto);
        }

        return responseJson(dto);
    }

    if (pathname === "/api/users" && req.method === "GET") {
        const rows = db.select().from(users).all();
        return responseJson(rows);
    }

    if (pathname === "/api/users" && req.method === "POST") {
        const body = await parseBody(req, userCreateSchema);
        if (body instanceof Response) {
            return body;
        }

        const inserted = db.insert(users).values(body).returning().get();
        return responseJson(inserted, 201);
    }

    match = pathname.match(/^\/api\/users\/(\d+)$/);
    if (match) {
        const id = parseId(match[1]);
        if (id instanceof Response) {
            return id;
        }

        if (req.method === "GET") {
            const row = db.select().from(users).where(eq(users.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }
            return responseJson(row);
        }

        if (req.method === "PATCH") {
            const body = await parseBody(req, userPatchSchema);
            if (body instanceof Response) {
                return body;
            }

            const update = compact(body);
            if (Object.keys(update).length > 0) {
                db.update(users).set(update).where(eq(users.id, id)).run();
            }

            const row = db.select().from(users).where(eq(users.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }
            return responseJson(row);
        }

        if (req.method === "DELETE") {
            const row = db.select().from(users).where(eq(users.id, id)).get();
            if (!row) {
                return responseText("Entity not found", 404);
            }

            db.delete(users).where(eq(users.id, id)).run();
            return responseText("Entity deleted", 200);
        }

        return responseText("Method not allowed", 405);
    }


*/



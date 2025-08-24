import { z } from 'zod/v4';

export const KankaCharacterModel = z.object({
	id: z.number(),
	name: z.string(),
	image_full: z.url().nullish(),
	image_thumb: z.url().nullish(),
	entry: z.string().nullish(),
	entry_parsed: z.string().nullish(),
	type: z.literal(['NPC', 'PLAYER']).or(z.string()),
	urls: z.object({
		view: z.url(),
	})
});

export type KankaCharacter = z.infer<typeof KankaCharacterModel>;
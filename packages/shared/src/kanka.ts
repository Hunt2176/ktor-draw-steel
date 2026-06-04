import { z } from 'zod';

/**
 * Kanka API model schemas (the worldbuilding service proxied through /kanka).
 * Ported from the original arktype/zod client definitions.
 */

export const KankaBaseModel = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string().nullish(),
  image: z.url().or(z.string().length(0)).nullish(),
  image_full: z.url().or(z.string().length(0)).nullish(),
  is_private: z.boolean(),
  created_by: z.number().nullish(),
  updated_by: z.number().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});
export type KankaBase = z.infer<typeof KankaBaseModel>;

export const KankaHasTypeIdModel = z.object({
  type_id: z.number(),
});

export const KankaHasEntryModel = z.object({
  entry: z.string().nullish(),
});

export const KankaHasParsedEntryModel = z.object({
  entry_parsed: z.string().nullish(),
});

export const KankaHasUrls = z.object({
  urls: z.object({}),
});

export const KankaCharacterModel = KankaBaseModel.extend(KankaHasTypeIdModel.shape)
  .extend(KankaHasEntryModel.shape)
  .extend(KankaHasParsedEntryModel.shape)
  .extend(KankaHasUrls.shape)
  .extend({
    type: z.literal(['NPC', 'PLAYER']).or(z.string()),
    urls: z.object({
      view: z.url(),
    }),
  });
export type KankaCharacter = z.infer<typeof KankaCharacterModel>;

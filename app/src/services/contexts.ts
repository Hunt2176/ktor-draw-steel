import { Context, createContext, useState } from "react";
import { CampaignDetails, Character } from "src/types/models.ts";

type ReactStateController<T> = ReturnType<typeof useState<T>>;

function createDeadValueContexts<T>(initial: T): Context<ReactStateController<T>> {
	const deadValue = initial;
	const deadSetValue = () => {};
	
	return createContext<ReactStateController<T>>([deadValue, deadSetValue]);
}

export const CampaignContext = createDeadValueContexts<CampaignDetails | undefined>(undefined);
export const CharacterContext = createDeadValueContexts<Character | undefined>(undefined);
export const ErrorContext = createDeadValueContexts<Object | unknown | undefined>(undefined);
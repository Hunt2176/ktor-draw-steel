import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useCampaignBackground } from "hooks/CampaignBackground.tsx";
import { fetchCampaign, fetchCampaigns, fetchCharacter, fetchCombat, fetchCombatsFor } from "services/api.ts";
import { CampaignDetails, Character, Combat } from "types/models.ts";
import { parseIntOrUndefined } from "utils.ts";

export function useCharacter(id: number | undefined): Character | undefined {
	const queryKey = useMemo(() => ['character', id], [id]);
	
	const { data } = useQuery({
		queryKey,
		queryFn: () => fetchCharacter(id!),
		enabled: () => id != null,
	});
	
	return data
}

export function useCampaign(id: number | undefined): CampaignDetails | undefined {
	const queryKey = useMemo(() => ['campaign', id], [id]);
	
	const { data } = useQuery({
		queryKey,
		enabled: () => id != null,
		queryFn: () => fetchCampaign(id!),
	});
	
	useCampaignBackground(data?.campaign);
	return data;
}

export function useCampaignList(): CampaignDetails[] {
	const query = useQuery({
		queryKey: ['campaigns'],
		queryFn: fetchCampaigns,
	});
	
	return query.data ?? [];
}

export function useCombat(id?: number): Combat | undefined {
	const queryKey = useMemo(() => ['combat', id], [id]);
	const query = useQuery({
		queryKey: queryKey,
		queryFn: () => fetchCombat(id!),
		enabled: () => id != null,
	});
	
	return query.data;
}

export function useCombatsForCampaign(id?: number): Combat[] {
	const queryKey = useMemo(() => ['combats', id], [id]);
	const query = useQuery({
		queryKey: queryKey,
		queryFn: () => fetchCombatsFor(id!),
		enabled: () => id != null,
	});
	
	return query.data ?? [];
}

export function useWatchCampaign(id?: number) {
	const queryClient = useQueryClient();
	const [lastMessageTime, setLastMessageTime] = useState(0);
	
	const wsRes = useWebSocket<CampaignDetails | undefined>(`/watch/campaigns/${id}`, {
		reconnectAttempts: 5,
		retryOnError: true
	}, id != null && !isNaN(id));
	
	if (!wsRes || id == null || isNaN(id)) {
		return;
	}
	
	const { lastJsonMessage, lastMessage } = wsRes;
	if (lastMessage == null || lastJsonMessage == null || lastMessage.timeStamp === lastMessageTime) {
		return;
	}
	
	setLastMessageTime(lastMessage.timeStamp);
	
	queryClient.invalidateQueries({
		queryKey: ['campaigns']
	}).finally();
	
	queryClient.invalidateQueries({
		queryKey: ['combats', id]
	}).finally()
	
	if (lastJsonMessage.campaign != null) {
		queryClient.setQueryData(['campaign', id], lastJsonMessage);
	}
	
	lastJsonMessage.characters.forEach((character: Character) => {
		queryClient.setQueryData(['character', character.id], character);
	});
}

export function useWatchCombat(id?: number) {
	const queryClient = useQueryClient();
	const [lastMessageTime, setLastMessageTime] = useState(0);
	const parsedId = useMemo(() => parseIntOrUndefined(id), [id]);
	
	const wsRes = useWebSocket<Combat | undefined>(`/watch/combats/${parsedId}`, {
		reconnectAttempts: 5,
		retryOnError: true
	}, parsedId != null);
	
	if (!wsRes || parsedId == null) {
		return;
	}
	
	const { lastJsonMessage, lastMessage } = wsRes;
	if (lastMessage == null || lastJsonMessage == null || lastMessage.timeStamp === lastMessageTime) {
		return;
	}
	
	setLastMessageTime(lastMessage.timeStamp);
	
	queryClient.setQueryData(['combat', parsedId], lastJsonMessage);
}
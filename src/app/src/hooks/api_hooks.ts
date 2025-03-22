import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { ArkErrors } from "arktype";
import { useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useCampaignBackground } from "hooks/CampaignBackground.tsx";
import { fetchCampaign, fetchCampaigns, fetchCharacter, fetchCombat, fetchCombatsFor } from "services/api.ts";
import { CampaignDetails, Character, Combat } from "types/models.ts";
import Types, { RootScope } from 'types/types.ts';

export function useCharacter(id: number | undefined): UseQueryResult<Character> {
	const queryKey = useMemo(() => ['character', id], [id]);
	
	return useQuery({
		queryKey,
		queryFn: () => fetchCharacter(id!),
		enabled: () => id != null,
	});
}

export function useCampaign(id: number | undefined): UseQueryResult<CampaignDetails> {
	const queryKey = useMemo(() => ['campaign', id], [id]);
	
	const result = useQuery({
		queryKey,
		enabled: () => id != null,
		queryFn: () => fetchCampaign(id!),
	});
	
	useCampaignBackground(result.data?.campaign);
	return result;
}

export function useCampaignList(): UseQueryResult<CampaignDetails[]> {
	return useQuery({
		queryKey: ['campaigns'],
		queryFn: fetchCampaigns,
	});
}

export function useCombat(id?: number): UseQueryResult<Combat> {
	const queryKey = useMemo(() => ['combat', id], [id]);
	return useQuery({
		queryKey: queryKey,
		queryFn: () => fetchCombat(id!),
		enabled: () => id != null,
	});
}

export function useCombatsForCampaign(id?: number): UseQueryResult<Combat[]> {
	const queryKey = useMemo(() => ['combats', id], [id]);
	return useQuery({
		queryKey: queryKey,
		queryFn: () => fetchCombatsFor(id!),
		enabled: () => id != null,
	});
}

export function useWatchCampaign(id?: number) {
	const queryClient = useQueryClient();
	const [lastMessageTime, setLastMessageTime] = useState(0);
	
	const wsRes = useWebSocket<unknown | undefined>(`/watch/${id}`, {
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
	
	const socketEvent = Types.SocketEvent(lastJsonMessage);
	if (socketEvent instanceof ArkErrors) {
		console.error(socketEvent.summary);
		return;
	}
	
	queryClient.invalidateQueries({
		predicate: (q) => {
			if (q.queryKey[0] === 'campaign' && q.queryKey[1] === socketEvent.campaignId) {
				return true;
			}
			return q.queryKey[0] === 'combat' && (q.state?.data as Combat)?.campaign == socketEvent.campaignId;
		}
	});
	
	console.log(lastJsonMessage);
}
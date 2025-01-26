import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { fetchCampaign, fetchCampaigns, fetchCharacter } from "src/services/api.ts";
import { CampaignDetails, Character } from "src/types/models.ts";

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
	
	return data;
}

export function useCampaignList(): CampaignDetails[] {
	const query = useQuery({
		queryKey: ['campaigns'],
		queryFn: fetchCampaigns,
	});
	
	return query.data ?? [];
}

export function useWatchCampaign(id: number | undefined) {
	const lastMessageTimestamp = useRef<number>();
	const client = useQueryClient();
	
	const url = useMemo(() => id ? `/watch/campaigns/${id}` : null, [id]);
	
	let o = useWebSocket<CampaignDetails | undefined>(url, {
		shouldReconnect: (e) => !e.wasClean,
		onError: (e) => console.error(e),
		reconnectAttempts: 5,
		reconnectInterval: 5000,
	}, id == null || !isNaN(id));
	
	if (id == undefined) {
		return;
	}
	
	const lastJsonMessage = o.lastJsonMessage;
	const lastMessage = o.lastMessage;
	
	if (lastMessage?.timeStamp != lastMessageTimestamp.current && lastJsonMessage?.campaign?.id == id) {
		lastMessageTimestamp.current = lastMessage?.timeStamp;
		
		const queryKey = ['campaign', lastJsonMessage.campaign.id];
		client.setQueryData(queryKey, lastJsonMessage);
		
		client.invalidateQueries();
	}
	
	return;
}
import { QueryClient } from "@tanstack/react-query";

export class CampaignWatcher {
	
	private container?: { id: number, socket: WebSocket };
	
	constructor(private queryClient: QueryClient) {}
	
	watchCampaign(campaignId: number) {
		if (this.container?.id === campaignId) return;
		
		this.container?.socket.close();
		const socket = new WebSocket(`/watch/campaign/${campaignId}`);
		this.container = {
			id: campaignId,
			socket
		}
		
		const queryKey = ["campaign", campaignId];
		socket.onmessage = async (event) => {
			const data = event.data;
			
			if (typeof data === 'string') {
				try {
					const json = JSON.parse(data);
					if (json.campaign && json.characters && json.campaign.id === campaignId) {
						this.queryClient.setQueryData(queryKey, json);
						await this.queryClient.invalidateQueries({ queryKey: ['campaigns'] });
					}
				} catch (e) {
					console.error(e);
				}
			}
		};
		
		socket.onclose = async () => {
			if (this.container?.id === campaignId && this.container?.socket === socket) {
				this.container = undefined;
			}
		}
	}
}
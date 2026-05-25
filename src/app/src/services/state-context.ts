import {Injectable, inject, signal, effect, computed} from '@angular/core';
import { CampaignDetails } from "@app-types/models";
import { WebSocketService } from './websocket.service';

@Injectable({
	providedIn: 'root',
})
export class StateContext {
	private readonly webSocketService = inject(WebSocketService);
	readonly details = signal<CampaignDetails | null>(null, { debugName: 'CampaignDetails' });

	constructor() {
		// Automatically manage WebSocket connection based on campaign details
		
		const campaignId = computed(() => {
			return this.details()?.campaign.id;
		});
		
		effect((onCleanup) => {
			const id = campaignId();
			if (id == null) {
				return;
			}
			// Connect to WebSocket for the current campaign
			this.webSocketService.connectToCampaign(id);
			
			onCleanup(() => {
				this.webSocketService.disconnect();
			});
		});
	}

	/**
	 * Get updates for the currently active campaign
	 */
	getCampaignUpdates() {
		const campaign = this.details();
		if (!campaign) {
			return null;
		}
		return this.webSocketService.getCampaignUpdates(campaign.campaign.id);
	}
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Campaign, CampaignDetails } from '@app-types/models';

export interface ModifyRequest {
	modifyBy: number;
	type: 'INCREASE' | 'DECREASE';
}

@Injectable({
	providedIn: 'root',
})
export class CampaignService {
	private readonly http = inject(HttpClient);

	fetchCampaigns() {
		return this.http.get<CampaignDetails[]>('/api/campaigns');
	}

	fetchCampaign(id: number) {
		return this.http.get<CampaignDetails>(`/api/campaigns/${id}`);
	}

	updateCampaign(id: number, campaign: Partial<Campaign>) {
		return this.http.patch<CampaignDetails>(`/api/campaigns/${id}`, campaign);
	}

	modifyHeroTokens(campaignId: number, request: ModifyRequest) {
		return this.http.patch<CampaignDetails>(
			`/api/campaigns/${campaignId}/modify/heroTokens`,
			request
		);
	}
}

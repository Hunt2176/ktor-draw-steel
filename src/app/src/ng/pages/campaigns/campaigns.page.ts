import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { firstValueFrom } from 'rxjs';
import { CampaignService } from '@services/campaign.service';
import { CampaignDetails } from '@app/types/models';

@Component({
	selector: 'app-campaigns-page',
	standalone: true,
	imports: [CommonModule, MatCardModule, MatListModule, MatButtonModule, MatChipsModule, RouterLink],
	templateUrl: './campaigns.page.html',
	styleUrl: './campaigns.page.scss',
})
export class CampaignsPageComponent {
	private readonly campaignService = inject(CampaignService);
	private readonly changeDetector = inject(ChangeDetectorRef);

	campaigns: CampaignDetails[] = [];
	isLoading = true;
	errorMessage = '';

	constructor() {
		void this.loadCampaigns();
	}

	trackCampaignId = (_index: number, details: CampaignDetails): number => details.campaign.id;

	async refresh(): Promise<void> {
		await this.loadCampaigns();
	}

	private async loadCampaigns(): Promise<void> {
		this.isLoading = true;
		this.errorMessage = '';

		try {
			const campaigns = await firstValueFrom(this.campaignService.fetchCampaigns());
			this.campaigns = campaigns.toSorted((a, b) => a.campaign.name.localeCompare(b.campaign.name));
		} catch (error: unknown) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaigns.';
		} finally {
			this.isLoading = false;
			this.changeDetector.detectChanges();
		}
	}
}

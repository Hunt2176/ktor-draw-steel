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
	selector: 'app-home-page',
	standalone: true,
	imports: [CommonModule, MatCardModule, MatButtonModule, MatChipsModule, MatListModule, RouterLink],
	templateUrl: './home.page.html',
	styleUrl: './home.page.scss',
})
export class HomePageComponent {
	private readonly campaignService = inject(CampaignService);
	private readonly changeDetector = inject(ChangeDetectorRef);

	campaigns: CampaignDetails[] = [];
	isLoading = true;
	errorMessage = '';

	constructor() {
		void this.loadDashboard();
	}

	get totalCharacters(): number {
		return this.campaigns.reduce((acc, details) => acc + details.characters.length, 0);
	}

	get totalDisplayEntries(): number {
		return this.campaigns.reduce((acc, details) => acc + details.entries.length, 0);
	}

	trackCampaignId = (_idx: number, details: CampaignDetails): number => details.campaign.id;

	async refresh(): Promise<void> {
		await this.loadDashboard();
	}

	private async loadDashboard(): Promise<void> {
		this.isLoading = true;
		this.errorMessage = '';

		try {
			const campaigns = await firstValueFrom(this.campaignService.fetchCampaigns());
			this.campaigns = campaigns.toSorted((a, b) => a.campaign.name.localeCompare(b.campaign.name));
		} catch (error: unknown) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard.';
		} finally {
			this.isLoading = false;
			this.changeDetector.detectChanges();
		}
	}
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { fetchCampaigns } from '../../services/api';
import { CampaignDetails } from '../../types/models';

@Component({
    selector: 'app-campaigns-page',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatListModule, MatButtonModule, MatChipsModule, RouterLink],
    template: `
    <section class="page-container">
      <mat-card class="page-card" appearance="outlined" *ngIf="isLoading">
        <mat-card-content>
          <p>Loading campaigns...</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && errorMessage">
        <mat-card-header>
          <mat-card-title>Unable To Load Campaigns</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="error-text">{{ errorMessage }}</p>
          <button mat-flat-button color="primary" (click)="refresh()">Retry</button>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && !errorMessage">
        <mat-card-header>
          <mat-card-title>Campaigns</mat-card-title>
          <mat-card-subtitle>Live data from /api/campaigns</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="action-row">
            <button mat-stroked-button (click)="refresh()">Refresh</button>
          </div>

          <p *ngIf="campaigns.length === 0">No campaigns found.</p>

          <mat-nav-list *ngIf="campaigns.length > 0">
            <a mat-list-item *ngFor="let details of campaigns; trackBy: trackCampaignId" [routerLink]="['/campaigns', details.campaign.id]">
              <div matListItemTitle>{{ details.campaign.name }}</div>
              <div matListItemLine>
                <mat-chip-set>
                  <mat-chip>Characters: {{ details.characters.length }}</mat-chip>
                  <mat-chip>Display Entries: {{ details.entries.length }}</mat-chip>
                  <mat-chip>Hero Tokens: {{ details.campaign.heroTokens }}</mat-chip>
                </mat-chip-set>
              </div>
            </a>
          </mat-nav-list>
        </mat-card-content>
      </mat-card>
    </section>
  `,
    styles: [
        `
      .action-row {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .error-text {
        color: #a01616;
      }
    `,
    ],
})
export class CampaignsPageComponent {
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
            const campaigns = await fetchCampaigns();
            this.campaigns = campaigns.toSorted((a, b) => a.campaign.name.localeCompare(b.campaign.name));
        } catch (error: unknown) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaigns.';
        } finally {
            this.isLoading = false;
        }
    }
}

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
    selector: 'app-home-page',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatChipsModule, MatListModule, RouterLink],
    template: `
    <section class="page-container">
      <mat-card class="page-card" appearance="outlined" *ngIf="isLoading">
        <mat-card-content>
          <p>Loading dashboard...</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && errorMessage">
        <mat-card-header>
          <mat-card-title>Dashboard Unavailable</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="error-text">{{ errorMessage }}</p>
          <button mat-flat-button color="primary" (click)="refresh()">Retry</button>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && !errorMessage">
        <mat-card-header>
          <mat-card-title>Home</mat-card-title>
          <mat-card-subtitle>Campaign dashboard</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-chip-set>
            <mat-chip>Campaigns: {{ campaigns.length }}</mat-chip>
            <mat-chip>Characters: {{ totalCharacters }}</mat-chip>
            <mat-chip>Display Entries: {{ totalDisplayEntries }}</mat-chip>
          </mat-chip-set>

          <div class="action-row">
            <a mat-flat-button color="primary" routerLink="/campaigns">Open Campaigns</a>
            <button mat-stroked-button (click)="refresh()">Refresh</button>
          </div>

          <p *ngIf="campaigns.length === 0">No campaigns found yet.</p>

          <mat-nav-list *ngIf="campaigns.length > 0">
            <a mat-list-item *ngFor="let details of campaigns.slice(0, 8); trackBy: trackCampaignId" [routerLink]="['/campaigns', details.campaign.id]">
              <div matListItemTitle>{{ details.campaign.name }}</div>
              <div matListItemLine>
                {{ details.characters.length }} characters • {{ details.entries.length }} display entries
              </div>
            </a>
          </mat-nav-list>
        </mat-card-content>
      </mat-card>
    </section>
  `,
    styles: [
        `
      mat-card-content {
        display: grid;
        gap: 0.75rem;
      }

      .action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .error-text {
        color: #a01616;
      }
    `,
    ],
})
export class HomePageComponent {
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
            const campaigns = await fetchCampaigns();
            this.campaigns = campaigns.toSorted((a, b) => a.campaign.name.localeCompare(b.campaign.name));
        } catch (error: unknown) {
            this.errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard.';
        } finally {
            this.isLoading = false;
        }
    }
}

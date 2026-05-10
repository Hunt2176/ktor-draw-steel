import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { createDisplayEntry, deleteDisplayEntry, fetchCampaign, uploadFile } from '../../services/api';
import { CampaignDetails, DisplayEntry, DisplayEntryType } from '../../types/models';
import { map } from 'rxjs';

type DisplayEntryView = DisplayEntry & {
    isKanka: boolean;
    backLink?: string;
};

@Component({
    selector: 'app-display-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatCardModule,
        MatButtonModule,
        MatChipsModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatListModule,
        MatSelectModule,
    ],
    template: `
    <section class="page-container">
      <mat-card class="page-card" appearance="outlined" *ngIf="isLoading">
        <mat-card-content>
          <p>Loading display board...</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && errorMessage">
        <mat-card-header>
          <mat-card-title>Unable To Load Display</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="error-text">{{ errorMessage }}</p>
          <button mat-flat-button color="primary" (click)="refresh()">Retry</button>
        </mat-card-content>
      </mat-card>

      <ng-container *ngIf="!isLoading && !errorMessage && campaignDetails as details">
        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ details.campaign.name }} Display</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-row">
              <a mat-stroked-button [routerLink]="['/campaigns', details.campaign.id]">Back To Campaign</a>
              <button mat-stroked-button (click)="refresh()">Refresh</button>
            </div>

            <mat-chip-set>
              <mat-chip>Total Entries: {{ allEntries.length }}</mat-chip>
              <mat-chip>Kanka Entries: {{ kankaEntries.length }}</mat-chip>
              <mat-chip>Campaign Entries: {{ details.entries.length }}</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Create Display Entry</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Title</mat-label>
                <input matInput [(ngModel)]="newEntryTitle" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Type</mat-label>
                <mat-select [(ngModel)]="newEntryType">
                  <mat-option [value]="'Portrait'">Portrait</mat-option>
                  <mat-option [value]="'Background'">Background</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput rows="4" [(ngModel)]="newEntryDescription"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Picture URL (optional)</mat-label>
                <input matInput [(ngModel)]="newEntryPictureUrl" />
              </mat-form-field>
            </div>

            <div class="action-row">
              <button mat-stroked-button type="button" (click)="fileInput.click()">Select File</button>
              <span class="file-name" *ngIf="newEntryFile">{{ newEntryFile.name }}</span>
              <input #fileInput type="file" accept=".png,.jpg,.jpeg,.webp" style="display: none" (change)="onFilePicked($event)" />
            </div>

            <div class="action-row">
              <button mat-flat-button color="primary" [disabled]="isSavingEntry" (click)="createEntry()">
                {{ isSavingEntry ? 'Saving...' : 'Save Entry' }}
              </button>
            </div>

            <p class="error-text" *ngIf="entryErrorMessage">{{ entryErrorMessage }}</p>
          </mat-card-content>
        </mat-card>

        <div class="display-layout">
          <mat-card class="page-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title>Entries</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p *ngIf="allEntries.length === 0">No display entries yet.</p>
              <mat-nav-list *ngIf="allEntries.length > 0">
                <a
                  mat-list-item
                  *ngFor="let entry of allEntries; let idx = index; trackBy: trackEntryId"
                  href="#"
                  (click)="selectEntry(idx, $event)"
                  [class.active-entry]="idx === activeEntryIndex"
                >
                  <div matListItemTitle>{{ entry.title }}</div>
                  <div matListItemLine>{{ entry.type }} <span *ngIf="entry.isKanka">• Kanka</span></div>
                </a>
              </mat-nav-list>

              <div class="action-row" *ngIf="activeEntry && !activeEntry.isKanka">
                <button mat-button color="warn" [disabled]="isDeletingEntryId === activeEntry.id" (click)="removeEntry(activeEntry.id)">
                  {{ isDeletingEntryId === activeEntry.id ? 'Deleting...' : 'Delete Selected Entry' }}
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="page-card" appearance="outlined">
            <mat-card-header>
              <mat-card-title *ngIf="activeEntry">{{ activeEntry.title }}</mat-card-title>
              <mat-card-title *ngIf="!activeEntry">Display Preview</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="action-row" *ngIf="activeEntry">
                <button mat-stroked-button [disabled]="activeEntryIndex <= 0" (click)="previousEntry()">Previous</button>
                <button mat-stroked-button [disabled]="activeEntryIndex >= allEntries.length - 1" (click)="nextEntry()">Next</button>
                <a mat-button *ngIf="activeEntry.backLink" [href]="activeEntry.backLink" target="_blank" rel="noopener noreferrer">Open Source</a>
              </div>

              <ng-container *ngIf="activeEntry; else emptyStateTpl">
                <div class="entry-background" *ngIf="activeEntry.type === 'Background' && activeEntry.pictureUrl" [style.background-image]="'url(' + activeEntry.pictureUrl + ')'">
                  <div class="entry-overlay">
                    <h3>{{ activeEntry.title }}</h3>
                    <p *ngIf="activeEntry.description">{{ activeEntry.description }}</p>
                  </div>
                </div>

                <div *ngIf="activeEntry.type !== 'Background' || !activeEntry.pictureUrl" class="portrait-layout">
                  <img *ngIf="activeEntry.pictureUrl" [src]="activeEntry.pictureUrl" [alt]="activeEntry.title" class="entry-image" />
                  <p *ngIf="activeEntry.description" class="entry-description">{{ activeEntry.description }}</p>
                </div>
              </ng-container>

              <ng-template #emptyStateTpl>
                <p>Select or create an entry to preview it.</p>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>
      </ng-container>
    </section>
  `,
    styles: [
        `
      .action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 0.75rem;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .file-name {
        align-self: center;
        font-size: 0.9rem;
      }

      .display-layout {
        display: grid;
        grid-template-columns: minmax(240px, 360px) minmax(0, 1fr);
        gap: 1rem;
      }

      .active-entry {
        background: rgba(25, 118, 210, 0.11);
      }

      .entry-background {
        min-height: 360px;
        border-radius: 12px;
        background-position: center;
        background-size: cover;
        display: flex;
        align-items: flex-end;
      }

      .entry-overlay {
        width: 100%;
        padding: 1rem;
        border-radius: 0 0 12px 12px;
        color: #fff;
        background: linear-gradient(180deg, rgba(3, 7, 18, 0.2) 0%, rgba(3, 7, 18, 0.82) 100%);
      }

      .portrait-layout {
        display: grid;
        gap: 0.75rem;
      }

      .entry-image {
        width: 100%;
        max-height: 500px;
        object-fit: contain;
        border-radius: 10px;
      }

      .entry-description {
        white-space: pre-wrap;
      }

      .error-text {
        color: #a01616;
      }

      @media (max-width: 980px) {
        .display-layout {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
    ],
})
export class DisplayPageComponent {
    private readonly route = inject(ActivatedRoute);

    campaignId: number | null = null;
    campaignDetails: CampaignDetails | null = null;
    kankaEntries: DisplayEntryView[] = [];

    isLoading = true;
    isSavingEntry = false;
    isDeletingEntryId: number | null = null;

    errorMessage = '';
    entryErrorMessage = '';

    activeEntryIndex = 0;

    newEntryTitle = '';
    newEntryDescription = '';
    newEntryType: DisplayEntryType = 'Portrait';
    newEntryPictureUrl = '';
    newEntryFile: File | null = null;

    constructor() {
        this.route.paramMap
            .pipe(
                map((params) => {
                    const id = Number(params.get('id'));
                    return Number.isFinite(id) && id > 0 ? id : null;
                }),
                takeUntilDestroyed(),
            )
            .subscribe((id) => {
                this.campaignId = id;
                if (id == null) {
                    this.errorMessage = 'Invalid campaign id.';
                    this.isLoading = false;
                    return;
                }

                void this.loadCampaign(id);
            });
    }

    get allEntries(): DisplayEntryView[] {
        const campaignEntries = (this.campaignDetails?.entries ?? []).map((entry) => ({
            ...entry,
            isKanka: false,
        }));

        return [...campaignEntries, ...this.kankaEntries].toSorted((a, b) => a.title.localeCompare(b.title));
    }

    get activeEntry(): DisplayEntryView | null {
        const entries = this.allEntries;
        if (entries.length === 0) {
            return null;
        }
        const index = Math.max(0, Math.min(this.activeEntryIndex, entries.length - 1));
        return entries[index] ?? null;
    }

    trackEntryId = (_idx: number, entry: DisplayEntryView): number => entry.id;

    async refresh(): Promise<void> {
        if (this.campaignId == null) {
            return;
        }
        await this.loadCampaign(this.campaignId);
    }

    selectEntry(index: number, event: Event): void {
        event.preventDefault();
        this.activeEntryIndex = index;
    }

    previousEntry(): void {
        this.activeEntryIndex = Math.max(this.activeEntryIndex - 1, 0);
    }

    nextEntry(): void {
        this.activeEntryIndex = Math.min(this.activeEntryIndex + 1, this.allEntries.length - 1);
    }

    onFilePicked(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        this.newEntryFile = input?.files?.[0] ?? null;
    }

    async createEntry(): Promise<void> {
        if (this.campaignId == null) {
            return;
        }

        const title = this.newEntryTitle.trim();
        if (!title) {
            this.entryErrorMessage = 'Entry title is required.';
            return;
        }

        this.isSavingEntry = true;
        this.entryErrorMessage = '';

        try {
            let pictureUrl = this.trimToNull(this.newEntryPictureUrl);
            if (this.newEntryFile != null) {
                const uploadResult = await uploadFile(this.newEntryFile);
                pictureUrl = `/files/${uploadResult.fileName}`;
            }

            await createDisplayEntry({
                campaign: this.campaignId,
                title,
                description: this.trimToNull(this.newEntryDescription),
                pictureUrl,
                type: this.newEntryType,
            });

            this.newEntryTitle = '';
            this.newEntryDescription = '';
            this.newEntryType = 'Portrait';
            this.newEntryPictureUrl = '';
            this.newEntryFile = null;

            await this.refresh();
        } catch (error: unknown) {
            this.entryErrorMessage = this.asErrorMessage(error, 'Failed to create display entry.');
        } finally {
            this.isSavingEntry = false;
        }
    }

    async removeEntry(id: number): Promise<void> {
        if (!globalThis.confirm('Delete this display entry?')) {
            return;
        }

        this.isDeletingEntryId = id;
        this.entryErrorMessage = '';
        try {
            await deleteDisplayEntry(id);
            await this.refresh();
        } catch (error: unknown) {
            this.entryErrorMessage = this.asErrorMessage(error, 'Failed to delete display entry.');
        } finally {
            this.isDeletingEntryId = null;
        }
    }

    private async loadCampaign(id: number): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        this.entryErrorMessage = '';

        try {
            const campaign = await fetchCampaign(id);
            this.campaignDetails = campaign;
            await this.loadKankaEntries(campaign.campaign.kankaApiId, id);
            this.clampActiveEntryIndex();
        } catch (error: unknown) {
            this.campaignDetails = null;
            this.kankaEntries = [];
            this.errorMessage = this.asErrorMessage(error, 'Failed to load display entries.');
        } finally {
            this.isLoading = false;
        }
    }

    private async loadKankaEntries(kankaApiId: string | undefined, campaignId: number): Promise<void> {
        const parsedCampaignId = kankaApiId == null ? NaN : Number(kankaApiId);
        if (!Number.isFinite(parsedCampaignId)) {
            this.kankaEntries = [];
            return;
        }

        try {
            const [characters, locations, creatures, events] = await Promise.all([
                this.fetchKankaCollection(`/kanka/campaigns/${parsedCampaignId}/characters`),
                this.fetchKankaCollection(`/kanka/campaigns/${parsedCampaignId}/locations`),
                this.fetchKankaCollection(`/kanka/campaigns/${parsedCampaignId}/creatures`),
                this.fetchKankaCollection(`/kanka/campaigns/${parsedCampaignId}/events`),
            ]);

            const groups = [characters, locations, creatures, events];
            this.kankaEntries = groups.flatMap((group, groupIndex) =>
                group.map((entity) => ({
                    id: -1 * (groupIndex * 1_000_000 + entity.id),
                    title: entity.name,
                    description: this.toDisplayDescription(entity),
                    pictureUrl: this.trimToNull(entity.image_full),
                    type: 'Portrait' as DisplayEntryType,
                    campaign: campaignId,
                    isKanka: true,
                    backLink: entity.urls?.view,
                })),
            );
        } catch {
            this.kankaEntries = [];
        }
    }

    private async fetchKankaCollection(url: string): Promise<Array<{ id: number; name: string; image_full?: string; entry?: string; entry_parsed?: string; urls?: { view?: string } }>> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch Kanka entries');
        }

        const json = (await response.json()) as { data?: unknown[] };
        if (!Array.isArray(json.data)) {
            return [];
        }

        return json.data
            .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
            .map((item) => ({
                id: Number(item.id),
                name: String(item.name ?? ''),
                image_full: typeof item.image_full === 'string' ? item.image_full : undefined,
                entry: typeof item.entry === 'string' ? item.entry : undefined,
                entry_parsed: typeof item.entry_parsed === 'string' ? item.entry_parsed : undefined,
                urls:
                    item.urls != null && typeof item.urls === 'object' && typeof (item.urls as { view?: unknown }).view === 'string'
                        ? { view: (item.urls as { view: string }).view }
                        : undefined,
            }))
            .filter((item) => Number.isFinite(item.id) && item.name.length > 0);
    }

    private toDisplayDescription(entity: { entry?: string; entry_parsed?: string }): string | null {
        const candidate = entity.entry_parsed ?? entity.entry;
        if (candidate == null || candidate.trim().length === 0) {
            return null;
        }

        const unescaped = candidate.replaceAll('\\"', '"');
        const text = unescaped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 0 ? text : null;
    }

    private clampActiveEntryIndex(): void {
        const entries = this.allEntries;
        if (entries.length === 0) {
            this.activeEntryIndex = 0;
            return;
        }

        if (this.activeEntryIndex >= entries.length) {
            this.activeEntryIndex = entries.length - 1;
        }

        if (this.activeEntryIndex < 0) {
            this.activeEntryIndex = 0;
        }
    }

    private trimToNull(value: unknown): string | null {
        if (typeof value !== 'string') {
            return null;
        }

        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    private asErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim().length > 0) {
            return error.message;
        }
        return fallback;
    }
}

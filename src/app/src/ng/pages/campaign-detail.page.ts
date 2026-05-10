import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { map } from 'rxjs';
import { createCharacter, createCombat, deleteCombat, fetchCampaign, fetchCombatsFor, updateCampaign, uploadFile } from '../../services/api';
import { CampaignDetails, Character, Combat } from '../../types/models';

@Component({
    selector: 'app-campaign-detail-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatCardModule,
        MatButtonModule,
        MatChipsModule,
        MatCheckboxModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatListModule,
    ],
    template: `
    <section class="page-container">
      <mat-card class="page-card" appearance="outlined" *ngIf="isLoading">
        <mat-card-content>
          <p>Loading campaign details...</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && errorMessage">
        <mat-card-header>
          <mat-card-title>Unable To Load Campaign</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="error-text">{{ errorMessage }}</p>
          <button mat-flat-button color="primary" (click)="refresh()">Retry</button>
        </mat-card-content>
      </mat-card>

      <ng-container *ngIf="!isLoading && !errorMessage && campaignDetails as details">
        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ details.campaign.name }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-row">
              <a mat-stroked-button routerLink="/campaigns">Campaigns</a>
              <a mat-stroked-button [routerLink]="['/campaigns', details.campaign.id, 'display']">Display Board</a>
              <button mat-stroked-button color="primary" [disabled]="isUpdatingBackground" (click)="backgroundFileInput.click()">
                {{ isUpdatingBackground ? 'Uploading...' : 'Upload Background' }}
              </button>
              <button mat-button (click)="refresh()">Refresh</button>
              <input
                #backgroundFileInput
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                style="display: none"
                (change)="onBackgroundFileChange($event)"
              />
            </div>

            <p class="error-text" *ngIf="backgroundErrorMessage">{{ backgroundErrorMessage }}</p>
            <mat-chip-set>
              <mat-chip>Campaign id: {{ details.campaign.id }}</mat-chip>
              <mat-chip>Hero Tokens: {{ details.campaign.heroTokens }}</mat-chip>
              <mat-chip *ngIf="details.campaign.background">Background set</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Combats</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="selector-grid">
              <label class="selector-item" *ngFor="let character of details.characters; trackBy: trackCharacterId">
                <input
                  type="checkbox"
                  [checked]="selectedCombatCharacters[character.id] ?? false"
                  (change)="onCharacterSelectionChange(character.id, $event)"
                />
                <span>{{ character.name }}</span>
                <small *ngIf="character.offstage">offstage</small>
              </label>
            </div>

            <div class="action-row">
              <button
                mat-flat-button
                color="primary"
                [disabled]="isCreatingCombat || selectedCharacterIds.length === 0"
                (click)="createCombatFromSelection()"
              >
                {{ isCreatingCombat ? 'Creating Combat...' : 'Create Combat From Selection' }}
              </button>
            </div>

            <p class="error-text" *ngIf="combatErrorMessage">{{ combatErrorMessage }}</p>

            <mat-divider></mat-divider>

            <p *ngIf="combats.length === 0">No combats have been created yet.</p>

            <mat-list *ngIf="combats.length > 0">
              <mat-list-item *ngFor="let combat of combats; trackBy: trackCombatId">
                <div matListItemTitle>Combat #{{ combat.id }} • Round {{ combat.round }}</div>
                <div class="list-actions">
                  <button mat-button color="primary" [routerLink]="['/combats', combat.id]">View</button>
                  <button
                    mat-button
                    color="warn"
                    [disabled]="isDeletingCombatId === combat.id"
                    (click)="removeCombat(combat.id)"
                  >
                    {{ isDeletingCombatId === combat.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Add Character</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="newCharacterName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max HP</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="newCharacterMaxHp" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Minions</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="newCharacterMinions" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Picture URL (optional)</mat-label>
                <input matInput [(ngModel)]="newCharacterPictureUrl" />
              </mat-form-field>
            </div>

            <mat-checkbox [(ngModel)]="newCharacterOffstage">Offstage</mat-checkbox>

            <div class="action-row">
              <button mat-flat-button color="primary" [disabled]="isCreatingCharacter" (click)="createCharacterFromDraft()">
                {{ isCreatingCharacter ? 'Creating...' : 'Create Character' }}
              </button>
            </div>

            <p class="error-text" *ngIf="characterErrorMessage">{{ characterErrorMessage }}</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Characters</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="character-grid" *ngIf="details.characters.length > 0; else noCharactersTpl">
              <mat-card appearance="outlined" *ngFor="let character of details.characters; trackBy: trackCharacterId">
                <mat-card-header>
                  <mat-card-title>{{ character.name }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-chip-set>
                    <mat-chip>HP: {{ characterHpText(character) }}</mat-chip>
                    <mat-chip *ngIf="character.offstage">Offstage</mat-chip>
                    <mat-chip *ngIf="character.minions > 0">Minions: {{ character.minions }}</mat-chip>
                  </mat-chip-set>
                </mat-card-content>
                <mat-card-actions>
                  <a mat-button color="primary" [routerLink]="['/characters', character.id]">View</a>
                </mat-card-actions>
              </mat-card>
            </div>
            <ng-template #noCharactersTpl>
              <p>No characters in this campaign yet.</p>
            </ng-template>
          </mat-card-content>
        </mat-card>
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

      .selector-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .selector-item {
        border: 1px solid #e1e5f3;
        border-radius: 10px;
        padding: 0.45rem 0.6rem;
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      .list-actions {
        display: flex;
        gap: 0.4rem;
      }

      .character-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
      }

      .error-text {
        color: #a01616;
      }

      @media (max-width: 760px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
    ],
})
export class CampaignDetailPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    campaignId: number | null = null;
    campaignDetails: CampaignDetails | null = null;
    combats: Combat[] = [];

    isLoading = true;
    isCreatingCombat = false;
    isCreatingCharacter = false;
    isUpdatingBackground = false;
    isDeletingCombatId: number | null = null;

    errorMessage = '';
    backgroundErrorMessage = '';
    combatErrorMessage = '';
    characterErrorMessage = '';

    selectedCombatCharacters: Record<number, boolean> = {};

    newCharacterName = '';
    newCharacterMaxHp = 40;
    newCharacterMinions = 0;
    newCharacterOffstage = false;
    newCharacterPictureUrl = '';

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

    get selectedCharacterIds(): number[] {
        return Object.entries(this.selectedCombatCharacters)
            .filter(([, selected]) => selected)
            .map(([id]) => Number(id));
    }

    trackCharacterId = (_idx: number, character: Character): number => character.id;

    trackCombatId = (_idx: number, combat: Combat): number => combat.id;

    characterHpText(character: Character): string {
        const current = character.maxHp + character.temporaryHp - character.removedHp;
        return `${current}/${character.maxHp}`;
    }

    async refresh(): Promise<void> {
        if (this.campaignId == null) {
            return;
        }
        await this.loadCampaign(this.campaignId);
    }

    onCharacterSelectionChange(id: number, event: Event): void {
        const target = event.target as HTMLInputElement | null;
        this.selectedCombatCharacters[id] = target?.checked ?? false;
    }

    async createCombatFromSelection(): Promise<void> {
        if (this.campaignDetails == null) {
            return;
        }

        const characterIds = this.selectedCharacterIds;
        if (characterIds.length === 0) {
            this.combatErrorMessage = 'Select at least one character to create a combat.';
            return;
        }

        this.isCreatingCombat = true;
        this.combatErrorMessage = '';
        try {
            const combat = await createCombat({
                campaign: this.campaignDetails.campaign.id,
                characters: characterIds,
            });

            await this.loadCampaign(this.campaignDetails.campaign.id);
            await this.router.navigate(['/combats', combat.id]);
        } catch (error: unknown) {
            this.combatErrorMessage = this.asErrorMessage(error, 'Failed to create combat.');
        } finally {
            this.isCreatingCombat = false;
        }
    }

    async removeCombat(combatId: number): Promise<void> {
        if (!globalThis.confirm('Delete this combat?')) {
            return;
        }
        if (this.campaignId == null) {
            return;
        }

        this.isDeletingCombatId = combatId;
        this.combatErrorMessage = '';
        try {
            await deleteCombat(combatId);
            await this.loadCampaign(this.campaignId);
        } catch (error: unknown) {
            this.combatErrorMessage = this.asErrorMessage(error, 'Failed to delete combat.');
        } finally {
            this.isDeletingCombatId = null;
        }
    }

    async createCharacterFromDraft(): Promise<void> {
        if (this.campaignDetails == null) {
            return;
        }

        const name = this.newCharacterName.trim();
        if (!name) {
            this.characterErrorMessage = 'Character name is required.';
            return;
        }

        if (!Number.isFinite(this.newCharacterMaxHp) || this.newCharacterMaxHp <= 0) {
            this.characterErrorMessage = 'Max HP must be greater than zero.';
            return;
        }

        this.isCreatingCharacter = true;
        this.characterErrorMessage = '';

        try {
            await createCharacter({
                name,
                campaign: this.campaignDetails.campaign.id,
                user: 1,
                maxHp: Math.floor(this.newCharacterMaxHp),
                maxRecoveries: 0,
                offstage: this.newCharacterOffstage,
                minions: Math.max(0, Math.floor(this.newCharacterMinions || 0)),
                pictureUrl: this.trimToNull(this.newCharacterPictureUrl),
            });

            this.newCharacterName = '';
            this.newCharacterMaxHp = 40;
            this.newCharacterMinions = 0;
            this.newCharacterOffstage = false;
            this.newCharacterPictureUrl = '';

            await this.loadCampaign(this.campaignDetails.campaign.id);
        } catch (error: unknown) {
            this.characterErrorMessage = this.asErrorMessage(error, 'Failed to create character.');
        } finally {
            this.isCreatingCharacter = false;
        }
    }

    async onBackgroundFileChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (this.campaignId == null || file == null) {
            return;
        }

        this.isUpdatingBackground = true;
        this.backgroundErrorMessage = '';
        try {
            const uploadResult = await uploadFile(file);
            await updateCampaign(this.campaignId, {
                background: `/files/${uploadResult.fileName}`,
            });
            await this.loadCampaign(this.campaignId);
        } catch (error: unknown) {
            this.backgroundErrorMessage = this.asErrorMessage(error, 'Failed to upload background.');
        } finally {
            this.isUpdatingBackground = false;
            if (input != null) {
                input.value = '';
            }
        }
    }

    private async loadCampaign(id: number): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        this.combatErrorMessage = '';
        this.characterErrorMessage = '';
        this.backgroundErrorMessage = '';

        try {
            const [campaignDetails, combats] = await Promise.all([fetchCampaign(id), fetchCombatsFor(id)]);
            this.campaignDetails = campaignDetails;
            this.combats = combats;
            this.selectedCombatCharacters = campaignDetails.characters.reduce(
                (acc, character) => {
                    acc[character.id] = !character.offstage;
                    return acc;
                },
                {} as Record<number, boolean>,
            );
        } catch (error: unknown) {
            this.errorMessage = this.asErrorMessage(error, 'Failed to load campaign details.');
        } finally {
            this.isLoading = false;
        }
    }

    private trimToNull(value: string): string | null {
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

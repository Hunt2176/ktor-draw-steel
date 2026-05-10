import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import {
    fetchCampaign,
    fetchCombat,
    modifyHeroTokens,
    quickAddCombatant,
    updateCombatModification,
    updateCombatRound,
    updateCombatantActive,
    updateCombatantValue,
} from '../../services/api';
import { CampaignDetails, Character, Combat, Combatant } from '../../types/models';
import { map } from 'rxjs';

@Component({
    selector: 'app-combat-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatCardModule,
        MatButtonModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatListModule,
    ],
    template: `
    <section class="page-container">
      <mat-card class="page-card" appearance="outlined" *ngIf="isLoading">
        <mat-card-content>
          <p>Loading combat...</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && errorMessage">
        <mat-card-header>
          <mat-card-title>Unable To Load Combat</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="error-text">{{ errorMessage }}</p>
          <button mat-flat-button color="primary" (click)="refresh()">Retry</button>
        </mat-card-content>
      </mat-card>

      <ng-container *ngIf="!isLoading && !errorMessage && combat as activeCombat">
        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Combat #{{ activeCombat.id }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-row">
              <a mat-stroked-button *ngIf="campaign" [routerLink]="['/campaigns', campaign.campaign.id]">Campaign</a>
              <button mat-stroked-button (click)="refresh()">Refresh</button>
              <button mat-flat-button color="primary" [disabled]="isUpdatingRound" (click)="advanceRound()">
                {{ isUpdatingRound ? 'Advancing...' : 'Next Round' }}
              </button>
            </div>

            <mat-chip-set>
              <mat-chip>Round: {{ activeCombat.round }}</mat-chip>
              <mat-chip *ngIf="campaign">Campaign: {{ campaign.campaign.name }}</mat-chip>
              <mat-chip *ngIf="campaign">Hero Tokens: {{ campaign.campaign.heroTokens }}</mat-chip>
            </mat-chip-set>

            <div class="round-row">
              <mat-checkbox [(ngModel)]="clearRoundOnlyConditions">Clear end-of-turn conditions</mat-checkbox>
            </div>

            <div class="token-row" *ngIf="campaign">
              <mat-form-field appearance="outline">
                <mat-label>Hero Token Amount</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="heroTokenAdjustAmount" />
              </mat-form-field>
              <button mat-stroked-button [disabled]="isUpdatingHeroTokens" (click)="adjustHeroTokens('INCREASE')">Add</button>
              <button mat-stroked-button [disabled]="isUpdatingHeroTokens" (click)="adjustHeroTokens('DECREASE')">Spend</button>
            </div>

            <p class="error-text" *ngIf="updateErrorMessage">{{ updateErrorMessage }}</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Quick Add Combatant</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="quickAddName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max HP</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="quickAddMaxHp" />
              </mat-form-field>
            </div>

            <mat-checkbox [(ngModel)]="quickAddOffstage">Offstage</mat-checkbox>

            <div class="action-row">
              <button mat-flat-button color="primary" [disabled]="isQuickAdding" (click)="quickAddToCombat()">
                {{ isQuickAdding ? 'Adding...' : 'Add Combatant' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined" *ngIf="campaign">
          <mat-card-header>
            <mat-card-title>Modify Roster</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="selector-grid">
              <label class="selector-item" *ngFor="let character of sortedCampaignCharacters; trackBy: trackCharacterId">
                <input type="checkbox" [checked]="rosterSelection[character.id] ?? false" (change)="onRosterSelectionChange(character.id, $event)" />
                <span>{{ character.name }}</span>
                <small *ngIf="character.offstage">offstage</small>
              </label>
            </div>

            <div class="action-row">
              <button mat-stroked-button color="primary" [disabled]="isSavingRoster" (click)="saveRosterChanges()">
                {{ isSavingRoster ? 'Saving...' : 'Apply Roster Changes' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Available Combatants</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p *ngIf="availableCombatants.length === 0">No available combatants.</p>
            <mat-list *ngIf="availableCombatants.length > 0">
              <mat-list-item *ngFor="let combatant of availableCombatants; trackBy: trackCombatantId">
                <div matListItemTitle>{{ combatant.character.name }}</div>
                <div matListItemLine>
                  HP: {{ combatantHpText(combatant) }}
                  • {{ combatant.character.resourceName ?? 'Resources' }}: {{ combatant.resources }}
                  • Surges: {{ combatant.surges }}
                </div>
                <div class="list-actions">
                  <a mat-button color="primary" [routerLink]="['/characters', combatant.character.id]">View</a>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="toggleCombatant(combatant)">Set Unavailable</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'resources', 'increase')">Res +</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'resources', 'decrease')">Res -</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'surges', 'increase')">Surge +</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'surges', 'decrease')">Surge -</button>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Unavailable Combatants</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p *ngIf="unavailableCombatants.length === 0">No unavailable combatants.</p>
            <mat-list *ngIf="unavailableCombatants.length > 0">
              <mat-list-item *ngFor="let combatant of unavailableCombatants; trackBy: trackCombatantId">
                <div matListItemTitle>{{ combatant.character.name }}</div>
                <div matListItemLine>
                  HP: {{ combatantHpText(combatant) }}
                  • {{ combatant.character.resourceName ?? 'Resources' }}: {{ combatant.resources }}
                  • Surges: {{ combatant.surges }}
                </div>
                <div class="list-actions">
                  <a mat-button color="primary" [routerLink]="['/characters', combatant.character.id]">View</a>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="toggleCombatant(combatant)">Set Available</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'resources', 'increase')">Res +</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'resources', 'decrease')">Res -</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'surges', 'increase')">Surge +</button>
                  <button mat-button [disabled]="isUpdatingCombatantId === combatant.id" (click)="adjustCombatant(combatant, 'surges', 'decrease')">Surge -</button>
                </div>
              </mat-list-item>
            </mat-list>
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

      .round-row {
        margin-top: 0.5rem;
      }

      .token-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
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
        flex-wrap: wrap;
        gap: 0.3rem;
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
export class CombatPageComponent {
    private readonly route = inject(ActivatedRoute);

    combatId: number | null = null;
    combat: Combat | null = null;
    campaign: CampaignDetails | null = null;

    isLoading = true;
    isUpdatingRound = false;
    isUpdatingHeroTokens = false;
    isSavingRoster = false;
    isQuickAdding = false;
    isUpdatingCombatantId: number | null = null;

    errorMessage = '';
    updateErrorMessage = '';

    heroTokenAdjustAmount = 1;
    clearRoundOnlyConditions = false;

    rosterSelection: Record<number, boolean> = {};

    quickAddName = '';
    quickAddMaxHp = 40;
    quickAddOffstage = true;

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
                this.combatId = id;
                if (id == null) {
                    this.errorMessage = 'Invalid combat id.';
                    this.isLoading = false;
                    return;
                }

                void this.loadCombat(id);
            });
    }

    get sortedCampaignCharacters(): Character[] {
        return (this.campaign?.characters ?? []).toSorted((a, b) => {
            if (a.offstage !== b.offstage) {
                return a.offstage ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    get availableCombatants(): Combatant[] {
        return this.sortedCombatantsByAvailability(true);
    }

    get unavailableCombatants(): Combatant[] {
        return this.sortedCombatantsByAvailability(false);
    }

    trackCharacterId = (_idx: number, character: Character): number => character.id;

    trackCombatantId = (_idx: number, combatant: Combatant): number => combatant.id;

    combatantHpText(combatant: Combatant): string {
        const hp = Character.getHp(combatant.character);
        return `${hp.current}/${hp.max}`;
    }

    async refresh(): Promise<void> {
        if (this.combatId == null) {
            return;
        }
        await this.loadCombat(this.combatId);
    }

    onRosterSelectionChange(id: number, event: Event): void {
        const target = event.target as HTMLInputElement | null;
        this.rosterSelection[id] = target?.checked ?? false;
    }

    async advanceRound(): Promise<void> {
        if (this.combat == null) {
            return;
        }

        this.isUpdatingRound = true;
        this.updateErrorMessage = '';
        try {
            await updateCombatRound(this.combat.id, {
                fromRound: this.combat.round,
                reset: true,
                updateConditions: this.clearRoundOnlyConditions,
            });
            await this.refresh();
        } catch (error: unknown) {
            this.updateErrorMessage = this.asErrorMessage(error, 'Failed to update round.');
        } finally {
            this.isUpdatingRound = false;
        }
    }

    async adjustHeroTokens(type: 'INCREASE' | 'DECREASE'): Promise<void> {
        if (this.campaign == null) {
            return;
        }

        const modifyBy = Math.max(1, Math.floor(this.heroTokenAdjustAmount || 1));

        this.isUpdatingHeroTokens = true;
        this.updateErrorMessage = '';
        try {
            await modifyHeroTokens(this.campaign.campaign.id, { modifyBy, type });
            await this.refresh();
        } catch (error: unknown) {
            this.updateErrorMessage = this.asErrorMessage(error, 'Failed to update hero tokens.');
        } finally {
            this.isUpdatingHeroTokens = false;
        }
    }

    async quickAddToCombat(): Promise<void> {
        if (this.combat == null) {
            return;
        }

        const name = this.quickAddName.trim();
        if (!name) {
            this.updateErrorMessage = 'Quick add requires a name.';
            return;
        }

        if (!Number.isFinite(this.quickAddMaxHp) || this.quickAddMaxHp <= 0) {
            this.updateErrorMessage = 'Quick add requires max HP greater than zero.';
            return;
        }

        this.isQuickAdding = true;
        this.updateErrorMessage = '';
        try {
            await quickAddCombatant(this.combat.id, {
                character: {
                    name,
                    maxHp: Math.floor(this.quickAddMaxHp),
                    user: 1,
                    offstage: this.quickAddOffstage,
                },
            });

            this.quickAddName = '';
            this.quickAddMaxHp = 40;
            this.quickAddOffstage = true;

            await this.refresh();
        } catch (error: unknown) {
            this.updateErrorMessage = this.asErrorMessage(error, 'Failed to quick add combatant.');
        } finally {
            this.isQuickAdding = false;
        }
    }

    async saveRosterChanges(): Promise<void> {
        if (this.combat == null || this.campaign == null) {
            return;
        }

        const existing = new Set(this.combat.combatants.map((combatant) => combatant.character.id));
        const selected = Object.entries(this.rosterSelection)
            .filter(([, include]) => include)
            .map(([id]) => Number(id));

        const add = selected.filter((id) => !existing.has(id));
        const remove = [...existing].filter((id) => !selected.includes(id));

        if (add.length === 0 && remove.length === 0) {
            return;
        }

        this.isSavingRoster = true;
        this.updateErrorMessage = '';
        try {
            await updateCombatModification(this.combat.id, {
                add: add.length > 0 ? add : undefined,
                remove: remove.length > 0 ? remove : undefined,
            });
            await this.refresh();
        } catch (error: unknown) {
            this.updateErrorMessage = this.asErrorMessage(error, 'Failed to modify combat roster.');
        } finally {
            this.isSavingRoster = false;
        }
    }

    async toggleCombatant(combatant: Combatant): Promise<void> {
        this.isUpdatingCombatantId = combatant.id;
        this.updateErrorMessage = '';
        try {
            await updateCombatantActive(combatant.id, !combatant.available);
            await this.refresh();
        } catch (error: unknown) {
            this.updateErrorMessage = this.asErrorMessage(error, 'Failed to update combatant availability.');
        } finally {
            this.isUpdatingCombatantId = null;
        }
    }

    async adjustCombatant(
        combatant: Combatant,
        key: 'resources' | 'surges',
        type: 'increase' | 'decrease',
    ): Promise<void> {
        this.isUpdatingCombatantId = combatant.id;
        this.updateErrorMessage = '';
        try {
            await updateCombatantValue(combatant.id, { key, type, value: 1 });
            await this.refresh();
        } catch (error: unknown) {
            this.updateErrorMessage = this.asErrorMessage(error, `Failed to update combatant ${key}.`);
        } finally {
            this.isUpdatingCombatantId = null;
        }
    }

    private sortedCombatantsByAvailability(available: boolean): Combatant[] {
        return (this.combat?.combatants ?? [])
            .filter((combatant) => combatant.available === available)
            .toSorted((a, b) => {
                if (a.character.offstage !== b.character.offstage) {
                    return a.character.offstage ? 1 : -1;
                }

                const hpDiff = Character.getHp(a.character).current - Character.getHp(b.character).current;
                if (hpDiff !== 0) {
                    return hpDiff;
                }

                return a.character.name.localeCompare(b.character.name);
            });
    }

    private async loadCombat(id: number): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        this.updateErrorMessage = '';

        try {
            const combat = await fetchCombat(id);
            const campaign = await fetchCampaign(combat.campaign);

            this.combat = combat;
            this.campaign = campaign;

            const activeCharacterIds = new Set(combat.combatants.map((combatant) => combatant.character.id));
            this.rosterSelection = campaign.characters.reduce(
                (acc, character) => {
                    acc[character.id] = activeCharacterIds.has(character.id);
                    return acc;
                },
                {} as Record<number, boolean>,
            );
        } catch (error: unknown) {
            this.combat = null;
            this.campaign = null;
            this.errorMessage = this.asErrorMessage(error, 'Failed to load combat.');
        } finally {
            this.isLoading = false;
        }
    }

    private asErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim().length > 0) {
            return error.message;
        }
        return fallback;
    }
}

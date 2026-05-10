import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import {
    addCharacterCondition,
    createInventoryItem,
    deleteCharacter,
    deleteCharacterCondition,
    deleteInventoryItem,
    fetchCampaign,
    fetchCharacter,
    modifyCharacterHp,
    modifyCharacterRecovery,
    saveCharacter,
} from '../../services/api';
import { CampaignDetails, Character, CharacterConditionEndType, InventoryItem } from '../../types/models';
import { map } from 'rxjs';

@Component({
    selector: 'app-characters-page',
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
        MatSelectModule,
    ],
    template: `
    <section class="page-container">
      <mat-card class="page-card" appearance="outlined" *ngIf="isLoading">
        <mat-card-content>
          <p>Loading characters...</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && errorMessage">
        <mat-card-header>
          <mat-card-title>Unable To Load Character Data</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="error-text">{{ errorMessage }}</p>
          <button mat-flat-button color="primary" (click)="refresh()">Retry</button>
        </mat-card-content>
      </mat-card>

      <ng-container *ngIf="!isLoading && !errorMessage && mode === 'campaign' && campaignDetails as details">
        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ details.campaign.name }} Characters</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-row">
              <a mat-stroked-button [routerLink]="['/campaigns', details.campaign.id]">Back To Campaign</a>
              <button mat-stroked-button (click)="refresh()">Refresh</button>
            </div>

            <p *ngIf="details.characters.length === 0">No characters in this campaign yet.</p>

            <mat-nav-list *ngIf="details.characters.length > 0">
              <a mat-list-item *ngFor="let character of details.characters; trackBy: trackCharacterId" [routerLink]="['/characters', character.id]">
                <div matListItemTitle>{{ character.name }}</div>
                <div matListItemLine>
                  <mat-chip-set>
                    <mat-chip>HP: {{ characterHpText(character) }}</mat-chip>
                    <mat-chip *ngIf="character.offstage">Offstage</mat-chip>
                    <mat-chip *ngIf="character.minions > 0">Minions: {{ character.minions }}</mat-chip>
                  </mat-chip-set>
                </div>
              </a>
            </mat-nav-list>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <ng-container *ngIf="!isLoading && !errorMessage && mode === 'character' && character as activeCharacter">
        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ activeCharacter.name }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-row">
              <a mat-stroked-button [routerLink]="['/campaigns', activeCharacter.campaign]">Campaign</a>
              <a mat-stroked-button [routerLink]="['/campaigns', activeCharacter.campaign, 'characters']">Character List</a>
              <button mat-stroked-button (click)="refresh()">Refresh</button>
            </div>

            <mat-chip-set>
              <mat-chip>HP: {{ characterHpText(activeCharacter) }}</mat-chip>
              <mat-chip>Recoveries: {{ characterRecoveryText(activeCharacter) }}</mat-chip>
              <mat-chip>Victories: {{ activeCharacter.victories }}</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Edit Character</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="editName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max HP</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="editMaxHp" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max Recoveries</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="editMaxRecoveries" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Minions</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="editMinions" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Resource Name</mat-label>
                <input matInput [(ngModel)]="editResourceName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Picture URL</mat-label>
                <input matInput [(ngModel)]="editPictureUrl" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Victories</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="editVictories" />
              </mat-form-field>
            </div>

            <mat-checkbox [(ngModel)]="editOffstage">Offstage</mat-checkbox>

            <div class="action-row">
              <button mat-flat-button color="primary" [disabled]="isSaving" (click)="saveEdits()">
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button mat-button color="warn" [disabled]="isDeleting" (click)="removeCharacter()">
                {{ isDeleting ? 'Deleting...' : 'Delete Character' }}
              </button>
            </div>

            <p class="error-text" *ngIf="editErrorMessage">{{ editErrorMessage }}</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Quick HP And Recovery</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="quick-actions-grid">
              <mat-form-field appearance="outline">
                <mat-label>HP Amount</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="hpAdjustAmount" />
              </mat-form-field>
              <div class="action-row compact">
                <button mat-stroked-button [disabled]="isHpUpdating" (click)="adjustHp('DAMAGE')">Damage</button>
                <button mat-stroked-button [disabled]="isHpUpdating" (click)="adjustHp('HEAL')">Heal</button>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Recovery Amount</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="recoveryAdjustAmount" />
              </mat-form-field>
              <div class="action-row compact">
                <button mat-stroked-button [disabled]="isRecoveryUpdating" (click)="adjustRecovery('DECREASE')">Spend</button>
                <button mat-stroked-button [disabled]="isRecoveryUpdating" (click)="adjustRecovery('INCREASE')">Restore</button>
              </div>
            </div>

            <p class="error-text" *ngIf="adjustErrorMessage">{{ adjustErrorMessage }}</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Conditions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid two-column">
              <mat-form-field appearance="outline">
                <mat-label>Condition Name</mat-label>
                <input matInput [(ngModel)]="newConditionName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Ends</mat-label>
                <mat-select [(ngModel)]="newConditionEndType">
                  <mat-option [value]="'endOfTurn'">End Of Turn</mat-option>
                  <mat-option [value]="'save'">Save</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="action-row">
              <button mat-flat-button color="primary" [disabled]="isConditionUpdating" (click)="createCondition()">
                {{ isConditionUpdating ? 'Adding...' : 'Add Condition' }}
              </button>
            </div>

            <mat-divider></mat-divider>

            <p *ngIf="activeCharacter.conditions.length === 0">No active conditions.</p>

            <mat-list *ngIf="activeCharacter.conditions.length > 0">
              <mat-list-item *ngFor="let condition of activeCharacter.conditions; trackBy: trackConditionId">
                <div matListItemTitle>{{ condition.name }}</div>
                <div matListItemLine>Ends: {{ condition.endType }}</div>
                <button mat-button color="warn" [disabled]="isConditionUpdating" (click)="removeCondition(condition.id)">Remove</button>
              </mat-list-item>
            </mat-list>

            <p class="error-text" *ngIf="conditionErrorMessage">{{ conditionErrorMessage }}</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="page-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Inventory</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid two-column">
              <mat-form-field appearance="outline">
                <mat-label>Item Name</mat-label>
                <input matInput [(ngModel)]="newInventoryName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Quantity</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="newInventoryQuantity" />
              </mat-form-field>
            </div>

            <div class="action-row">
              <button mat-flat-button color="primary" [disabled]="isInventoryUpdating" (click)="addInventory()">
                {{ isInventoryUpdating ? 'Adding...' : 'Add Item' }}
              </button>
            </div>

            <mat-divider></mat-divider>

            <p *ngIf="activeCharacter.inventory.length === 0">No inventory items.</p>

            <mat-list *ngIf="activeCharacter.inventory.length > 0">
              <mat-list-item *ngFor="let item of activeCharacter.inventory; trackBy: trackInventoryId">
                <div matListItemTitle>{{ item.name }}</div>
                <div matListItemLine>Quantity: {{ item.quantity }}</div>
                <button mat-button color="warn" [disabled]="isInventoryUpdating" (click)="removeInventory(item.id)">Remove</button>
              </mat-list-item>
            </mat-list>

            <p class="error-text" *ngIf="inventoryErrorMessage">{{ inventoryErrorMessage }}</p>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <mat-card class="page-card" appearance="outlined" *ngIf="!isLoading && !errorMessage && mode == null">
        <mat-card-header>
          <mat-card-title>Characters</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Unknown character route.</p>
        </mat-card-content>
      </mat-card>
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

      .action-row.compact {
        margin: 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
      }

      .form-grid.two-column {
        grid-template-columns: repeat(2, minmax(220px, 1fr));
      }

      .quick-actions-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(160px, 1fr));
        gap: 0.75rem;
      }

      .error-text {
        color: #a01616;
      }

      @media (max-width: 760px) {
        .form-grid.two-column,
        .quick-actions-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
    ],
})
export class CharactersPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    mode: 'campaign' | 'character' | null = null;

    isLoading = true;
    isSaving = false;
    isDeleting = false;
    isHpUpdating = false;
    isRecoveryUpdating = false;
    isConditionUpdating = false;
    isInventoryUpdating = false;

    errorMessage = '';
    editErrorMessage = '';
    adjustErrorMessage = '';
    conditionErrorMessage = '';
    inventoryErrorMessage = '';

    campaignDetails: CampaignDetails | null = null;
    character: Character | null = null;

    editName = '';
    editMaxHp = 0;
    editMaxRecoveries = 0;
    editMinions = 0;
    editResourceName = '';
    editPictureUrl = '';
    editVictories = 0;
    editOffstage = false;

    hpAdjustAmount = 5;
    recoveryAdjustAmount = 1;

    newConditionName = '';
    newConditionEndType: CharacterConditionEndType = 'endOfTurn';

    newInventoryName = '';
    newInventoryQuantity = 1;

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
                const routePath = this.route.snapshot.routeConfig?.path ?? '';
                if (routePath.startsWith('campaigns/')) {
                    this.mode = 'campaign';
                    if (id == null) {
                        this.errorMessage = 'Invalid campaign id.';
                        this.isLoading = false;
                        return;
                    }
                    void this.loadCampaignCharacters(id);
                    return;
                }

                if (routePath.startsWith('characters/')) {
                    this.mode = 'character';
                    if (id == null) {
                        this.errorMessage = 'Invalid character id.';
                        this.isLoading = false;
                        return;
                    }
                    void this.loadCharacter(id);
                    return;
                }

                this.mode = null;
                this.errorMessage = '';
                this.isLoading = false;
            });
    }

    trackCharacterId = (_idx: number, character: Character): number => character.id;

    trackConditionId = (_idx: number, condition: { id: number }): number => condition.id;

    trackInventoryId = (_idx: number, item: InventoryItem): number => item.id;

    characterHpText(character: Character): string {
        const hp = Character.getHp(character);
        return `${hp.current}/${hp.max}`;
    }

    characterRecoveryText(character: Character): string {
        const recoveries = Character.getRecoveries(character);
        return `${recoveries.current}/${recoveries.max}`;
    }

    async refresh(): Promise<void> {
        if (this.mode === 'campaign') {
            const id = this.campaignDetails?.campaign.id;
            if (id != null) {
                await this.loadCampaignCharacters(id);
            }
            return;
        }

        if (this.mode === 'character') {
            const id = this.character?.id;
            if (id != null) {
                await this.loadCharacter(id);
            }
        }
    }

    async saveEdits(): Promise<void> {
        if (this.character == null) {
            return;
        }

        const name = this.editName.trim();
        if (!name) {
            this.editErrorMessage = 'Name is required.';
            return;
        }

        this.isSaving = true;
        this.editErrorMessage = '';
        try {
            const updated = await saveCharacter(this.character.id, {
                name,
                maxHp: Math.max(1, Math.floor(this.editMaxHp || 1)),
                maxRecoveries: Math.max(0, Math.floor(this.editMaxRecoveries || 0)),
                minions: Math.max(0, Math.floor(this.editMinions || 0)),
                resourceName: this.trimToNull(this.editResourceName),
                pictureUrl: this.trimToNull(this.editPictureUrl),
                victories: Math.max(0, Math.floor(this.editVictories || 0)),
                offstage: this.editOffstage,
            });

            this.character = updated;
            this.applyDraftFromCharacter(updated);
        } catch (error: unknown) {
            this.editErrorMessage = this.asErrorMessage(error, 'Failed to save character.');
        } finally {
            this.isSaving = false;
        }
    }

    async removeCharacter(): Promise<void> {
        if (this.character == null) {
            return;
        }

        if (!globalThis.confirm('Delete this character?')) {
            return;
        }

        const character = this.character;
        this.isDeleting = true;
        this.editErrorMessage = '';
        try {
            await deleteCharacter(character.id);
            await this.router.navigate(['/campaigns', character.campaign, 'characters']);
        } catch (error: unknown) {
            this.editErrorMessage = this.asErrorMessage(error, 'Failed to delete character.');
        } finally {
            this.isDeleting = false;
        }
    }

    async adjustHp(type: 'HEAL' | 'DAMAGE'): Promise<void> {
        if (this.character == null) {
            return;
        }

        const mod = Math.max(1, Math.floor(this.hpAdjustAmount || 1));
        this.isHpUpdating = true;
        this.adjustErrorMessage = '';
        try {
            this.character = await modifyCharacterHp(this.character.id, { mod, type });
            this.applyDraftFromCharacter(this.character);
        } catch (error: unknown) {
            this.adjustErrorMessage = this.asErrorMessage(error, 'Failed to update HP.');
        } finally {
            this.isHpUpdating = false;
        }
    }

    async adjustRecovery(type: 'INCREASE' | 'DECREASE'): Promise<void> {
        if (this.character == null) {
            return;
        }

        const mod = Math.max(1, Math.floor(this.recoveryAdjustAmount || 1));
        this.isRecoveryUpdating = true;
        this.adjustErrorMessage = '';
        try {
            this.character = await modifyCharacterRecovery(this.character.id, { mod, type });
            this.applyDraftFromCharacter(this.character);
        } catch (error: unknown) {
            this.adjustErrorMessage = this.asErrorMessage(error, 'Failed to update recoveries.');
        } finally {
            this.isRecoveryUpdating = false;
        }
    }

    async createCondition(): Promise<void> {
        if (this.character == null) {
            return;
        }

        const name = this.newConditionName.trim();
        if (!name) {
            this.conditionErrorMessage = 'Condition name is required.';
            return;
        }

        this.isConditionUpdating = true;
        this.conditionErrorMessage = '';
        try {
            await addCharacterCondition({
                name,
                character: this.character.id,
                endType: this.newConditionEndType,
            });
            this.newConditionName = '';
            await this.reloadCharacter();
        } catch (error: unknown) {
            this.conditionErrorMessage = this.asErrorMessage(error, 'Failed to add condition.');
        } finally {
            this.isConditionUpdating = false;
        }
    }

    async removeCondition(conditionId: number): Promise<void> {
        if (this.character == null) {
            return;
        }

        this.isConditionUpdating = true;
        this.conditionErrorMessage = '';
        try {
            await deleteCharacterCondition(conditionId);
            await this.reloadCharacter();
        } catch (error: unknown) {
            this.conditionErrorMessage = this.asErrorMessage(error, 'Failed to remove condition.');
        } finally {
            this.isConditionUpdating = false;
        }
    }

    async addInventory(): Promise<void> {
        if (this.character == null) {
            return;
        }

        const name = this.newInventoryName.trim();
        if (!name) {
            this.inventoryErrorMessage = 'Item name is required.';
            return;
        }

        const quantity = Math.max(1, Math.floor(this.newInventoryQuantity || 1));

        this.isInventoryUpdating = true;
        this.inventoryErrorMessage = '';
        try {
            await createInventoryItem(this.character.id, { name, quantity });
            this.newInventoryName = '';
            this.newInventoryQuantity = 1;
            await this.reloadCharacter();
        } catch (error: unknown) {
            this.inventoryErrorMessage = this.asErrorMessage(error, 'Failed to add inventory item.');
        } finally {
            this.isInventoryUpdating = false;
        }
    }

    async removeInventory(itemId: number): Promise<void> {
        if (this.character == null) {
            return;
        }

        this.isInventoryUpdating = true;
        this.inventoryErrorMessage = '';
        try {
            await deleteInventoryItem(itemId);
            await this.reloadCharacter();
        } catch (error: unknown) {
            this.inventoryErrorMessage = this.asErrorMessage(error, 'Failed to remove inventory item.');
        } finally {
            this.isInventoryUpdating = false;
        }
    }

    private async loadCampaignCharacters(campaignId: number): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        this.campaignDetails = null;
        this.character = null;

        try {
            this.campaignDetails = await fetchCampaign(campaignId);
        } catch (error: unknown) {
            this.errorMessage = this.asErrorMessage(error, 'Failed to load campaign characters.');
        } finally {
            this.isLoading = false;
        }
    }

    private async loadCharacter(characterId: number): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        this.campaignDetails = null;

        try {
            const character = await fetchCharacter(characterId);
            this.character = character;
            this.applyDraftFromCharacter(character);
        } catch (error: unknown) {
            this.errorMessage = this.asErrorMessage(error, 'Failed to load character.');
            this.character = null;
        } finally {
            this.isLoading = false;
        }
    }

    private async reloadCharacter(): Promise<void> {
        if (this.character == null) {
            return;
        }

        const reloaded = await fetchCharacter(this.character.id);
        this.character = reloaded;
        this.applyDraftFromCharacter(reloaded);
    }

    private applyDraftFromCharacter(character: Character): void {
        this.editName = character.name;
        this.editMaxHp = character.maxHp;
        this.editMaxRecoveries = character.maxRecoveries;
        this.editMinions = character.minions;
        this.editResourceName = character.resourceName ?? '';
        this.editPictureUrl = character.pictureUrl ?? '';
        this.editVictories = character.victories;
        this.editOffstage = character.offstage;
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

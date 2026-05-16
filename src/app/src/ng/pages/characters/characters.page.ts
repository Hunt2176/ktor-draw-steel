import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs';
import { CampaignService } from '@services/campaign.service';
import { CharacterService } from '@services/character.service';
import { CharacterConditionService } from '@services/character-condition.service';
import { InventoryItemService } from '@services/inventory-item.service';
import { CampaignDetails, Character, CharacterConditionEndType, InventoryItem } from '@app/types/models';

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
	templateUrl: './characters.page.html',
	styleUrl: './characters.page.scss',
})
export class CharactersPageComponent {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly changeDetector = inject(ChangeDetectorRef);
	private readonly campaignService = inject(CampaignService);
	private readonly characterService = inject(CharacterService);
	private readonly characterConditionService = inject(CharacterConditionService);
	private readonly inventoryItemService = inject(InventoryItemService);

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
			const updated = await firstValueFrom(this.characterService.saveCharacter(this.character.id, {
				name,
				maxHp: Math.max(1, Math.floor(this.editMaxHp || 1)),
				maxRecoveries: Math.max(0, Math.floor(this.editMaxRecoveries || 0)),
				minions: Math.max(0, Math.floor(this.editMinions || 0)),
				resourceName: this.trimToNull(this.editResourceName),
				pictureUrl: this.trimToNull(this.editPictureUrl),
				victories: Math.max(0, Math.floor(this.editVictories || 0)),
				offstage: this.editOffstage,
			}));

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
			await firstValueFrom(this.characterService.deleteCharacter(character.id));
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
			this.character = await firstValueFrom(this.characterService.modifyCharacterHp(this.character.id, { mod, type }));
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
			this.character = await firstValueFrom(this.characterService.modifyCharacterRecovery(this.character.id, { mod, type }));
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
			await firstValueFrom(this.characterConditionService.addCharacterCondition({
				name,
				character: this.character.id,
				endType: this.newConditionEndType,
			}));
			this.newConditionName = '';
			await this.reloadCharacter();
		} catch (error: unknown) {
			this.conditionErrorMessage = this.asErrorMessage(error, 'Failed to add condition.');
		} finally {
			this.isConditionUpdating = false;
			this.changeDetector.detectChanges();
		}
	}

	async removeCondition(conditionId: number): Promise<void> {
		if (this.character == null) {
			return;
		}

		this.isConditionUpdating = true;
		this.conditionErrorMessage = '';
		try {
			await firstValueFrom(this.characterConditionService.deleteCharacterCondition(conditionId));
			await this.reloadCharacter();
		} catch (error: unknown) {
			this.conditionErrorMessage = this.asErrorMessage(error, 'Failed to remove condition.');
		} finally {
			this.isConditionUpdating = false;
			this.changeDetector.detectChanges();
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
			await firstValueFrom(this.inventoryItemService.createInventoryItem(this.character.id, { name, quantity }));
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
			await firstValueFrom(this.inventoryItemService.deleteInventoryItem(itemId));
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
			this.campaignDetails = await firstValueFrom(this.campaignService.fetchCampaign(campaignId));
		} catch (error: unknown) {
			this.errorMessage = this.asErrorMessage(error, 'Failed to load campaign characters.');
		} finally {
			this.isLoading = false;
			this.changeDetector.detectChanges();
		}
	}

	private async loadCharacter(characterId: number): Promise<void> {
		this.isLoading = true;
		this.errorMessage = '';
		this.campaignDetails = null;

		try {
			const character = await firstValueFrom(this.characterService.fetchCharacter(characterId));
			this.character = character;
			this.applyDraftFromCharacter(character);
		} catch (error: unknown) {
			this.errorMessage = this.asErrorMessage(error, 'Failed to load character.');
			this.character = null;
		} finally {
			this.isLoading = false;
			this.changeDetector.detectChanges();
		}
	}

	private async reloadCharacter(): Promise<void> {
		if (this.character == null) {
			return;
		}

		const reloaded = await firstValueFrom(this.characterService.fetchCharacter(this.character.id));
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

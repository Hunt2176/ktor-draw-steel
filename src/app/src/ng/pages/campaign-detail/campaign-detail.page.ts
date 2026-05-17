import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { CampaignService } from '@services/campaign.service';
import { CharacterService } from '@services/character.service';
import { CombatService } from '@services/combat.service';
import { FileService } from '@services/file.service';
import { StateContext } from '@services/state-context';
import { Character, Combat } from '@app/types/models';
import { CharacterCard } from '@app/ng/shared/character-card/character-card';

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
		MatTooltipModule,
		CharacterCard,
	],
	templateUrl: './campaign-detail.page.html',
	styleUrl: './campaign-detail.page.scss',
})
export class CampaignDetailPageComponent {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly campaignService = inject(CampaignService);
	private readonly characterService = inject(CharacterService);
	private readonly combatService = inject(CombatService);
	private readonly fileService = inject(FileService);
	private readonly stateContext = inject(StateContext);
	private readonly destroyRef = inject(DestroyRef);

	campaignId = signal<number | null>(null);
	campaignDetails = this.stateContext.details;
	combats: Combat[] = [];

	isLoading = signal(true);
	isCreatingCombat = signal(false);
	isCreatingCharacter = signal(false);
	isUpdatingBackground = signal(false);
	isDeletingCombatId = signal<number | null>(null);

	errorMessage = signal('');
	backgroundErrorMessage = signal('');
	combatErrorMessage = signal('');
	characterErrorMessage = signal('');

	selectedCombatCharacters: Record<number, boolean> = {};

	newCharacterName = signal('');
	newCharacterMaxHp = signal(40);
	newCharacterMinions = signal(0);
	newCharacterOffstage = signal(false);
	newCharacterPictureUrl = signal('');

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
				this.campaignId.set(id);
				if (id == null) {
					this.errorMessage.set('Invalid campaign id.');
					this.isLoading.set(false);
					this.stateContext.details.set(null);
					return;
				}

				void this.loadCampaign(id);
			});

		// Listen to campaign updates and refresh when needed
		this.stateContext.getCampaignUpdates()
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((update) => {
				console.log('Received socket update:', update);
				// Refresh campaign data when any update is received
				void this.refresh();
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

	characterRecoveriesText(character: Character): string {
		const rec = Character.getRecoveries(character);
		return `${rec.current}/${rec.max}`;
	}

	async refresh(): Promise<void> {
		const campaignId = this.campaignId();
		if (campaignId == null) {
			return;
		}
		await this.loadCampaign(campaignId);
	}

	onCharacterSelectionChange(id: number, event: Event): void {
		const target = event.target as HTMLInputElement | null;
		this.selectedCombatCharacters[id] = target?.checked ?? false;
	}

	async createCombatFromSelection(): Promise<void> {
		if (this.campaignDetails() == null) {
			return;
		}

		const characterIds = this.selectedCharacterIds;
		if (characterIds.length === 0) {
			this.combatErrorMessage.set('Select at least one character to create a combat.');
			return;
		}

		this.isCreatingCombat.set(true);
		this.combatErrorMessage.set('');
		try {
			const combat = await firstValueFrom(this.combatService.createCombat({
				campaign: this.campaignDetails()!.campaign.id,
				characters: characterIds,
			}));

			await this.loadCampaign(this.campaignDetails()!.campaign.id);
			await this.router.navigate(['/combats', combat.id]);
		} catch (error: unknown) {
			this.combatErrorMessage.set(this.asErrorMessage(error, 'Failed to create combat.'));
		} finally {
			this.isCreatingCombat.set(false);
		}
	}

	async removeCombat(combatId: number): Promise<void> {
		if (!globalThis.confirm('Delete this combat?')) {
			return;
		}
		const campaignId = this.campaignId();
		if (campaignId == null) {
			return;
		}

		this.isDeletingCombatId.set(combatId);
		this.combatErrorMessage.set('');
		try {
			await firstValueFrom(this.combatService.deleteCombat(combatId));
			await this.loadCampaign(campaignId);
		} catch (error: unknown) {
			this.combatErrorMessage.set(this.asErrorMessage(error, 'Failed to delete combat.'));
		} finally {
			this.isDeletingCombatId.set(null);
		}
	}

	async createCharacterFromDraft(): Promise<void> {
		if (this.campaignDetails() == null) {
			return;
		}

		const name = this.newCharacterName().trim();
		if (!name) {
			this.characterErrorMessage.set('Character name is required.');
			return;
		}

		if (!Number.isFinite(this.newCharacterMaxHp()) || this.newCharacterMaxHp() <= 0) {
			this.characterErrorMessage.set('Max HP must be greater than zero.');
			return;
		}

		this.isCreatingCharacter.set(true);
		this.characterErrorMessage.set('');
		const campaignDetails = this.campaignDetails();

		try {
			await firstValueFrom(this.characterService.createCharacter({
				name,
				campaign: campaignDetails!.campaign.id,
				user: 1,
				maxHp: Math.floor(this.newCharacterMaxHp()),
				maxRecoveries: 0,
				offstage: this.newCharacterOffstage(),
				minions: Math.max(0, Math.floor(this.newCharacterMinions() || 0)),
				pictureUrl: this.trimToNull(this.newCharacterPictureUrl()),
			}));

			this.newCharacterName.set('');
			this.newCharacterMaxHp.set(40);
			this.newCharacterMinions.set(0);
			this.newCharacterOffstage.set(false);
			this.newCharacterPictureUrl.set('');

			await this.loadCampaign(campaignDetails!.campaign.id);
		} catch (error: unknown) {
			this.characterErrorMessage.set(this.asErrorMessage(error, 'Failed to create character.'));
		} finally {
			this.isCreatingCharacter.set(false);
		}
	}

	async onBackgroundFileChange(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement | null;
		const file = input?.files?.[0];
		const campaignId = this.campaignId();
		if (campaignId == null || file == null) {
			return;
		}

		this.isUpdatingBackground.set(true);
		this.backgroundErrorMessage.set('');
		try {
			const uploadResult = await firstValueFrom(this.fileService.uploadFile(file));
			await firstValueFrom(this.campaignService.updateCampaign(campaignId, {
				background: `/files/${uploadResult.fileName}`,
			}));
			await this.loadCampaign(campaignId);
		} catch (error: unknown) {
			this.backgroundErrorMessage.set(this.asErrorMessage(error, 'Failed to upload background.'));
		} finally {
			this.isUpdatingBackground.set(false);
			if (input != null) {
				input.value = '';
			}
		}
	}

	private async loadCampaign(id: number): Promise<void> {
		this.isLoading.set(true);
		this.errorMessage.set('');
		this.combatErrorMessage.set('');
		this.characterErrorMessage.set('');
		this.backgroundErrorMessage.set('');

		try {
			const [campaignDetails, combats] = await Promise.all([
				firstValueFrom(this.campaignService.fetchCampaign(id)),
				firstValueFrom(this.combatService.fetchCombatsFor(id)),
			]);
			this.campaignDetails.set(campaignDetails);
			this.combats = combats;
			this.selectedCombatCharacters = campaignDetails.characters.reduce(
				(acc, character) => {
					acc[character.id] = !character.offstage;
					return acc;
				},
				{} as Record<number, boolean>,
			);
		} catch (error: unknown) {
			this.errorMessage.set(this.asErrorMessage(error, 'Failed to load campaign details.'));
		} finally {
			this.isLoading.set(false);
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

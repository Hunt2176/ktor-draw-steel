import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
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
import { WebSocketService } from '@services/websocket.service';
import { CampaignDetails, Character, Combat } from '@app/types/models';

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
	],
	templateUrl: './campaign-detail.page.html',
	styleUrl: './campaign-detail.page.scss',
})
export class CampaignDetailPageComponent {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly changeDetector = inject(ChangeDetectorRef);
	private readonly campaignService = inject(CampaignService);
	private readonly characterService = inject(CharacterService);
	private readonly combatService = inject(CombatService);
	private readonly fileService = inject(FileService);
	private readonly webSocketService = inject(WebSocketService);
	private readonly destroyRef = inject(DestroyRef);
	private watchedCampaignId: number | null = null;

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
					this.webSocketService.disconnect();
					return;
				}

				void this.loadCampaign(id);
				this.setupWebSocketListener(id);
			});

		// Disconnect WebSocket on component destroy
		this.destroyRef.onDestroy(() => {
			this.watchedCampaignId = null;
			this.webSocketService.disconnect();
		});
	}

	private setupWebSocketListener(campaignId: number): void {
		if (this.watchedCampaignId === campaignId) {
			return;
		}

		this.watchedCampaignId = campaignId;

		// Connect to WebSocket
		this.webSocketService.connectToCampaign(campaignId);

		// Listen to campaign updates
		this.webSocketService
			.getCampaignUpdates(campaignId)
			.pipe(takeUntilDestroyed(this.destroyRef))
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
			const combat = await firstValueFrom(this.combatService.createCombat({
				campaign: this.campaignDetails.campaign.id,
				characters: characterIds,
			}));

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
			await firstValueFrom(this.combatService.deleteCombat(combatId));
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
			await firstValueFrom(this.characterService.createCharacter({
				name,
				campaign: this.campaignDetails.campaign.id,
				user: 1,
				maxHp: Math.floor(this.newCharacterMaxHp),
				maxRecoveries: 0,
				offstage: this.newCharacterOffstage,
				minions: Math.max(0, Math.floor(this.newCharacterMinions || 0)),
				pictureUrl: this.trimToNull(this.newCharacterPictureUrl),
			}));

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
			const uploadResult = await firstValueFrom(this.fileService.uploadFile(file));
			await firstValueFrom(this.campaignService.updateCampaign(this.campaignId, {
				background: `/files/${uploadResult.fileName}`,
			}));
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
			const [campaignDetails, combats] = await Promise.all([
				firstValueFrom(this.campaignService.fetchCampaign(id)),
				firstValueFrom(this.combatService.fetchCombatsFor(id)),
			]);
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
			this.changeDetector.detectChanges();
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

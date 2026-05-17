import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs';
import { CampaignService } from '@services/campaign.service';
import { CombatService } from '@services/combat.service';
import { CombatantService } from '@services/combatant.service';
import { StateContext } from '@services/state-context';
import { Character, Combat, Combatant } from '@app/types/models';

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
	templateUrl: './combat.page.html',
	styleUrl: './combat.page.scss',
})
export class CombatPageComponent {
	private readonly route = inject(ActivatedRoute);
	private readonly changeDetector = inject(ChangeDetectorRef);
	private readonly campaignService = inject(CampaignService);
	private readonly combatService = inject(CombatService);
	private readonly combatantService = inject(CombatantService);
	private readonly stateContext = inject(StateContext);
	private readonly destroyRef = inject(DestroyRef);

	combatId: number | null = null;
	combat: Combat | null = null;
	activeCampaign = this.stateContext.details;

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
					this.stateContext.details.set(null);
					return;
				}

				void this.loadCombat(id);
			});

		// Listen to campaign updates and refresh when needed
		this.stateContext.getCampaignUpdates()
			?.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((update) => {
				console.log('Received socket update:', update);
				// Refresh combat data when any update is received
				void this.refresh();
			});
	}

	get sortedCampaignCharacters(): Character[] {
		return (this.activeCampaign()?.characters ?? []).toSorted((a, b) => {
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

	combatantRecoveriesText(combatant: Combatant): string {
		const rec = Character.getRecoveries(combatant.character);
		return `${rec.current}/${rec.max}`;
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
			await firstValueFrom(this.combatService.updateCombatRound(this.combat.id, {
				fromRound: this.combat.round,
				reset: true,
				updateConditions: this.clearRoundOnlyConditions,
			}));
			await this.refresh();
		} catch (error: unknown) {
			this.updateErrorMessage = this.asErrorMessage(error, 'Failed to update round.');
		} finally {
			this.isUpdatingRound = false;
		}
	}

	async adjustHeroTokens(type: 'INCREASE' | 'DECREASE'): Promise<void> {
		if (this.activeCampaign() == null) {
			return;
		}

		const modifyBy = Math.max(1, Math.floor(this.heroTokenAdjustAmount || 1));

		this.isUpdatingHeroTokens = true;
		this.updateErrorMessage = '';
		try {
			await firstValueFrom(this.campaignService.modifyHeroTokens(this.activeCampaign()!.campaign.id, { modifyBy, type }));
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
			await firstValueFrom(this.combatService.quickAddCombatant(this.combat.id, {
				character: {
					name,
					maxHp: Math.floor(this.quickAddMaxHp),
					user: 1,
					offstage: this.quickAddOffstage,
				},
			}));

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
		if (this.combat == null || this.activeCampaign == null) {
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
			await firstValueFrom(this.combatService.updateCombatModification(this.combat.id, {
				add: add.length > 0 ? add : undefined,
				remove: remove.length > 0 ? remove : undefined,
			}));
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
			await firstValueFrom(this.combatantService.updateCombatantActive(combatant.id, !combatant.available));
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
			await firstValueFrom(this.combatantService.updateCombatantValue(combatant.id, { key, type, value: 1 }));
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
			const combat = await firstValueFrom(this.combatService.fetchCombat(id));
			const campaign = await firstValueFrom(this.campaignService.fetchCampaign(combat.campaign));

			this.combat = combat;
			this.stateContext.details.set(campaign);

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
			this.stateContext.details.set(null);
			this.errorMessage = this.asErrorMessage(error, 'Failed to load combat.');
		} finally {
			this.isLoading = false;
			this.changeDetector.detectChanges();
		}
	}


	private asErrorMessage(error: unknown, fallback: string): string {
		if (error instanceof Error && error.message.trim().length > 0) {
			return error.message;
		}
		return fallback;
	}
}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs';
import { CampaignService } from '@services/campaign.service';
import { DisplayEntryService } from '@services/display-entry.service';
import { FileService } from '@services/file.service';
import { StateContext } from '@services/state-context';
import { DisplayEntry, DisplayEntryType } from '@app/types/models';

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
	templateUrl: './display.page.html',
	styleUrl: './display.page.scss',
})
export class DisplayPageComponent {
	private readonly route = inject(ActivatedRoute);
	private readonly changeDetector = inject(ChangeDetectorRef);
	private readonly campaignService = inject(CampaignService);
	private readonly displayEntryService = inject(DisplayEntryService);
	private readonly fileService = inject(FileService);
	private readonly stateContext = inject(StateContext);
	private readonly destroyRef = inject(DestroyRef);

	campaignId: number | null = null;
	campaignDetails = this.stateContext.details;
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
				// Refresh display data when any update is received
				void this.refresh();
			});
	}

	get allEntries(): DisplayEntryView[] {
		const campaignEntries = (this.campaignDetails()?.entries ?? []).map((entry) => ({
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
				const uploadResult = await firstValueFrom(this.fileService.uploadFile(this.newEntryFile));
				pictureUrl = `/files/${uploadResult.fileName}`;
			}

			await firstValueFrom(this.displayEntryService.createDisplayEntry({
				campaign: this.campaignId,
				title,
				description: this.trimToNull(this.newEntryDescription),
				pictureUrl,
				type: this.newEntryType,
			}));

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
			await firstValueFrom(this.displayEntryService.deleteDisplayEntry(id));
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
			const campaign = await firstValueFrom(this.campaignService.fetchCampaign(id));
			this.stateContext.details.set(campaign);
			await this.loadKankaEntries(campaign.campaign.kankaApiId, id);
			this.clampActiveEntryIndex();
		} catch (error: unknown) {
			this.stateContext.details.set(null);
			this.kankaEntries = [];
			this.errorMessage = this.asErrorMessage(error, 'Failed to load display entries.');
		} finally {
			this.isLoading = false;
			this.changeDetector.detectChanges();
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

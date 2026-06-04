import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { z } from 'zod';
import {
  KankaBaseModel,
  KankaCharacterModel,
  KankaHasEntryModel,
  KankaHasParsedEntryModel,
  type KankaBase,
} from '@draw-steel/shared';
import type { DisplayEntryType } from '../../core/models';
import { ApiService } from '../../core/api.service';
import { CampaignStore } from '../../core/campaign-store.service';
import { ButtonComponent } from '../../ui/button.component';
import { IconComponent } from '../../ui/icon.component';
import { ModalComponent } from '../../ui/modal.component';
import {
  DisplayEntryEditorComponent,
  type DisplayEntryEditorUpdate,
} from '../components/display-entry-editor.component';

interface DisplayModel {
  id: number;
  title: string;
  description: string | null;
  pictureUrl: string | null;
  type: DisplayEntryType;
  campaign: number;
  isKanka: boolean;
  backLink?: string;
}

/** Full-screen campaign display: a carousel of portrait/background slides,
 * optionally merged with Kanka content, with a drawer to navigate/manage. */
@Component({
  selector: 'app-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent, ModalComponent, DisplayEntryEditorComponent],
  template: `
    @if (campaign(); as camp) {
      <!-- burger -->
      <div class="absolute z-[100] m-2">
        <button class="flex flex-col gap-1 p-2" (click)="drawerOpen.set(!drawerOpen())">
          <span class="block h-0.5 w-6 bg-current"></span>
          <span class="block h-0.5 w-6 bg-current"></span>
          <span class="block h-0.5 w-6 bg-current"></span>
        </button>
      </div>

      <!-- carousel -->
      <div class="flex h-screen">
        <div #viewport class="overflow-hidden" style="flex: 1">
          <div class="flex h-full">
            @for (entry of items(); track entry.id) {
              <div class="relative h-full min-w-0 flex-[0_0_100%]" style="container-type: size">
                @if (entry.type === 'Background' && entry.pictureUrl) {
                  <div class="flex h-full flex-col items-center justify-end bg-cover bg-center pb-2" [style.backgroundImage]="'url(' + entry.pictureUrl + ')'">
                    <h1 class="text-center text-5xl font-bold" [style.cursor]="entry.backLink ? 'pointer' : 'default'" (click)="openBackLink(entry)">{{ entry.title }}</h1>
                    @if (entry.description) {
                      <div class="glass mt-2 max-h-[40%] overflow-auto whitespace-pre-wrap rounded-3xl p-3 text-center text-2xl">
                        @if (entry.isKanka) { <span [innerHTML]="entry.description"></span> } @else { {{ entry.description }} }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="flex h-full flex-col p-2">
                    <div class="flex items-center justify-center" [style.height]="entry.pictureUrl ? '60cqh' : '40cqh'">
                      @if (entry.pictureUrl) {
                        <img class="h-full w-auto rounded-3xl object-contain" [src]="entry.pictureUrl" alt="" />
                      }
                    </div>
                    <div class="flex flex-col items-center" style="height: 40cqh">
                      <h1 class="text-center text-5xl font-bold" [style.cursor]="entry.backLink ? 'pointer' : 'default'" (click)="openBackLink(entry)">{{ entry.title }}</h1>
                      @if (entry.description) {
                        <div class="glass mt-2 max-h-full overflow-auto whitespace-pre-wrap rounded-3xl p-3 text-center text-2xl">
                          @if (entry.isKanka) { <span [innerHTML]="entry.description"></span> } @else { {{ entry.description }} }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- drawer -->
      @if (drawerOpen()) {
        <div class="fixed inset-0 z-[150]" (click)="drawerOpen.set(false)">
          <div class="ds-card absolute left-0 top-0 h-full w-80 overflow-y-auto rounded-none" (click)="$event.stopPropagation()">
            <button class="mb-4 text-2xl font-bold" (click)="goToCampaign()">{{ camp.campaign.name }}</button>
            <div class="mb-2 flex justify-end">
              <app-button color="green" variant="transparent" size="compact" (clicked)="editOpen.set(true)">
                <app-icon [name]="plus" /><span>Add Entry</span>
              </app-button>
            </div>
            <div class="flex flex-col gap-2">
              @for (entry of items(); track entry.id; let idx = $index) {
                <div class="grid grid-cols-6 items-center gap-1">
                  <app-button class="col-span-5" variant="outline" fullWidth (clicked)="scrollTo(idx)">{{ entry.title }}</app-button>
                  @if (!entry.isKanka) {
                    <app-button color="red" (clicked)="deleteEntry(entry.id)"><app-icon [name]="trash" /></app-button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- add entry modal -->
      <app-modal [opened]="editOpen()" (closed)="editOpen.set(false)">
        <app-display-entry-editor (changed)="editorState.set($event)" />
        <hr class="ds-divider" />
        <div class="flex justify-end">
          <app-button color="green" [disabled]="editorState() == null" (clicked)="createEntry()">Save</app-button>
        </div>
      </app-modal>
    } @else {
      <div class="flex h-screen items-center justify-center">Loading...</div>
    }
  `,
})
export class DisplayComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);

  protected readonly plus = faPlus;
  protected readonly trash = faTrash;

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private embla?: EmblaCarouselType;

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly id = computed(() => Number.parseInt(this.params().get('id') ?? '', 10));

  protected readonly campaign = computed(() => {
    const id = this.id();
    if (Number.isNaN(id)) return undefined;
    return this.store.campaign(id)();
  });

  private readonly kankaItems = signal<KankaBase[]>([]);
  private kankaLoadedFor: number | null = null;

  readonly drawerOpen = signal(false);
  readonly editOpen = signal(false);
  readonly editorState = signal<DisplayEntryEditorUpdate | null>(null);

  protected readonly items = computed<DisplayModel[]>(() => {
    const campaignEntries = this.campaign()?.entries ?? [];
    const campaignId = this.id();
    const entries: DisplayModel[] = [
      ...campaignEntries.map((e) => ({ ...e, isKanka: false })),
      ...this.kankaItems().map((e) => this.toKankaModel(e, campaignId)),
    ];
    return entries.sort((a, b) => (a.title > b.title ? 1 : -1));
  });

  constructor() {
    if (Number.isNaN(this.id())) void this.router.navigate(['/campaigns']);
    effect(() => {
      const camp = this.campaign();
      const apiId = camp?.campaign.kankaApiId;
      if (apiId != null && this.kankaLoadedFor !== apiId) {
        this.kankaLoadedFor = apiId;
        void this.loadKanka(apiId);
      }
    });
    // Re-init embla whenever the slide set changes.
    effect(() => {
      this.items();
      queueMicrotask(() => this.embla?.reInit());
    });
  }

  ngAfterViewInit(): void {
    const node = this.viewport()?.nativeElement;
    if (node) this.embla = EmblaCarousel(node, { loop: false });
  }

  ngOnDestroy(): void {
    this.embla?.destroy();
  }

  scrollTo(index: number): void {
    this.embla?.scrollTo(index, true);
    this.drawerOpen.set(false);
  }

  goToCampaign(): void {
    void this.router.navigate(['/campaigns', this.id()]);
  }

  openBackLink(entry: DisplayModel): void {
    if (entry.backLink) window.open(entry.backLink, '_blank');
  }

  async createEntry(): Promise<void> {
    const entry = this.editorState();
    if (!entry) return;
    let fileUrl: string | null = null;
    if (entry.file) {
      const uploaded = await this.api.uploadFile(entry.file);
      fileUrl = '/files/' + uploaded.fileName;
    }
    await this.api.createDisplayEntry({
      title: entry.title,
      description: entry.description ?? null,
      type: entry.type,
      pictureUrl: fileUrl,
      campaign: this.id(),
    });
    this.store.refetchCampaign(this.id());
    this.editOpen.set(false);
  }

  async deleteEntry(id: number): Promise<void> {
    await this.api.deleteDisplayEntry(id);
    this.store.refetchCampaign(this.id());
  }

  private async loadKanka(kankaApiId: number): Promise<void> {
    const fetchJson = async (path: string): Promise<KankaBase[]> => {
      const json = await this.api.kanka<{ data: unknown }>(path);
      return z.looseObject(KankaBaseModel.shape).array().parse(json.data);
    };
    try {
      const arrays = await Promise.all([
        fetchJson(`/campaigns/${kankaApiId}/characters`),
        fetchJson(`/campaigns/${kankaApiId}/locations`),
        fetchJson(`/campaigns/${kankaApiId}/creatures`),
        fetchJson(`/campaigns/${kankaApiId}/events`),
      ]);
      this.kankaItems.set(arrays.flat());
    } catch (err) {
      console.error(err);
    }
  }

  private toKankaModel(e: KankaBase, campaignId: number): DisplayModel {
    const transform = (s?: string | null): string | null =>
      s == null ? null : s.replaceAll('\\"', '"');

    const model: DisplayModel = {
      id: -e.id,
      title: e.name,
      description: null,
      campaign: campaignId,
      pictureUrl: e.image_full ?? null,
      type: 'Portrait',
      isKanka: true,
    };

    const parsed = KankaHasParsedEntryModel.safeParse(e);
    if (parsed.success && parsed.data.entry_parsed) {
      model.description = transform(parsed.data.entry_parsed);
    } else {
      const entryModel = KankaHasEntryModel.safeParse(e);
      if (entryModel.success && entryModel.data.entry) {
        model.description = transform(entryModel.data.entry);
      }
    }

    const urls = KankaCharacterModel.pick({ urls: true }).safeParse(e);
    if (urls.success && urls.data.urls.view) {
      model.backLink = urls.data.urls.view;
    }

    return model;
  }
}

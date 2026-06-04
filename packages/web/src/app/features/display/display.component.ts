import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  HostListener,
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
import {
  faBars,
  faChevronLeft,
  faChevronRight,
  faImage,
  faPlus,
  faTrash,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
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
      <div class="absolute z-[100] m-3">
        <button
          type="button"
          aria-label="Open navigation drawer"
          class="glass flex h-12 w-12 items-center justify-center rounded-xl border border-ds-accent/30 text-ds-accent shadow-ds-1 transition hover:border-ds-accent hover:text-ds-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          (click)="drawerOpen.set(!drawerOpen())"
        >
          <app-icon [name]="bars" class="text-xl" />
        </button>
      </div>

      @if (items().length > 0) {
        <!-- carousel -->
        <div class="relative flex h-screen">
          <div #viewport class="overflow-hidden" style="flex: 1">
            <div class="flex h-full">
              @for (entry of items(); track entry.id) {
                <div class="relative h-full min-w-0 flex-[0_0_100%]" style="container-type: size">
                  @if (entry.type === 'Background' && entry.pictureUrl) {
                    <div
                      class="relative flex h-full flex-col items-center justify-end bg-cover bg-center pb-6"
                      [style.backgroundImage]="'url(' + entry.pictureUrl + ')'"
                    >
                      <!-- bottom scrim for legibility over the background image -->
                      <div
                        class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                      ></div>
                      <h1
                        class="ds-slide-title font-display relative text-center text-6xl font-bold tracking-wide text-m-dark-0"
                        [style.cursor]="entry.backLink ? 'pointer' : 'default'"
                        (click)="openBackLink(entry)"
                      >
                        {{ entry.title }}
                      </h1>
                      @if (entry.description) {
                        <div
                          class="glass relative mt-3 max-h-[40%] overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 p-4 text-center text-2xl shadow-ds-2"
                        >
                          @if (entry.isKanka) {
                            <span [innerHTML]="entry.description"></span>
                          } @else {
                            {{ entry.description }}
                          }
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="flex h-full flex-col p-4">
                      <div
                        class="flex items-center justify-center"
                        [style.height]="entry.pictureUrl ? '60cqh' : '40cqh'"
                      >
                        @if (entry.pictureUrl) {
                          <img
                            class="h-full w-auto rounded-3xl object-contain ring-1 ring-ds-accent/30 shadow-ds-2"
                            [src]="entry.pictureUrl"
                            alt=""
                          />
                        }
                      </div>
                      <div class="relative flex flex-col items-center" style="height: 40cqh">
                        <h1
                          class="ds-slide-title font-display mt-2 text-center text-6xl font-bold tracking-wide text-m-dark-0"
                          [style.cursor]="entry.backLink ? 'pointer' : 'default'"
                          (click)="openBackLink(entry)"
                        >
                          {{ entry.title }}
                        </h1>
                        @if (entry.description) {
                          <div
                            class="glass mt-3 max-h-full overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 p-4 text-center text-2xl shadow-ds-2"
                          >
                            @if (entry.isKanka) {
                              <span [innerHTML]="entry.description"></span>
                            } @else {
                              {{ entry.description }}
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- prev / next arrows -->
          @if (canPrev()) {
            <button
              type="button"
              aria-label="Previous slide"
              class="glass absolute left-4 top-1/2 z-[90] flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-ds-accent/30 text-2xl text-ds-accent shadow-ds-2 transition hover:border-ds-accent hover:text-ds-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
              (click)="prev()"
            >
              <app-icon [name]="chevronLeft" />
            </button>
          }
          @if (canNext()) {
            <button
              type="button"
              aria-label="Next slide"
              class="glass absolute right-4 top-1/2 z-[90] flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-ds-accent/30 text-2xl text-ds-accent shadow-ds-2 transition hover:border-ds-accent hover:text-ds-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
              (click)="next()"
            >
              <app-icon [name]="chevronRight" />
            </button>
          }

          <!-- dots + slide counter -->
          @if (items().length > 1) {
            <div
              class="glass absolute bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 px-4 py-2 shadow-ds-2"
            >
              <div class="flex items-center gap-2">
                @for (entry of items(); track entry.id; let idx = $index) {
                  <button
                    type="button"
                    [attr.aria-label]="'Go to slide ' + (idx + 1)"
                    [attr.aria-current]="idx === currentIndex() ? 'true' : null"
                    class="h-2.5 rounded-full transition-all"
                    [class.w-6]="idx === currentIndex()"
                    [class.bg-ds-ember]="idx === currentIndex()"
                    [class.w-2.5]="idx !== currentIndex()"
                    [class.bg-m-dark-2]="idx !== currentIndex()"
                    [class.hover:bg-ds-accent]="idx !== currentIndex()"
                    (click)="scrollTo(idx)"
                  ></button>
                }
              </div>
              <span class="font-display text-sm tabular-nums text-m-dark-1"
                >{{ currentIndex() + 1 }} / {{ items().length }}</span
              >
            </div>
          }
        </div>
      } @else {
        <!-- empty state -->
        <div class="flex h-screen flex-col items-center justify-center gap-6 text-center">
          <app-icon [name]="image" class="text-6xl text-ds-accent/50" />
          <div>
            <h2 class="font-display text-3xl font-bold text-m-dark-0">No display entries yet</h2>
            <p class="mt-2 text-m-dark-2">Add your first entry to start the show.</p>
          </div>
          <app-button color="green" (clicked)="editOpen.set(true)">
            <app-icon [name]="plus" /><span>Add Entry</span>
          </app-button>
        </div>
      }

      <!-- drawer -->
      @if (drawerOpen()) {
        <div class="fixed inset-0 z-[150] bg-black/40" (click)="drawerOpen.set(false)">
          <div
            class="ds-card ds-drawer absolute left-0 top-0 h-full w-80 overflow-y-auto rounded-none border-r border-ds-accent/30"
            (click)="$event.stopPropagation()"
          >
            <button
              type="button"
              class="font-display mb-4 text-left text-2xl font-bold text-ds-accent transition hover:text-ds-ember"
              (click)="goToCampaign()"
            >
              {{ camp.campaign.name }}
            </button>
            <div class="mb-3 flex justify-end">
              <app-button color="green" variant="transparent" size="compact" (clicked)="editOpen.set(true)">
                <app-icon [name]="plus" /><span>Add Entry</span>
              </app-button>
            </div>
            <div class="flex flex-col gap-2">
              @for (entry of items(); track entry.id; let idx = $index) {
                <div class="grid grid-cols-6 items-center gap-1">
                  <button
                    type="button"
                    class="ds-drawer-entry col-span-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition"
                    [class.is-active]="idx === currentIndex()"
                    (click)="scrollTo(idx)"
                  >
                    <app-icon [name]="entryIcon(entry)" class="shrink-0 text-ds-accent" />
                    <span class="min-w-0 flex-1 truncate">{{ entry.title }}</span>
                    @if (entry.isKanka) {
                      <span
                        class="shrink-0 rounded border border-ds-accent/40 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ds-accent"
                        >Kanka</span
                      >
                    }
                  </button>
                  @if (!entry.isKanka) {
                    <app-button color="red" (clicked)="deleteEntry(entry.id)"
                      ><app-icon [name]="trash"
                    /></app-button>
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
          <app-button color="green" [disabled]="editorState() == null" (clicked)="createEntry()"
            >Save</app-button
          >
        </div>
      </app-modal>
    } @else {
      <!-- branded loader -->
      <div class="flex h-screen flex-col items-center justify-center gap-5">
        <div class="ds-spinner" aria-hidden="true"></div>
        <span class="font-display text-3xl font-bold tracking-[0.2em] text-ds-accent">Draw Steel</span>
        <span class="sr-only">Loading</span>
      </div>
    }
  `,
  styles: [
    `
      /* Dramatic, legible slide titles over images. */
      .ds-slide-title {
        text-shadow:
          0 2px 6px rgba(0, 0, 0, 0.85),
          0 0 18px rgba(0, 0, 0, 0.5);
      }

      /* Drawer entry rows: subtle by default, accented when active. */
      .ds-drawer-entry {
        border-color: var(--color-m-dark-4);
        color: var(--color-m-dark-0);
      }
      .ds-drawer-entry:hover {
        border-color: color-mix(in srgb, var(--color-ds-accent) 50%, transparent);
        background: color-mix(in srgb, var(--color-ds-accent) 10%, transparent);
      }
      .ds-drawer-entry.is-active {
        border-color: var(--color-ds-ember);
        background: color-mix(in srgb, var(--color-ds-ember) 14%, transparent);
        color: var(--color-m-dark-0);
        font-weight: 600;
      }

      /* Branded spinner. */
      .ds-spinner {
        width: 3rem;
        height: 3rem;
        border-radius: 9999px;
        border: 3px solid color-mix(in srgb, var(--color-ds-accent) 25%, transparent);
        border-top-color: var(--color-ds-ember);
        animation: ds-spin 0.9s linear infinite;
      }
      @keyframes ds-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Drawer slide-in. */
      @keyframes ds-drawer-in {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }
      .ds-drawer {
        animation: ds-drawer-in 0.22s ease-out;
      }

      @media (prefers-reduced-motion: reduce) {
        .ds-spinner {
          animation: none;
        }
        .ds-drawer {
          animation: none;
        }
      }
    `,
  ],
})
export class DisplayComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);

  protected readonly plus = faPlus;
  protected readonly trash = faTrash;
  protected readonly bars = faBars;
  protected readonly chevronLeft = faChevronLeft;
  protected readonly chevronRight = faChevronRight;
  protected readonly image = faImage;
  protected readonly user = faUser;

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private embla?: EmblaCarouselType;

  /** Current carousel slide index, kept in sync via embla's 'select' event. */
  readonly currentIndex = signal(0);
  readonly canPrev = signal(false);
  readonly canNext = signal(false);

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
      queueMicrotask(() => {
        this.embla?.reInit();
        this.syncCarouselState();
      });
    });
  }

  ngAfterViewInit(): void {
    const node = this.viewport()?.nativeElement;
    if (node) {
      this.embla = EmblaCarousel(node, { loop: false });
      this.embla.on('select', () => this.syncCarouselState());
      this.embla.on('reInit', () => this.syncCarouselState());
      this.syncCarouselState();
    }
  }

  ngOnDestroy(): void {
    this.embla?.destroy();
  }

  /** Mirrors embla's current index + nav availability into signals. */
  private syncCarouselState(): void {
    if (!this.embla) return;
    this.currentIndex.set(this.embla.selectedScrollSnap());
    this.canPrev.set(this.embla.canScrollPrev());
    this.canNext.set(this.embla.canScrollNext());
  }

  /** Arrow-key navigation across the carousel. */
  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.prev();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.next();
      event.preventDefault();
    }
  }

  prev(): void {
    this.embla?.scrollPrev();
  }

  next(): void {
    this.embla?.scrollNext();
  }

  /** Maps an entry to its row icon: Background → image, Portrait → user/image. */
  protected entryIcon(entry: DisplayModel) {
    if (entry.type === 'Background') return this.image;
    return entry.isKanka ? this.user : entry.pictureUrl ? this.image : this.user;
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

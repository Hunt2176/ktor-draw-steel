import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
  viewChildren,
  ElementRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { RealtimeService } from '../../core/realtime.service';
import { BackgroundService } from '../../core/background.service';
import { IconButton } from '../../ui/icon-button';
import { Icon } from '../../ui/icon';
import { Button } from '../../ui/button';
import { Modal } from '../../ui/modal';
import { ConfirmationPopover } from '../../ui/confirmation-popover';
import {
  DisplayEntryEditor,
  type DisplayEntryEditorValue,
} from '../shared/display-entry-editor';
import {
  KankaBaseModel,
  type DisplayEntryType,
} from '@draw-steel/shared';
import { z } from 'zod';

interface DisplayModel {
  id: number;
  title: string;
  description: string | null;
  pictureUrl: string | null;
  type: DisplayEntryType;
  isKanka: boolean;
  backLink?: string;
}

const KankaLoose = z.looseObject(KankaBaseModel.shape).array();

@Component({
  selector: 'ds-display-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RealtimeService],
  imports: [
    NgTemplateOutlet,
    IconButton,
    Icon,
    Button,
    Modal,
    ConfirmationPopover,
    DisplayEntryEditor,
  ],
  template: `
    @if (campaign.value(); as details) {
      <!-- burger -->
      <div class="absolute z-[100] m-2">
        <ds-icon-btn variant="subtle" color="gray" (click)="drawerOpen.set(true)">
          <ds-icon name="bars" />
        </ds-icon-btn>
      </div>

      <!-- drawer -->
      @if (drawerOpen()) {
        <div class="fixed inset-0 z-[150] ds-scrim-overlay" (click)="drawerOpen.set(false)">
          <div
            class="glass ds-rail absolute left-0 top-0 h-full w-80 flex flex-col overflow-hidden border-r border-[color:var(--color-dark-4)]"
            (click)="$event.stopPropagation()"
          >
            <div class="ds-rail-head p-3 border-b border-[color:var(--color-dark-5)]">
              <ds-button variant="transparent" fullWidth (click)="goCampaign()">
                <span class="flex items-center gap-2 w-full">
                  <ds-icon name="arrow-left" />
                  <span class="text-xl font-bold truncate">{{ details.campaign.name }}</span>
                </span>
              </ds-button>
            </div>

            <div class="flex-1 overflow-y-auto p-3">
              <div class="flex flex-col gap-1.5">
                @for (entry of items(); track entry.id; let idx = $index) {
                  <div class="ds-rail-row grid grid-cols-[1fr_auto] gap-1.5 items-center">
                    <ds-button variant="subtle" fullWidth (click)="scrollTo(idx)">
                      <span class="flex items-center gap-2 w-full text-left">
                        <ds-icon [name]="entry.type === 'Background' ? 'image' : 'book'" />
                        <span class="truncate">{{ entry.title }}</span>
                      </span>
                    </ds-button>
                    @if (!entry.isKanka) {
                      <ds-confirmation-popover
                        title="Delete entry?"
                        message="Are you sure you want to delete this entry?"
                        (accept)="deleteEntry(entry.id)"
                      >
                        <ds-icon-btn cpTrigger variant="subtle" color="red"
                          ><ds-icon name="trash"
                        /></ds-icon-btn>
                      </ds-confirmation-popover>
                    }
                  </div>
                } @empty {
                  <div class="text-center text-sm opacity-60 py-6 px-2">
                    No display entries yet.
                  </div>
                }
              </div>
            </div>

            <div class="ds-rail-foot p-3 border-t border-[color:var(--color-dark-5)]">
              <ds-button color="green" fullWidth (click)="editorOpen.set(true)">
                <span class="flex items-center justify-center gap-2">
                  <ds-icon name="plus" />
                  <span>Add Entry</span>
                </span>
              </ds-button>
            </div>
          </div>
        </div>
      }

      <!-- add entry modal -->
      <ds-modal [opened]="editorOpen()" (closed)="editorOpen.set(false)">
        <ds-display-entry-editor (changed)="editorValue.set($event)" />
        <hr class="my-2 border-[color:var(--color-dark-5)]" />
        <div class="flex justify-end">
          <ds-button
            color="green"
            [disabled]="!editorValue()?.valid"
            (click)="saveEntry(details.campaign.id)"
            >Save</ds-button
          >
        </div>
      </ds-modal>

      <!-- carousel -->
      <div class="h-full">
        <div class="ds-carousel">
          @for (entry of items(); track entry.id) {
            <div #slide class="ds-slide" style="container-type: size">
              @if (entry.type === 'Background') {
                @if (entry.pictureUrl) {
                  <div
                    class="ds-scene h-full w-full bg-center bg-cover flex flex-col justify-end items-center"
                    [style.background-image]="'url(' + entry.pictureUrl + ')'"
                  >
                    <div class="ds-scene-scrim"></div>
                    <ng-container
                      [ngTemplateOutlet]="caption"
                      [ngTemplateOutletContext]="{ $implicit: entry }"
                    />
                  </div>
                } @else {
                  <div class="ds-scene ds-scene-empty h-full w-full flex flex-col justify-end items-center">
                    <ng-container
                      [ngTemplateOutlet]="caption"
                      [ngTemplateOutletContext]="{ $implicit: entry }"
                    />
                  </div>
                }
              } @else if (entry.type === 'Portrait') {
                <div class="h-full flex flex-col">
                  <div
                    class="flex items-center justify-center"
                    [style.height]="entry.pictureUrl ? '60cqh' : '40cqh'"
                  >
                    @if (entry.pictureUrl) {
                      <img
                        [src]="entry.pictureUrl"
                        class="h-full w-auto object-contain rounded-3xl"
                        alt=""
                      />
                    } @else {
                      <div class="ds-monogram glass flex items-center justify-center rounded-3xl">
                        <span class="ds-monogram-letter">{{ initial(entry.title) }}</span>
                      </div>
                    }
                  </div>
                  <div style="height: 40cqh">
                    <ng-container
                      [ngTemplateOutlet]="caption"
                      [ngTemplateOutletContext]="{ $implicit: entry }"
                    />
                  </div>
                </div>
              }
            </div>
          } @empty {
            <div class="ds-empty h-full w-full flex flex-col items-center justify-center gap-4 px-6 text-center">
              <ds-icon name="image" />
              <div class="text-3xl font-bold">No display entries yet</div>
              <div class="text-lg opacity-70">
                Add a Portrait or Background to start your scene.
              </div>
              <ds-button color="green" (click)="editorOpen.set(true)">
                <span class="flex items-center gap-2">
                  <ds-icon name="plus" />
                  <span>Add Entry</span>
                </span>
              </ds-button>
            </div>
          }
        </div>
      </div>

      <ng-template #caption let-entry>
        <div class="ds-caption relative z-10 h-full flex flex-col" [class.justify-end]="entry.type === 'Background'">
          <div
            class="ds-title text-center text-4xl font-bold"
            [class.clickable]="!!entry.backLink"
            (click)="entry.backLink && openLink(entry.backLink)"
          >
            {{ entry.title }}
          </div>
          @if (entry.description) {
            <div class="text-center text-2xl mt-2 px-3">
              <div class="glass inline-block rounded-3xl p-3 overflow-auto" style="max-height: 40cqh; white-space: pre-wrap">
                @if (entry.isKanka) {
                  <span [innerHTML]="safe(entry.description)"></span>
                } @else {
                  {{ entry.description }}
                }
              </div>
            </div>
          }
        </div>
      </ng-template>
    } @else {
      <div class="h-full flex items-center justify-center">Loading...</div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .ds-carousel {
        display: flex;
        height: 100%;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
      }
      .ds-slide {
        flex: 0 0 100%;
        height: 100%;
        scroll-snap-align: start;
        padding: 0.5rem;
      }

      /* darken the page behind the open drawer */
      .ds-scrim-overlay {
        background: rgba(0, 0, 0, 0.45);
      }

      /* navigation rail polish */
      .ds-rail-row :is(button, .ds-rail-link) {
        justify-content: flex-start;
      }

      /* background scene container */
      .ds-scene {
        position: relative;
        border-radius: 1.5rem;
        overflow: hidden;
        padding-bottom: 1.5rem;
      }
      /* subtle scrim so captions stay legible over bright images */
      .ds-scene-scrim {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 0.7) 0%,
          rgba(0, 0, 0, 0.25) 35%,
          rgba(0, 0, 0, 0) 60%
        );
      }
      /* graceful image-less Background fallback (S9) */
      .ds-scene-empty {
        background:
          radial-gradient(
            120% 90% at 50% 0%,
            var(--color-dark-6) 0%,
            var(--color-dark-8) 55%,
            var(--color-dark-9) 100%
          );
        border: 1px solid var(--color-dark-5);
      }

      /* portrait monogram placeholder (S9) */
      .ds-monogram {
        height: 100%;
        aspect-ratio: 1 / 1;
        max-width: 100%;
        background:
          radial-gradient(
            120% 120% at 30% 20%,
            var(--color-dark-5) 0%,
            var(--color-dark-7) 55%,
            var(--color-dark-9) 100%
          );
        border: 1px solid var(--color-dark-5);
      }
      .ds-monogram-letter {
        font-size: 22cqh;
        line-height: 1;
        font-weight: 800;
        color: var(--color-dark-1);
        text-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
        user-select: none;
      }

      /* always-legible titles */
      .ds-title {
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85), 0 1px 2px rgba(0, 0, 0, 0.9);
      }

      /* empty state (ML7) */
      .ds-empty {
        background:
          radial-gradient(
            120% 90% at 50% 0%,
            var(--color-dark-7) 0%,
            var(--color-dark-9) 100%
          );
        border-radius: 1.5rem;
      }
    `,
  ],
})
export class DisplayPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly realtime = inject(RealtimeService);
  private readonly background = inject(BackgroundService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly id = input<string>('');
  private readonly campaignId = computed(() => Number.parseInt(this.id(), 10));

  protected readonly drawerOpen = signal(false);
  protected readonly editorOpen = signal(false);
  protected readonly editorValue = signal<DisplayEntryEditorValue | null>(null);

  private readonly slides = viewChildren<ElementRef<HTMLElement>>('slide');

  protected readonly campaign = resource({
    params: () => ({ id: this.campaignId(), rev: this.realtime.revision() }),
    loader: ({ params }) => this.api.fetchCampaign(params.id),
  });

  private readonly kanka = resource({
    params: () => ({
      kankaId: this.campaign.value()?.campaign.kankaApiId ?? null,
    }),
    loader: ({ params }) => this.fetchKanka(params.kankaId),
  });

  protected readonly items = computed<DisplayModel[]>(() => {
    const campaignEntries = this.campaign.value()?.campaign;
    const entries = this.campaign.value()?.entries ?? [];
    const local: DisplayModel[] = entries.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      pictureUrl: e.pictureUrl,
      type: e.type,
      isKanka: false,
    }));
    const remote = this.kanka.value() ?? [];
    const all = [...local, ...remote];
    all.sort((a, b) => (a.title > b.title ? 1 : -1));
    // reference to keep type-check honest
    void campaignEntries;
    return all;
  });

  constructor() {
    effect(() => {
      if (Number.isNaN(this.campaignId())) void this.router.navigate(['/campaigns']);
    });
    effect(() => this.realtime.watch(this.campaignId()));
    effect(() => this.background.apply(this.campaign.value()?.campaign));
    effect(() => {
      if (this.campaign.status() === 'error') void this.router.navigate(['/campaigns']);
    });
  }

  protected safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected initial(title: string): string {
    return (title.trim()[0] ?? '?').toUpperCase();
  }

  protected openLink(url: string): void {
    window.open(url, '_blank');
  }

  protected goCampaign(): void {
    void this.router.navigate(['/campaigns', this.campaignId()]);
  }

  protected scrollTo(index: number): void {
    const el = this.slides()[index]?.nativeElement;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
    this.drawerOpen.set(false);
  }

  protected async saveEntry(campaignId: number): Promise<void> {
    const value = this.editorValue();
    if (!value || !value.valid) return;
    let fileUrl: string | null = null;
    if (value.file) {
      const res = await this.api.uploadFile(value.file);
      fileUrl = '/files/' + res.fileName;
    }
    await this.api.createDisplayEntry({
      title: value.title,
      description: value.description,
      type: value.type,
      pictureUrl: fileUrl,
      campaign: campaignId,
    });
    this.campaign.reload();
    this.editorOpen.set(false);
  }

  protected async deleteEntry(id: number): Promise<void> {
    await this.api.deleteDisplayEntry(id);
    this.campaign.reload();
  }

  private async fetchKanka(kankaId: number | null): Promise<DisplayModel[]> {
    if (kankaId == null) return [];
    const fetchJson = async (url: string): Promise<unknown[]> => {
      const res = await fetch(url);
      const json = await res.json();
      return KankaLoose.parse(json.data);
    };
    const arrays = await Promise.all([
      fetchJson(`/kanka/campaigns/${kankaId}/characters`),
      fetchJson(`/kanka/campaigns/${kankaId}/locations`),
      fetchJson(`/kanka/campaigns/${kankaId}/creatures`),
      fetchJson(`/kanka/campaigns/${kankaId}/events`),
    ]);
    return arrays.flat().map((raw) => this.toKankaModel(raw as Record<string, unknown>));
  }

  private toKankaModel(e: Record<string, unknown>): DisplayModel {
    const transform = (s: unknown): string | null =>
      typeof s === 'string' ? s.replaceAll('\\"', '"') : null;
    const urls = e['urls'] as { view?: string } | undefined;
    return {
      id: -(e['id'] as number),
      title: String(e['name'] ?? ''),
      description:
        transform(e['entry_parsed']) ?? transform(e['entry']) ?? null,
      pictureUrl: (e['image_full'] as string | null) ?? null,
      type: 'Portrait',
      isKanka: true,
      backLink: urls?.view,
    };
  }
}

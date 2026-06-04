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
        <div class="fixed inset-0 z-[150]" (click)="drawerOpen.set(false)">
          <div
            class="glass absolute left-0 top-0 h-full w-80 p-4 overflow-y-auto border-r border-[color:var(--color-dark-4)]"
            (click)="$event.stopPropagation()"
          >
            <ds-button variant="transparent" (click)="goCampaign()">
              <span class="text-xl font-bold">{{ details.campaign.name }}</span>
            </ds-button>
            <div class="flex justify-end mb-2">
              <ds-button color="green" variant="transparent" size="xs" (click)="editorOpen.set(true)">
                <ds-icon name="plus" />
                <span class="ml-1">Add Entry</span>
              </ds-button>
            </div>
            <div class="flex flex-col gap-2">
              @for (entry of items(); track entry.id; let idx = $index) {
                <div class="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <ds-button variant="outline" fullWidth (click)="scrollTo(idx)">{{
                    entry.title
                  }}</ds-button>
                  @if (!entry.isKanka) {
                    <ds-confirmation-popover
                      title="Delete entry?"
                      message="Are you sure you want to delete this entry?"
                      (accept)="deleteEntry(entry.id)"
                    >
                      <ds-icon-btn cpTrigger color="red"
                        ><ds-icon name="trash"
                      /></ds-icon-btn>
                    </ds-confirmation-popover>
                  }
                </div>
              }
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
              @if (entry.type === 'Background' && entry.pictureUrl) {
                <div
                  class="h-full w-full bg-center bg-cover flex flex-col justify-end items-center pb-2"
                  [style.background-image]="'url(' + entry.pictureUrl + ')'"
                >
                  <ng-container
                    [ngTemplateOutlet]="caption"
                    [ngTemplateOutletContext]="{ $implicit: entry }"
                  />
                </div>
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
          }
        </div>
      </div>

      <ng-template #caption let-entry>
        <div class="h-full flex flex-col" [class.justify-end]="entry.type === 'Background'">
          <div
            class="text-center text-4xl font-bold"
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

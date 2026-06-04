import {
  ChangeDetectionStrategy,
  Component,
  inject,
  resource,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Modal } from '../../ui/modal';
import { NumberInput, TextInput } from '../../ui/inputs';
import { Skeleton } from '../../ui/skeleton';
import type { Campaign, CampaignDetails } from '@draw-steel/shared';

@Component({
  selector: 'ds-campaigns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, Modal, TextInput, NumberInput, Skeleton],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold tracking-tight">Campaigns</h1>
        <ds-button (click)="openCreate()">
          <ds-icon name="plus" [size]="16" />
          New Campaign
        </ds-button>
      </header>

      @if (campaigns.isLoading() || campaigns.value() === undefined) {
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-busy="true"
        >
          @for (n of skeletons; track n) {
            <div class="glass skel" aria-hidden="true">
              <ds-skeleton width="60%" height="1.1rem" />
              <ds-skeleton width="40%" height="0.85rem" />
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (details of campaigns.value() ?? []; track details.campaign.id) {
            <button
              type="button"
              class="glass campaign-card"
              (click)="select(details)"
            >
              <span class="campaign-name" [title]="details.campaign.name">{{
                details.campaign.name
              }}</span>
              <span class="campaign-meta">
                <span class="pill">
                  <span class="pill-dot"></span>
                  {{ details.campaign.heroTokens }} hero
                  {{ details.campaign.heroTokens === 1 ? 'token' : 'tokens' }}
                </span>
                <span class="meta-sub">
                  {{ details.characters.length }}
                  {{ details.characters.length === 1 ? 'character' : 'characters' }}
                </span>
              </span>
            </button>
          } @empty {
            <div class="empty col-span-full">
              <div class="empty-title">No campaigns yet</div>
              <p class="empty-text">
                Create your first campaign to start tracking heroes, hero tokens,
                and combats.
              </p>
              <ds-button (click)="openCreate()">
                <ds-icon name="plus" [size]="16" />
                New Campaign
              </ds-button>
            </div>
          }
        </div>
      }
    </section>

    <ds-modal
      [opened]="createOpen()"
      title="New Campaign"
      (closed)="closeCreate()"
    >
      <form class="space-y-4" (submit)="$event.preventDefault(); create()">
        <ds-text-input
          label="Name"
          placeholder="The Lost Vale"
          [autofocus]="true"
          [(value)]="draftName"
        />
        <ds-number-input
          label="Hero tokens"
          [min]="0"
          [(value)]="draftHeroTokens"
        />
        <div class="flex justify-end gap-2 pt-1">
          <ds-button
            variant="subtle"
            color="gray"
            type="button"
            [disabled]="saving()"
            (click)="closeCreate()"
          >
            Cancel
          </ds-button>
          <ds-button
            type="submit"
            [disabled]="saving() || draftName().trim().length === 0"
          >
            {{ saving() ? 'Creating…' : 'Create' }}
          </ds-button>
        </div>
      </form>
    </ds-modal>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .campaign-card {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        text-align: left;
        width: 100%;
        padding: 1.1rem 1.2rem;
        border: 1px solid var(--color-dark-4);
        border-radius: 0.85rem;
        cursor: pointer;
        color: var(--color-dark-0);
        transition:
          transform 0.14s ease,
          border-color 0.14s ease,
          box-shadow 0.14s ease;
      }
      .campaign-card:hover {
        transform: translateY(-2px);
        border-color: var(--color-dark-2);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
      }
      .campaign-card:active {
        transform: translateY(0);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
      .campaign-card:focus-visible {
        outline: 2px solid var(--color-brand-blue);
        outline-offset: 2px;
      }

      .campaign-name {
        font-size: 1.15rem;
        font-weight: 700;
        line-height: 1.25;
        color: #fff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }
      .campaign-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 0.75rem;
        font-size: 0.82rem;
        color: var(--color-dark-2);
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--color-brand-blue) 18%, transparent);
        color: var(--color-dark-0);
        font-weight: 600;
      }
      .pill-dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: var(--color-brand-blue);
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        text-align: center;
        padding: 3rem 1.5rem;
        border: 1px dashed var(--color-dark-4);
        border-radius: 0.85rem;
        color: var(--color-dark-2);
      }
      .empty-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--color-dark-0);
      }
      .empty-text {
        max-width: 28rem;
        margin: 0;
        font-size: 0.9rem;
      }

      .skel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.1rem 1.2rem;
        border: 1px solid var(--color-dark-4);
        border-radius: 0.85rem;
      }
      @media (prefers-reduced-motion: reduce) {
        .campaign-card {
          transition: none;
        }
      }
    `,
  ],
})
export class CampaignsPage {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  protected readonly campaigns = resource({
    loader: () => this.api.fetchCampaigns(),
  });

  protected readonly createOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly draftName = signal('');
  protected readonly draftHeroTokens = signal<number | null>(0);

  protected select(details: CampaignDetails): void {
    void this.router.navigate(['/campaigns', details.campaign.id]);
  }

  protected openCreate(): void {
    this.draftName.set('');
    this.draftHeroTokens.set(0);
    this.createOpen.set(true);
  }

  protected closeCreate(): void {
    if (this.saving()) return;
    this.createOpen.set(false);
  }

  protected async create(): Promise<void> {
    const name = this.draftName().trim();
    if (name.length === 0 || this.saving()) return;
    this.saving.set(true);
    try {
      const created = await firstValueFrom(
        this.http.post<Campaign>('/api/campaigns', {
          name,
          heroTokens: this.draftHeroTokens() ?? 0,
        }),
      );
      this.createOpen.set(false);
      this.campaigns.reload();
      void this.router.navigate(['/campaigns', created.id]);
    } finally {
      this.saving.set(false);
    }
  }
}

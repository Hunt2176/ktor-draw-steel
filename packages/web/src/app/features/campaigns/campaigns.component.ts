import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { faDragon } from '@fortawesome/free-solid-svg-icons';
import type { CampaignDetails } from '../../core/models';
import { CampaignStore } from '../../core/campaign-store.service';
import { CardComponent } from '../../ui/card.component';
import { EmptyStateComponent } from '../../ui/empty-state.component';
import { IconComponent } from '../../ui/icon.component';
import { SkeletonComponent } from '../../ui/skeleton.component';

/** Campaign picker — a responsive grid of clickable campaign cards. */
@Component({
  selector: 'app-campaigns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, EmptyStateComponent, IconComponent, SkeletonComponent],
  template: `
    <div class="ds-page">
      <header class="mb-6">
        <h1 class="font-display text-2xl font-bold text-m-dark-0">Campaigns</h1>
        @if (campaigns(); as list) {
          <p class="mt-1 text-sm text-m-dark-2">
            {{ list.length }} {{ list.length === 1 ? 'campaign' : 'campaigns' }}
          </p>
        }
      </header>

      @if (campaigns(); as list) {
        @if (list.length === 0) {
          <app-empty-state
            [icon]="dragon"
            title="No campaigns yet"
            message="Campaigns you create will appear here."
          />
        } @else {
          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
            @for (details of list; track details.campaign.id) {
              <app-card
                class="clickable group relative overflow-hidden transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
                role="button"
                tabindex="0"
                [attr.aria-label]="'Open campaign ' + details.campaign.name"
                (click)="select(details)"
                (keydown.enter)="select(details)"
                (keydown.space)="select(details); $event.preventDefault()"
              >
                @if (thumbnail(details); as src) {
                  <img
                    [src]="src"
                    alt=""
                    class="mb-3 h-28 w-full rounded-md object-cover"
                    (error)="onImageError(details.campaign.id)"
                  />
                } @else {
                  <div
                    class="mb-3 flex h-28 w-full items-center justify-center rounded-md bg-gradient-to-br from-m-dark-5 to-m-dark-7 text-m-dark-3"
                    aria-hidden="true"
                  >
                    <app-icon [name]="dragon" class="text-2xl opacity-60" />
                  </div>
                }
                <h2 class="font-display text-lg font-bold text-m-dark-0">{{ details.campaign.name }}</h2>
                <p class="mt-1 text-sm text-m-dark-2">
                  Hero Tokens: <span class="text-ds-accent font-semibold">{{ details.campaign.heroTokens }}</span>
                </p>
              </app-card>
            }
          </div>
        }
      } @else {
        <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
          @for (placeholder of skeletons; track placeholder) {
            <app-card>
              <app-skeleton height="7rem" />
              <app-skeleton class="mt-3 block" width="60%" height="1.25rem" />
              <app-skeleton class="mt-2 block" width="40%" height="0.9rem" />
            </app-card>
          }
        </div>
      }
    </div>
  `,
})
export class CampaignsComponent {
  private readonly store = inject(CampaignStore);
  private readonly router = inject(Router);
  protected readonly campaigns = this.store.campaignList();
  protected readonly dragon = faDragon;
  /** Fixed-count placeholder list driving the loading skeleton grid. */
  protected readonly skeletons = Array.from({ length: 6 }, (_, i) => i);
  /** Campaign ids whose background image failed to load (fall back to placeholder). */
  private readonly brokenImages = signal<ReadonlySet<number>>(new Set());

  /**
   * Returns a usable thumbnail URL for a campaign, or null to render the branded
   * placeholder instead. `background` is semantically an image URL (e.g.
   * `/files/foo.png`), but legacy/seed data sometimes stores prose there — so we
   * only treat values that actually look like an image source as a thumbnail, and
   * additionally drop any source that has failed to load at runtime.
   */
  protected thumbnail(details: CampaignDetails): string | null {
    const background = details.campaign.background;
    if (!background || this.brokenImages().has(details.campaign.id)) return null;
    return this.isImageSrc(background) ? background : null;
  }

  /** Heuristic: an absolute URL, root-relative path, data URI, or image-extension path. */
  private isImageSrc(value: string): boolean {
    return /^(https?:\/\/|\/|data:image\/)/.test(value) || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(value);
  }

  /** Marks a campaign's background as broken so the placeholder renders instead. */
  protected onImageError(id: number): void {
    this.brokenImages.update((set) => new Set(set).add(id));
  }

  select(details: CampaignDetails): void {
    void this.router.navigate(['/campaigns', details.campaign.id]);
  }
}

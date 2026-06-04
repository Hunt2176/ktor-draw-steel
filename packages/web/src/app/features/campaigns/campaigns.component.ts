import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { faDragon } from '@fortawesome/free-solid-svg-icons';
import type { CampaignDetails } from '../../core/models';
import { CampaignStore } from '../../core/campaign-store.service';
import { CardComponent } from '../../ui/card.component';
import { EmptyStateComponent } from '../../ui/empty-state.component';
import { SkeletonComponent } from '../../ui/skeleton.component';

/** Campaign picker — a responsive grid of clickable campaign cards. */
@Component({
  selector: 'app-campaigns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, EmptyStateComponent, SkeletonComponent],
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
                @if (details.campaign.background) {
                  <img
                    [src]="details.campaign.background"
                    alt=""
                    class="mb-3 h-28 w-full rounded-md object-cover"
                  />
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

  select(details: CampaignDetails): void {
    void this.router.navigate(['/campaigns', details.campaign.id]);
  }
}

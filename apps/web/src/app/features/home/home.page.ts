import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'ds-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="ds-hero">
      <div class="ds-hero__glyph-wrap glass">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 8h13a3 3 0 0 1-3 3H9l-1 3" />
          <path d="M17 8l3 1.5" />
          <path d="M6 17h8" />
          <path d="M8 14l-2 3" />
          <path d="M12 14v3" />
        </svg>
      </div>

      <h1 class="ds-hero__title">
        Draw<span class="ds-hero__accent">Steel</span>
      </h1>

      <p class="ds-hero__tagline">
        Campaign &amp; combat manager for the Draw Steel TTRPG.
      </p>

      <a routerLink="/campaigns" class="ds-hero__cta">
        Enter the Forge
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </section>

    <section class="ds-quick" aria-label="Your campaigns">
      @if (campaigns.isLoading()) {
        <div class="ds-quick__head">
          <h2 class="ds-quick__title">Your campaigns</h2>
        </div>
        <div class="ds-quick__grid" aria-busy="true">
          @for (n of placeholders; track n) {
            <div class="ds-quick__chip ds-quick__chip--skel" aria-hidden="true">
              <span class="ds-quick__skel-line"></span>
            </div>
          }
        </div>
      } @else if (visibleCampaigns().length > 0) {
        <div class="ds-quick__head">
          <h2 class="ds-quick__title">Your campaigns</h2>
          <a routerLink="/campaigns" class="ds-quick__all">
            All campaigns
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
        <div class="ds-quick__grid">
          @for (details of visibleCampaigns(); track details.campaign.id) {
            <a
              [routerLink]="['/campaigns', details.campaign.id]"
              class="glass ds-quick__chip"
            >
              <span class="ds-quick__dot" aria-hidden="true"></span>
              <span
                class="ds-quick__name"
                [title]="details.campaign.name"
                >{{ details.campaign.name }}</span
              >
            </a>
          }
        </div>
      } @else if (!campaigns.error()) {
        <div class="ds-quick__head">
          <h2 class="ds-quick__title">Your campaigns</h2>
        </div>
        <a routerLink="/campaigns" class="glass ds-quick__empty">
          <span class="ds-quick__empty-title">No campaigns yet</span>
          <span class="ds-quick__empty-text">Create one to get started.</span>
        </a>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ds-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.25rem;
        padding: 4rem 0 5rem;
      }
      @media (min-width: 640px) {
        .ds-hero {
          padding: 6rem 0 7rem;
        }
      }
      .ds-hero__glyph-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 1rem;
        color: var(--color-brand-blue);
        border: 1px solid var(--color-dark-4);
      }
      .ds-hero__title {
        margin: 0;
        font-size: clamp(2.75rem, 8vw, 4.5rem);
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1;
        color: var(--color-dark-0);
      }
      .ds-hero__accent {
        color: var(--color-brand-blue);
      }
      .ds-hero__tagline {
        margin: 0;
        max-width: 34rem;
        font-size: clamp(1rem, 2.5vw, 1.2rem);
        color: var(--color-dark-0);
        opacity: 0.72;
        line-height: 1.5;
      }
      .ds-hero__cta {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding: 0.7rem 1.5rem;
        border-radius: 0.6rem;
        background: var(--color-brand-blue);
        color: #fff;
        font-weight: 600;
        font-size: 1rem;
        text-decoration: none;
        transition:
          background 0.12s,
          transform 0.12s;
      }
      .ds-hero__cta:hover {
        background: color-mix(in srgb, var(--color-brand-blue) 85%, #000);
        transform: translateY(-1px);
      }

      .ds-quick {
        margin: 0 auto;
        max-width: 48rem;
        padding-bottom: 4rem;
      }
      .ds-quick__head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .ds-quick__title {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-dark-2);
      }
      .ds-quick__all {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;
        color: var(--color-brand-blue);
        transition: color 0.12s;
      }
      .ds-quick__all:hover {
        color: color-mix(in srgb, var(--color-brand-blue) 80%, #fff);
      }
      .ds-quick__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.65rem;
      }
      @media (min-width: 480px) {
        .ds-quick__grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 720px) {
        .ds-quick__grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      .ds-quick__chip {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.75rem 0.95rem;
        border-radius: 0.7rem;
        border: 1px solid var(--color-dark-4);
        color: var(--color-dark-0);
        text-decoration: none;
        transition:
          transform 0.14s ease,
          border-color 0.14s ease,
          box-shadow 0.14s ease;
      }
      .ds-quick__chip:hover {
        transform: translateY(-2px);
        border-color: var(--color-dark-2);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
      }
      .ds-quick__chip:focus-visible {
        outline: 2px solid var(--color-brand-blue);
        outline-offset: 2px;
      }
      .ds-quick__dot {
        flex: none;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: var(--color-brand-blue);
      }
      .ds-quick__name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
        font-size: 0.95rem;
      }

      .ds-quick__chip--skel {
        pointer-events: none;
      }
      .ds-quick__skel-line {
        width: 70%;
        height: 0.85rem;
        border-radius: 0.4rem;
        background: linear-gradient(
          90deg,
          var(--color-dark-5) 25%,
          var(--color-dark-4) 37%,
          var(--color-dark-5) 63%
        );
        background-size: 400% 100%;
        animation: ds-quick-shimmer 1.4s ease infinite;
      }
      @keyframes ds-quick-shimmer {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      .ds-quick__empty {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 1.1rem 1.25rem;
        border-radius: 0.7rem;
        border: 1px dashed var(--color-dark-4);
        text-decoration: none;
        transition:
          border-color 0.14s ease,
          transform 0.14s ease;
      }
      .ds-quick__empty:hover {
        transform: translateY(-2px);
        border-color: var(--color-dark-2);
      }
      .ds-quick__empty:focus-visible {
        outline: 2px solid var(--color-brand-blue);
        outline-offset: 2px;
      }
      .ds-quick__empty-title {
        font-weight: 700;
        color: var(--color-dark-0);
      }
      .ds-quick__empty-text {
        font-size: 0.85rem;
        color: var(--color-dark-2);
      }

      @media (prefers-reduced-motion: reduce) {
        .ds-hero__cta,
        .ds-quick__chip,
        .ds-quick__empty,
        .ds-quick__all {
          transition: none;
        }
        .ds-quick__chip:hover,
        .ds-quick__empty:hover,
        .ds-hero__cta:hover {
          transform: none;
        }
        .ds-quick__skel-line {
          animation: none;
        }
      }
    `,
  ],
})
export class HomePage {
  private readonly api = inject(ApiService);

  protected readonly placeholders = [0, 1, 2];

  protected readonly campaigns = resource({
    loader: () => this.api.fetchCampaigns(),
  });

  protected readonly visibleCampaigns = computed(() =>
    (this.campaigns.value() ?? []).slice(0, 6),
  );
}

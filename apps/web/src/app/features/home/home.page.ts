import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  `,
  styles: [
    `
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
    `,
  ],
})
export class HomePage {}

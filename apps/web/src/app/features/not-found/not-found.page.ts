import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ds-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="ds-nf">
      <p class="ds-nf__code glass">404</p>

      <h1 class="ds-nf__title">Page not found</h1>

      <p class="ds-nf__message">
        We couldn't find the page you were looking for. It may have been moved,
        renamed, or never existed in this realm.
      </p>

      <div class="ds-nf__actions">
        <a routerLink="/" class="ds-nf__cta">
          Back to Home
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

        <a routerLink="/campaigns" class="ds-nf__link">Browse campaigns</a>
      </div>
    </section>
  `,
  styles: [
    `
      .ds-nf {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.25rem;
        padding: 4rem 0 5rem;
      }
      @media (min-width: 640px) {
        .ds-nf {
          padding: 6rem 0 7rem;
        }
      }
      .ds-nf__code {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0.5rem 1.5rem;
        border-radius: 1rem;
        border: 1px solid var(--color-dark-4);
        font-size: clamp(3.5rem, 12vw, 6rem);
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.04em;
        color: var(--color-brand-blue);
      }
      .ds-nf__title {
        margin: 0;
        font-size: clamp(1.75rem, 5vw, 2.5rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.1;
        color: var(--color-dark-0);
      }
      .ds-nf__message {
        margin: 0;
        max-width: 34rem;
        font-size: clamp(1rem, 2.5vw, 1.15rem);
        color: var(--color-dark-0);
        opacity: 0.72;
        line-height: 1.5;
      }
      .ds-nf__actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 0.75rem;
      }
      .ds-nf__cta {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
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
      .ds-nf__cta:hover {
        background: color-mix(in srgb, var(--color-brand-blue) 85%, #000);
        transform: translateY(-1px);
      }
      .ds-nf__link {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--color-dark-0);
        opacity: 0.72;
        text-decoration: none;
        transition: opacity 0.12s;
      }
      .ds-nf__link:hover {
        opacity: 1;
        text-decoration: underline;
      }
    `,
  ],
})
export class NotFoundPage {}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Global application shell: sticky frosted-glass header with the Draw Steel
 * wordmark + primary nav, and a centered content container that projects the
 * routed page via `<ng-content />`.
 */
@Component({
  selector: 'ds-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="ds-header glass">
      <div class="ds-header__inner">
        <a routerLink="/" class="ds-wordmark" aria-label="Draw Steel home">
          <svg
            class="ds-wordmark__glyph"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <!-- stylized anvil -->
            <path d="M4 8h13a3 3 0 0 1-3 3H9l-1 3" />
            <path d="M17 8l3 1.5" />
            <path d="M6 17h8" />
            <path d="M8 14l-2 3" />
            <path d="M12 14v3" />
          </svg>
          <span class="ds-wordmark__text">
            Draw<span class="ds-wordmark__accent">Steel</span>
          </span>
        </a>

        <nav class="ds-nav" aria-label="Primary">
          <a
            routerLink="/"
            routerLinkActive="ds-nav__link--active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="ds-nav__link"
            >Home</a
          >
          <a
            routerLink="/campaigns"
            routerLinkActive="ds-nav__link--active"
            class="ds-nav__link"
            >Campaigns</a
          >
        </nav>
      </div>
    </header>

    <main class="ds-main">
      <div class="ds-container">
        <ng-content />
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ds-header {
        position: sticky;
        top: 0;
        z-index: 50;
        height: 56px;
        border-bottom: 1px solid var(--color-dark-4);
      }
      .ds-header__inner {
        height: 100%;
        max-width: 80rem;
        margin: 0 auto;
        padding: 0 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      @media (min-width: 640px) {
        .ds-header__inner {
          padding: 0 1.5rem;
        }
      }
      .ds-wordmark {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-dark-0);
        text-decoration: none;
        font-weight: 700;
        font-size: 1.15rem;
        letter-spacing: -0.02em;
        line-height: 1;
      }
      .ds-wordmark__glyph {
        color: var(--color-brand-blue);
        flex: none;
      }
      .ds-wordmark__text {
        white-space: nowrap;
      }
      .ds-wordmark__accent {
        color: var(--color-brand-blue);
      }
      .ds-nav {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      .ds-nav__link {
        position: relative;
        display: inline-flex;
        align-items: center;
        padding: 0.4rem 0.7rem;
        border-radius: 0.4rem;
        color: var(--color-dark-0);
        text-decoration: none;
        font-size: 0.92rem;
        font-weight: 500;
        opacity: 0.78;
        transition:
          opacity 0.12s,
          color 0.12s,
          background 0.12s;
      }
      .ds-nav__link:hover {
        opacity: 1;
        background: color-mix(in srgb, var(--color-dark-0) 8%, transparent);
      }
      .ds-nav__link--active {
        opacity: 1;
        color: var(--color-brand-blue);
      }
      .ds-nav__link--active::after {
        content: '';
        position: absolute;
        left: 0.7rem;
        right: 0.7rem;
        bottom: 0.05rem;
        height: 2px;
        border-radius: 2px;
        background: var(--color-brand-blue);
      }
      .ds-container {
        max-width: 80rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
      }
      @media (min-width: 640px) {
        .ds-container {
          padding: 1.5rem 1.5rem;
        }
      }
    `,
  ],
})
export class AppShell {}

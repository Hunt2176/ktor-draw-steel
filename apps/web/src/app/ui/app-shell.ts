import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';

type ShellMode = 'default' | 'bare' | 'wide';

/**
 * Global application shell: sticky frosted-glass header with the Draw Steel
 * wordmark + primary nav, and a centered content container that projects the
 * routed page via `<ng-content />`.
 *
 * The chrome adapts to the active route's `data.shell`:
 *  - `'bare'`  -> no header, full-viewport wrapper (fullscreen routes, e.g. display)
 *  - `'wide'`  -> header + full-width padded container (wide tactical views, e.g. combat)
 *  - default   -> header + centered max-width(80rem) padded container
 */
@Component({
  selector: 'ds-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (shellMode() !== 'bare') {
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
    }

    <!--
      A SINGLE <ng-content/> is used for every mode. Duplicating <ng-content>
      across @if branches misroutes the projected router-outlet (Angular only
      distributes projected content to one slot), which previously left bare
      (fullscreen) routes blank. The chrome is toggled around this one slot.
    -->
    <main class="ds-main" [class.ds-main--bare]="shellMode() === 'bare'">
      <div
        class="ds-container"
        [class.ds-container--wide]="shellMode() === 'wide'"
        [class.ds-container--bare]="shellMode() === 'bare'"
      >
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
        gap: 0.5rem;
        min-width: 0;
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
        min-width: 0;
        color: var(--color-dark-0);
        text-decoration: none;
        font-weight: 700;
        font-size: 1.15rem;
        letter-spacing: -0.02em;
        line-height: 1;
        transition: color 0.12s ease;
      }
      .ds-wordmark:hover {
        color: color-mix(in srgb, var(--color-brand-blue) 35%, var(--color-dark-0));
      }
      .ds-wordmark__glyph {
        color: var(--color-brand-blue);
        flex: none;
        transition: color 0.12s ease;
      }
      .ds-wordmark:hover .ds-wordmark__glyph {
        color: color-mix(in srgb, var(--color-brand-blue) 80%, white);
      }
      .ds-wordmark__text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ds-wordmark__accent {
        color: var(--color-brand-blue);
      }
      .ds-nav {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex: none;
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
        white-space: nowrap;
        opacity: 0.78;
        transition:
          opacity 0.12s ease,
          color 0.12s ease,
          background 0.12s ease;
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
      .ds-container--wide {
        max-width: none;
      }
      @media (min-width: 640px) {
        .ds-container:not(.ds-container--bare) {
          padding: 1.5rem 1.5rem;
        }
      }
      /* Bare (fullscreen) routes: no chrome, fill the viewport so child
         h-full / h-screen layouts (e.g. the display carousel) resolve. */
      .ds-main--bare {
        height: 100vh;
      }
      .ds-container--bare {
        max-width: none;
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Chrome mode derived from the deepest activated route's `data.shell`. */
  protected readonly shellMode = signal<ShellMode>(
    this.resolveShellMode(this.router.routerState.snapshot.root),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.shellMode.set(
          this.resolveShellMode(this.router.routerState.snapshot.root),
        );
      });
  }

  /** Walk the `.firstChild` chain to find the deepest declared `data.shell`. */
  private resolveShellMode(root: ActivatedRouteSnapshot): ShellMode {
    let node: ActivatedRouteSnapshot | null = root;
    let mode: ShellMode = 'default';
    while (node) {
      const shell = node.data['shell'];
      if (shell === 'bare' || shell === 'wide' || shell === 'default') {
        mode = shell;
      }
      node = node.firstChild;
    }
    return mode;
  }
}

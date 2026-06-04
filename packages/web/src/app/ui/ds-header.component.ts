import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Persistent global top bar: the "Draw Steel" wordmark lockup (left) and the
 * primary "Campaigns" nav link. Glassmorphic, slim, hidden on fullscreen routes
 * by the root shell.
 */
@Component({
  selector: 'ds-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="glass sticky top-0 z-50 border-b border-white/10">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a
          routerLink="/"
          class="font-display text-xl tracking-wide text-ds-accent transition-colors hover:text-ds-ember"
        >
          Draw Steel
        </a>
        <nav class="flex items-center gap-6 text-sm">
          <a
            routerLink="/campaigns"
            routerLinkActive="text-ds-accent"
            class="text-m-dark-1 transition-colors hover:text-ds-accent"
          >
            Campaigns
          </a>
        </nav>
      </div>
    </header>
  `,
})
export class DsHeaderComponent {}

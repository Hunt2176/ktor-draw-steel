import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WatchService, type WatchStatus } from '../core/watch.service';

/** Presentation metadata for a given connection status. */
interface StatusView {
  readonly label: string;
  readonly textClass: string;
  readonly title: string;
  readonly pulse: boolean;
}

/**
 * Persistent global top bar: the "Draw Steel" wordmark lockup (left) and the
 * primary "Campaigns" nav link. Glassmorphic, slim, hidden on fullscreen routes
 * by the root shell.
 *
 * Also surfaces the live WebSocket connection status (a coloured dot + short
 * label) derived from `WatchService.status`. The indicator is hidden entirely
 * when status is 'idle' (the user is not on a watched screen).
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
          @if (view(); as v) {
            <span
              class="flex items-center gap-2 text-xs font-medium"
              [class]="v.textClass"
              [title]="v.title"
              role="status"
              aria-live="polite"
            >
              <span
                class="conn-dot inline-block size-2 rounded-full bg-current"
                [class.conn-dot--pulse]="v.pulse"
                aria-hidden="true"
              ></span>
              {{ v.label }}
            </span>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [
    `
      .conn-dot--pulse {
        animation: conn-pulse 1.8s ease-in-out infinite;
      }

      @keyframes conn-pulse {
        0%,
        100% {
          opacity: 1;
          box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 60%, transparent);
        }
        50% {
          opacity: 0.55;
          box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 0%, transparent);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .conn-dot--pulse {
          animation: none;
        }
      }
    `,
  ],
})
export class DsHeaderComponent {
  private readonly watch = inject(WatchService);

  /** Presentation for the current status, or null when idle (hide indicator). */
  readonly view = computed<StatusView | null>(() => DsHeaderComponent.VIEWS[this.watch.status()]);

  /** Static status → presentation lookup; 'idle' maps to null to hide the chip. */
  private static readonly VIEWS: Record<WatchStatus, StatusView | null> = {
    idle: null,
    live: {
      label: 'Live',
      textClass: 'text-m-green',
      title: 'Connected — receiving live campaign updates.',
      pulse: true,
    },
    connecting: {
      label: 'Connecting…',
      textClass: 'text-ds-accent',
      title: 'Connecting to the live campaign feed…',
      pulse: false,
    },
    reconnecting: {
      label: 'Reconnecting…',
      textClass: 'text-m-orange',
      title: 'Connection lost — attempting to reconnect.',
      pulse: false,
    },
    offline: {
      label: 'Offline',
      textClass: 'text-m-red',
      title: 'Offline — live updates are unavailable.',
      pulse: false,
    },
  };
}

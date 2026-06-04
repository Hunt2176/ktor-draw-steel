import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** 404 page — an on-theme "Lost in the Wilds" screen with a route back to safety. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section
      class="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16"
      style="
        background:
          radial-gradient(120% 90% at 50% -10%, rgba(107, 163, 214, 0.12), transparent 60%),
          radial-gradient(90% 70% at 50% 110%, rgba(232, 137, 59, 0.07), transparent 55%),
          linear-gradient(180deg, var(--color-m-dark-8), var(--color-m-dark-7));
      "
    >
      <div class="ds-page flex max-w-2xl flex-col items-center text-center">
        <p class="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-ds-ember">
          <i class="fa-solid fa-compass" aria-hidden="true"></i>
          Off the Map
        </p>
        <h1
          class="font-display text-display font-bold tracking-wide text-m-dark-0"
          style="text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);"
        >
          404
        </h1>
        <h2 class="font-display mt-2 text-h2 font-semibold tracking-wide text-ds-accent">
          Lost in the Wilds
        </h2>
        <p class="mt-5 max-w-md text-lg leading-relaxed text-m-dark-1">
          The path you sought has crumbled to ruin. No campaign, hero, or combat
          waits beyond this point.
        </p>
        <div class="mt-9">
          <a
            class="ds-btn ds-btn--lg"
            style="--btn-bg: var(--color-ds-ember); --btn-bg-hover: #f29a52;"
            routerLink="/campaigns"
          >
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Back to Campaigns
          </a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}

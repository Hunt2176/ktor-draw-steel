import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Landing page — heroic forged-steel hero with a wordmark, tagline, and CTA. */
@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section
      class="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16"
      style="
        background:
          radial-gradient(120% 90% at 50% -10%, rgba(107, 163, 214, 0.14), transparent 60%),
          radial-gradient(90% 70% at 50% 110%, rgba(232, 137, 59, 0.08), transparent 55%),
          linear-gradient(180deg, var(--color-m-dark-8), var(--color-m-dark-7));
      "
    >
      <div class="ds-page flex max-w-3xl flex-col items-center text-center">
        <p
          class="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ds-accent sm:mb-4 sm:text-xs sm:tracking-[0.35em]"
        >
          Heroic Fantasy Roleplaying
        </p>
        <h1
          class="font-display text-4xl font-bold tracking-wide text-m-dark-0 sm:text-5xl lg:text-display"
          style="text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);"
        >
          Draw Steel
        </h1>
        <p class="mt-4 max-w-md text-base leading-relaxed text-m-dark-1 sm:mt-5 sm:max-w-xl sm:text-lg">
          Forge your campaigns, marshal your heroes, and command the table.
        </p>
        <div class="mt-8 sm:mt-10">
          <a
            class="ds-btn ds-btn--lg"
            style="--btn-bg: var(--color-ds-ember); --btn-bg-hover: #f29a52;"
            routerLink="/campaigns"
          >
            Enter the Campaigns
          </a>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent {}

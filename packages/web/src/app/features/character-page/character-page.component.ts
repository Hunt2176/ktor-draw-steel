import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { faArrowLeft, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { CampaignStore } from '../../core/campaign-store.service';
import { WatchService } from '../../core/watch.service';
import { ActionIconComponent } from '../../ui/action-icon.component';
import { IconComponent } from '../../ui/icon.component';
import { CharacterCardComponent } from '../components/character-card.component';

/** Single-character view: a centered full card with back-nav and an edit action. */
@Component({
  selector: 'app-character-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActionIconComponent, IconComponent, CharacterCardComponent],
  template: `
    @if (character(); as char) {
      <div class="ds-page flex flex-col items-center">
        <!-- Page header: back-to-campaign control + optional offstage context -->
        <div class="mb-6 flex w-full max-w-md items-center gap-3">
          @if (char.campaign != null) {
            <app-action-icon
              size="lg"
              variant="outline"
              aria-label="Back to campaign"
              (clicked)="backToCampaign(char.campaign)"
            >
              <app-icon [name]="back" />
            </app-action-icon>
          }
          <span class="font-display text-lg text-m-dark-1">Character</span>
          @if (char.offstage) {
            <span
              class="ml-auto rounded-full border border-ds-ember/40 bg-ds-ember/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-ds-ember"
            >
              Offstage
            </span>
          }
        </div>

        <!-- Centered card with presence -->
        <div class="rounded-lg shadow-ds-2 shadow-ds-glow">
          <app-character-card #card [character]="char" type="full">
            <div cardBottom>
              <hr class="ds-divider" />
              <div class="flex justify-end">
                <app-action-icon size="lg" (clicked)="card.openEditor()">
                  <app-icon [name]="pencil" />
                </app-action-icon>
              </div>
            </div>
          </app-character-card>
        </div>
      </div>
    }
  `,
})
export class CharacterPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(CampaignStore);
  private readonly watcher = inject(WatchService);
  protected readonly pencil = faPencilAlt;
  protected readonly back = faArrowLeft;

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly id = computed(() => Number.parseInt(this.params().get('id') ?? '', 10));

  protected readonly character = computed(() => {
    const id = this.id();
    if (Number.isNaN(id)) return undefined;
    return this.store.character(id)();
  });

  protected backToCampaign(campaign: number | null | undefined): void {
    if (campaign == null) return;
    void this.router.navigate(['/campaigns', campaign]);
  }

  constructor() {
    if (Number.isNaN(this.id())) {
      void this.router.navigate(['/']);
    }
    effect(() => {
      const campaign = this.character()?.campaign;
      if (campaign != null) this.watcher.watch(campaign);
    });
  }
}

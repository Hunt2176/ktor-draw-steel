import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { CampaignStore } from '../../core/campaign-store.service';
import { WatchService } from '../../core/watch.service';
import { ActionIconComponent } from '../../ui/action-icon.component';
import { IconComponent } from '../../ui/icon.component';
import { CharacterCardComponent } from '../components/character-card.component';

/** Single-character view: a full card with an edit action. */
@Component({
  selector: 'app-character-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActionIconComponent, IconComponent, CharacterCardComponent],
  template: `
    @if (character(); as char) {
      <div class="p-4">
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
    }
  `,
})
export class CharacterPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(CampaignStore);
  private readonly watcher = inject(WatchService);
  protected readonly pencil = faPencilAlt;

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly id = computed(() => Number.parseInt(this.params().get('id') ?? '', 10));

  protected readonly character = computed(() => {
    const id = this.id();
    if (Number.isNaN(id)) return undefined;
    return this.store.character(id)();
  });

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

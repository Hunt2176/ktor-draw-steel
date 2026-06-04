import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { RealtimeService } from '../../core/realtime.service';
import { CharacterCard } from '../shared/character-card';
import { IconButton } from '../../ui/icon-button';
import { Icon } from '../../ui/icon';

@Component({
  selector: 'ds-character-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RealtimeService],
  imports: [CharacterCard, IconButton, Icon],
  template: `
    @if (character.value(); as character) {
      <div class="p-4">
        <ds-character-card #card type="full" [character]="character">
          <div cardBottom class="flex justify-end">
            <ds-icon-btn size="lg" (click)="card.openEditor()">
              <ds-icon name="pencil" />
            </ds-icon-btn>
          </div>
        </ds-character-card>
      </div>
    }
  `,
})
export class CharacterPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly realtime = inject(RealtimeService);

  readonly id = input<string>('');
  private readonly charId = computed(() => Number.parseInt(this.id(), 10));

  protected readonly character = resource({
    params: () => ({ id: this.charId(), rev: this.realtime.revision() }),
    loader: ({ params }) => this.api.fetchCharacter(params.id),
  });

  constructor() {
    effect(() => {
      if (Number.isNaN(this.charId())) {
        void this.router.navigate(['/']);
      }
    });
    effect(() => {
      const c = this.character.value();
      if (c) this.realtime.watch(c.campaign);
    });
  }
}

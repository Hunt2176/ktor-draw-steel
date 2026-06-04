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
import { CharacterConditions } from '../shared/character-conditions';
import { InventoryList } from '../shared/inventory-list';
import { Icon } from '../../ui/icon';
import { Button } from '../../ui/button';

@Component({
  selector: 'ds-character-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RealtimeService],
  imports: [CharacterCard, CharacterConditions, InventoryList, Icon, Button],
  template: `
    @if (character.value(); as character) {
      <section class="mx-auto max-w-[64rem] py-6 space-y-6">
        <header class="flex items-center justify-between gap-4">
          <h1 class="text-2xl font-bold tracking-tight">{{ character.name }}</h1>
          <ds-button variant="light" (click)="card.openEditor()">
            <ds-icon name="pencil" />
            <span class="ml-2">Edit</span>
          </ds-button>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6 items-start">
          <div class="flex justify-center lg:justify-start">
            <ds-character-card #card type="full" [character]="character" />
          </div>

          <div class="space-y-6 min-w-0">
            <div class="ds-panel">
              <div class="ds-panel-head">
                <h2 class="ds-panel-title">Conditions</h2>
                <ds-character-conditions [character]="character" mode="button" />
              </div>
              <ds-character-conditions [character]="character" mode="list" />
            </div>

            <div class="ds-panel">
              <div class="ds-panel-head">
                <h2 class="ds-panel-title">Inventory</h2>
              </div>
              <ds-inventory-list
                [characterId]="character.id"
                [items]="character.inventory"
              />
            </div>
          </div>
        </div>
      </section>
    } @else {
      <div
        class="flex items-center justify-center py-24 gap-3 text-[color:var(--color-dark-2)]"
      >
        <span class="ds-spinner" aria-hidden="true"></span>
        <span>Loading character…</span>
      </div>
    }
  `,
  styles: `
    .ds-panel {
      border: 1px solid var(--color-dark-4);
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      background: var(--surface-glass-bg);
    }
    .ds-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .ds-panel-title {
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .ds-spinner {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 9999px;
      border: 2px solid var(--color-dark-4);
      border-top-color: var(--color-brand-blue);
      animation: ds-spin 0.8s linear infinite;
    }
    @keyframes ds-spin {
      to {
        transform: rotate(360deg);
      }
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
      const raw = this.id();
      if (raw !== '' && raw != null && Number.isNaN(this.charId())) {
        void this.router.navigate(['/']);
      }
    });
    effect(() => {
      const c = this.character.value();
      if (c) this.realtime.watch(c.campaign);
    });
  }
}

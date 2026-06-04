import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '../../ui/button';
import { Checkbox, TextInput } from '../../ui/inputs';
import type { Character } from '@draw-steel/shared';

export type CharacterSelection = Record<number, boolean>;

@Component({
  selector: 'ds-character-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Checkbox, TextInput],
  template: `
    <div class="flex flex-col gap-3">
      <ds-text-input
        [(value)]="query"
        placeholder="Search characters…"
      />

      <div class="cs-toolbar">
        <ds-button (click)="toggleAll()">
          {{ allVisibleSelected() ? 'Select None' : 'Select All' }}
        </ds-button>
        <span class="cs-count">{{ selectedCount() }} of {{ totalCount() }} selected</span>
      </div>

      <div class="flex flex-col gap-1">
        @for (c of visible(); track c.id) {
          <div
            class="cs-row"
            [class.cs-row--offstage]="c.offstage"
            [class.cs-row--checked]="selection()[c.id] ?? false"
          >
            <ds-checkbox
              [label]="c.name"
              [checked]="selection()[c.id] ?? false"
              (checkedChange)="update(c.id, $event)"
            />
            @if (c.offstage) {
              <span class="cs-tag">offstage</span>
            }
          </div>
        } @empty {
          <p class="cs-empty">
            {{ characters().length === 0 ? 'No characters' : 'No matches' }}
          </p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .cs-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .cs-count {
        font-size: 0.85rem;
        color: var(--color-dark-2);
      }
      .cs-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.4rem 0.6rem;
        border-radius: 6px;
        border: 1px solid transparent;
        transition:
          background 0.12s ease,
          border-color 0.12s ease;
      }
      .cs-row:hover {
        background: var(--color-dark-6);
      }
      .cs-row--checked {
        background: color-mix(in srgb, var(--color-brand-blue) 16%, transparent);
        border-color: color-mix(in srgb, var(--color-brand-blue) 45%, transparent);
      }
      .cs-row--checked:hover {
        background: color-mix(in srgb, var(--color-brand-blue) 24%, transparent);
      }
      .cs-row--offstage {
        opacity: 0.6;
      }
      .cs-tag {
        flex: none;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-dark-2);
        border: 1px solid var(--color-dark-4);
        border-radius: 999px;
        padding: 0.05rem 0.45rem;
      }
      .cs-empty {
        text-align: center;
        color: var(--color-dark-2);
        font-style: italic;
        padding: 1rem 0;
      }
    `,
  ],
})
export class CharacterSelector {
  readonly characters = input<Character[]>([]);
  readonly selected = input<CharacterSelection>({});
  readonly selectionChange = output<CharacterSelection>();

  protected readonly selection = signal<CharacterSelection>({});
  protected readonly query = signal<string>('');

  protected readonly sorted = computed(() =>
    [...this.characters()].sort((a, b) => {
      if (a.offstage !== b.offstage) return a.offstage ? 1 : -1;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    }),
  );

  /** The sorted list narrowed by the case-insensitive name query. */
  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.sorted();
    return this.sorted().filter((c) => c.name.toLowerCase().includes(q));
  });

  protected readonly totalCount = computed(() => this.characters().length);

  protected readonly selectedCount = computed(() => {
    const sel = this.selection();
    return this.characters().reduce((n, c) => (sel[c.id] ? n + 1 : n), 0);
  });

  /** True when every currently-visible character is selected (and any exist). */
  protected readonly allVisibleSelected = computed(() => {
    const vis = this.visible();
    if (vis.length === 0) return false;
    const sel = this.selection();
    return vis.every((c) => sel[c.id]);
  });

  constructor() {
    effect(() => this.selection.set({ ...this.selected() }));
  }

  /**
   * Smart toggle scoped to the currently-visible (filtered) set: selects all
   * visible characters, or clears them if all are already selected. Selections
   * of filtered-out characters are left untouched. Always emits the full map.
   */
  protected toggleAll(): void {
    const target = !this.allVisibleSelected();
    const next = { ...this.selection() };
    for (const c of this.visible()) next[c.id] = target;
    this.selection.set(next);
    this.selectionChange.emit(next);
  }

  protected update(id: number, value: boolean): void {
    const next = { ...this.selection(), [id]: value };
    this.selection.set(next);
    this.selectionChange.emit(next);
  }
}

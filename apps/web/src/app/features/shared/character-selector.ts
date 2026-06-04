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
import { Checkbox } from '../../ui/inputs';
import type { Character } from '@draw-steel/shared';

export type CharacterSelection = Record<number, boolean>;

@Component({
  selector: 'ds-character-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Checkbox],
  template: `
    <div class="flex flex-col gap-2">
      <ds-button (click)="selectAll()">Select All</ds-button>
      @for (c of sorted(); track c.id) {
        <ds-checkbox
          [label]="c.name"
          [checked]="selection()[c.id] ?? false"
          (checkedChange)="update(c.id, $event)"
        />
      }
    </div>
  `,
})
export class CharacterSelector {
  readonly characters = input<Character[]>([]);
  readonly selected = input<CharacterSelection>({});
  readonly selectionChange = output<CharacterSelection>();

  protected readonly selection = signal<CharacterSelection>({});

  protected readonly sorted = computed(() =>
    [...this.characters()].sort((a, b) => {
      if (a.offstage !== b.offstage) return a.offstage ? 1 : -1;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    }),
  );

  constructor() {
    effect(() => this.selection.set({ ...this.selected() }));
  }

  protected selectAll(): void {
    const next = { ...this.selection() };
    for (const c of this.characters()) next[c.id] = true;
    this.selection.set(next);
    this.selectionChange.emit(next);
  }

  protected update(id: number, value: boolean): void {
    const next = { ...this.selection(), [id]: value };
    this.selection.set(next);
    this.selectionChange.emit(next);
  }
}

import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { Character } from '../../core/models';
import { multiSort } from '../../core/utils';
import { ButtonComponent } from '../../ui/button.component';

export type CharacterSelection = Record<number, boolean>;

/** Checkbox list of characters with a "Select All" action (Mantine CharacterSelector). */
@Component({
  selector: 'app-character-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col gap-2">
      <app-button size="sm" (clicked)="selectAll()">Select All</app-button>
      @for (c of sorted(); track c.id) {
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            class="h-4 w-4 accent-[var(--color-m-blue)]"
            [checked]="!!selection()[c.id]"
            (change)="update(c.id, $any($event.target).checked)"
          />
          <span>{{ c.name }}</span>
        </label>
      }
    </div>
  `,
})
export class CharacterSelectorComponent {
  readonly characters = input<Character[]>([]);
  readonly selected = input<CharacterSelection>();
  readonly changed = output<CharacterSelection>();

  readonly selection = signal<CharacterSelection>({});
  private seeded = false;

  readonly sorted = computed(() =>
    [...this.characters()].sort(
      multiSort<Character>([
        { sortBy: 'offstage', dir: 'ASC' },
        { sortBy: 'name', dir: 'ASC' },
      ]),
    ),
  );

  constructor() {
    // Seed from the optional initial selection once inputs are available.
    queueMicrotask(() => {
      if (!this.seeded) {
        this.seeded = true;
        this.selection.set({ ...(this.selected() ?? {}) });
      }
    });
  }

  selectAll(): void {
    const next = { ...this.selection() };
    for (const c of this.characters()) next[c.id] = true;
    this.selection.set(next);
    this.changed.emit(next);
  }

  update(id: number, value: boolean): void {
    const next = { ...this.selection(), [id]: value };
    this.selection.set(next);
    this.changed.emit(next);
  }
}

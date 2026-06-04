import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { Character } from '../../core/models';
import { parseIntOrUndefined } from '../../core/utils';
import { ButtonComponent } from '../../ui/button.component';
import { UploadModalComponent } from './upload-modal.component';

export type CharacterEditorResult = Partial<Omit<Character, 'conditions'>>;

/** Create/edit form for a character; emits only the fields that changed. */
@Component({
  selector: 'app-character-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, UploadModalComponent],
  template: `
    <app-upload-modal
      [show]="uploadOpen()"
      [level]="3"
      accept=".png,.jpg,.jpeg,.webp"
      (hide)="uploadOpen.set(false)"
      (complete)="onUpload($event)"
    />
    <div class="flex flex-col">
      <!-- Identity -->
      <section class="flex flex-col gap-3">
        <h3 class="font-display text-xs uppercase tracking-wider text-ds-accent">Identity</h3>
        <div>
          <label class="ds-label">Name</label>
          <input class="ds-input" [value]="model().name" (input)="set('name', $any($event.target).value)" />
        </div>
      </section>

      <hr class="ds-divider" />

      <!-- Attributes -->
      <section class="flex flex-col gap-3">
        <h3 class="font-display text-xs uppercase tracking-wider text-ds-accent">Attributes</h3>
        <div class="grid grid-cols-5 gap-2">
          @for (stat of stats; track stat) {
            <div>
              <label class="ds-label">{{ stat[0].toUpperCase() + stat.slice(1) }}</label>
              <input
                class="ds-input"
                type="number"
                [value]="numValue(stat)"
                (input)="setNum(stat, $any($event.target).value)"
              />
            </div>
          }
        </div>
        <div>
          <label class="ds-label">Victories</label>
          <input class="ds-input" type="number" min="0" [value]="numValue('victories')" (input)="setNum('victories', $any($event.target).value)" />
        </div>
      </section>

      <hr class="ds-divider" />

      <!-- Vitals -->
      <section class="flex flex-col gap-3">
        <h3 class="font-display text-xs uppercase tracking-wider text-ds-accent">Vitals</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="ds-label">Max HP</label>
            <input class="ds-input" type="number" min="0" [value]="numValue('maxHp')" (input)="setNum('maxHp', $any($event.target).value)" />
          </div>
          <div>
            <label class="ds-label">Recoveries</label>
            <input class="ds-input" type="number" min="0" [value]="numValue('maxRecoveries')" (input)="setNum('maxRecoveries', $any($event.target).value)" />
          </div>
        </div>
      </section>

      <hr class="ds-divider" />

      <!-- Resource -->
      <section class="flex flex-col gap-3">
        <h3 class="font-display text-xs uppercase tracking-wider text-ds-accent">Resource</h3>
        <div>
          <label class="ds-label">Resource Name</label>
          <input class="ds-input" [value]="model().resourceName ?? ''" (input)="set('resourceName', $any($event.target).value)" />
        </div>
      </section>

      <hr class="ds-divider" />

      <!-- Presence / Encounter -->
      <section class="flex flex-col gap-3">
        <h3 class="font-display text-xs uppercase tracking-wider text-ds-accent">Presence / Encounter</h3>
        <label class="flex items-center gap-2">
          <input type="checkbox" class="h-4 w-4 accent-[var(--color-m-blue)]" [checked]="model().offstage" (change)="set('offstage', $any($event.target).checked)" />
          Offstage
        </label>
        <div>
          <label class="ds-label">Minions</label>
          <input class="ds-input" type="number" min="0" [value]="numValue('minions')" (input)="setNum('minions', $any($event.target).value, 0)" />
        </div>
      </section>

      <hr class="ds-divider" />

      <!-- Portrait -->
      <section class="flex flex-col gap-3">
        <h3 class="font-display text-xs uppercase tracking-wider text-ds-accent">Portrait</h3>
        @if (model().pictureUrl) {
          <img class="max-h-48 rounded" [src]="model().pictureUrl" alt="portrait" />
        } @else {
          <div
            class="flex h-32 items-center justify-center rounded border border-dashed border-m-dark-4 bg-m-dark-6/40 text-sm text-m-dark-3"
          >
            No portrait
          </div>
        }
        <div>
          <label class="ds-label">Picture URL</label>
          <input class="ds-input" [value]="model().pictureUrl ?? ''" (input)="set('pictureUrl', $any($event.target).value)" />
        </div>
        <app-button (clicked)="uploadOpen.set(true)">Upload</app-button>
      </section>

      <!-- Sticky submit bar -->
      <div class="sticky bottom-0 -mx-4 mt-4 flex justify-end border-t border-m-dark-4 bg-m-dark-7/95 px-4 py-3 backdrop-blur">
        <app-button [disabled]="submitting()" (clicked)="submit()">Submit</app-button>
      </div>
    </div>
  `,
})
export class CharacterEditorComponent {
  readonly character = input.required<Character>();
  readonly submitted = output<CharacterEditorResult>();

  protected readonly stats = ['might', 'agility', 'reason', 'intuition', 'presence'] as const;

  readonly model = signal<Character>({} as Character);
  readonly uploadOpen = signal(false);
  readonly submitting = signal(false);
  private readonly changed = new Set<keyof CharacterEditorResult>();
  private initialized = false;

  constructor() {
    queueMicrotask(() => {
      if (!this.initialized) {
        this.initialized = true;
        this.model.set({ ...this.character() });
      }
    });
  }

  numValue(key: keyof Character): number | string {
    const v = this.model()[key];
    return typeof v === 'number' && !Number.isNaN(v) ? v : '';
  }

  set<K extends keyof CharacterEditorResult>(key: K, value: Character[K]): void {
    this.changed.add(key);
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  setNum<K extends keyof CharacterEditorResult>(key: K, raw: string, fallback?: number): void {
    const parsed = parseIntOrUndefined(raw);
    const value = (parsed ?? fallback ?? null) as Character[K];
    this.changed.add(key);
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  onUpload(fileName: string): void {
    this.set('pictureUrl', `/files/${fileName}` as Character['pictureUrl']);
    this.uploadOpen.set(false);
  }

  submit(): void {
    const result: CharacterEditorResult = {};
    for (const key of this.changed) {
      (result as Record<string, unknown>)[key] = this.model()[key as keyof Character];
    }
    this.submitting.set(true);
    this.submitted.emit(result);
  }
}

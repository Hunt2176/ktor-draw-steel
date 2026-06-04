import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { UploadModal } from './upload-modal';
import { TextInput, NumberInput, Switch } from '../../ui/inputs';
import { Button } from '../../ui/button';
import type { Character } from '@draw-steel/shared';

export type CharacterEditorResult = Partial<Omit<Character, 'conditions'>>;

@Component({
  selector: 'ds-character-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UploadModal, TextInput, NumberInput, Switch, Button],
  template: `
    <ds-upload-modal
      [opened]="showUpload()"
      [level]="1"
      accept=".png,.jpg,.jpeg,.webp"
      (hide)="showUpload.set(false)"
      (complete)="onUploaded($event)"
    />

    <div class="flex flex-col gap-3">
      <ds-text-input
        label="Name"
        [value]="str('name')"
        (valueChange)="edit('name', $event)"
      />
      <div class="flex flex-wrap gap-2">
        @for (stat of stats; track stat.key) {
          <ds-number-input
            class="flex-1 min-w-20"
            [label]="stat.label"
            [value]="num(stat.key)"
            (valueChange)="edit(stat.key, $event)"
          />
        }
      </div>
      <ds-number-input
        label="Victories"
        [value]="num('victories')"
        (valueChange)="edit('victories', $event)"
      />
      <ds-number-input
        label="Max HP"
        [value]="num('maxHp')"
        (valueChange)="edit('maxHp', $event)"
      />
      <ds-number-input
        label="Recoveries"
        [value]="num('maxRecoveries')"
        (valueChange)="edit('maxRecoveries', $event)"
      />
      <ds-text-input
        label="Resource Name"
        [value]="str('resourceName')"
        (valueChange)="edit('resourceName', $event)"
      />
      <ds-switch
        label="Offstage"
        [checked]="bool('offstage')"
        (checkedChange)="edit('offstage', $event)"
      />
      <ds-number-input
        label="Minions"
        [min]="0"
        [value]="num('minions')"
        (valueChange)="edit('minions', $event ?? 0)"
      />
      <hr class="border-[color:var(--color-dark-5)]" />
      @if (str('pictureUrl')) {
        <img [src]="str('pictureUrl')" class="max-h-48 object-contain" alt="" />
      }
      <div class="flex flex-col gap-2">
        <ds-text-input
          label="Picture URL"
          [value]="str('pictureUrl')"
          (valueChange)="edit('pictureUrl', $event)"
        />
        <ds-button (click)="showUpload.set(true)">Upload</ds-button>
      </div>
      <hr class="my-2 border-[color:var(--color-dark-5)]" />
      <div class="flex justify-end">
        <ds-button [disabled]="submitting()" (click)="submit()">Submit</ds-button>
      </div>
    </div>
  `,
})
export class CharacterEditor {
  readonly character = input.required<Character>();
  readonly submitted = output<CharacterEditorResult>();

  protected readonly stats = [
    { key: 'might', label: 'Might' },
    { key: 'agility', label: 'Agility' },
    { key: 'reason', label: 'Reason' },
    { key: 'intuition', label: 'Intuition' },
    { key: 'presence', label: 'Presence' },
  ] as const;

  protected readonly values = signal<CharacterEditorResult>({});
  protected readonly showUpload = signal(false);
  protected readonly submitting = signal(false);
  private readonly changed = new Set<keyof CharacterEditorResult>();

  constructor() {
    effect(() => {
      const c = this.character();
      this.values.set({ ...c });
      this.changed.clear();
    });
  }

  protected str(key: keyof CharacterEditorResult): string {
    const v = this.values()[key];
    return v == null ? '' : String(v);
  }

  protected num(key: keyof CharacterEditorResult): number | null {
    const v = this.values()[key];
    return typeof v === 'number' ? v : null;
  }

  protected bool(key: keyof CharacterEditorResult): boolean {
    return this.values()[key] === true;
  }

  protected edit<K extends keyof CharacterEditorResult>(
    key: K,
    value: CharacterEditorResult[K] | null,
  ): void {
    this.changed.add(key);
    this.values.update((v) => ({ ...v, [key]: value ?? null }));
  }

  protected onUploaded(fileName: string): void {
    this.edit('pictureUrl', `/files/${fileName}`);
    this.showUpload.set(false);
  }

  protected submit(): void {
    const result: CharacterEditorResult = {};
    const current = this.values();
    for (const key of this.changed) {
      (result as Record<string, unknown>)[key] = current[key];
    }
    this.submitted.emit(result);
  }
}

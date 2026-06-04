import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  output,
  signal,
} from '@angular/core';
import { TextInput, Textarea, Select } from '../../ui/inputs';
import { Button } from '../../ui/button';
import type { DisplayEntryType } from '@draw-steel/shared';

export interface DisplayEntryEditorValue {
  title: string;
  description: string | null;
  type: DisplayEntryType;
  file: File | null;
  pictureUrl: string | null;
  /** Whether the title passes validation (`/[a-zA-Z]+/`). */
  valid: boolean;
}

@Component({
  selector: 'ds-display-entry-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextInput, Textarea, Select, Button],
  template: `
    <ds-text-input label="Title" [(value)]="title" />
    <ds-textarea label="Description" [(value)]="description" />
    <ds-select label="Type" [options]="['Portrait', 'Background']" [(value)]="type" />
    <input
      #fileInput
      type="file"
      class="hidden"
      (change)="onFile(fileInput.files)"
    />
    <ds-button (click)="fileInput.click()">
      {{ file() == null ? 'Add' : 'Replace' }} Image
    </ds-button>
    @if (previewUrl()) {
      <img [src]="previewUrl()" class="object-contain max-h-48 mt-2" alt="" />
    }
  `,
})
export class DisplayEntryEditor {
  readonly changed = output<DisplayEntryEditorValue>();

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly type = signal<string>('Portrait');
  protected readonly file = signal<File | null>(null);

  protected readonly previewUrl = computed(() => {
    const f = this.file();
    return f ? URL.createObjectURL(f) : null;
  });

  constructor() {
    effect(() => {
      const title = this.title();
      this.changed.emit({
        title,
        description: this.description() || null,
        type: this.type() as DisplayEntryType,
        file: this.file(),
        pictureUrl: null,
        valid: /[a-zA-Z]+/.test(title),
      });
    });
  }

  protected onFile(files: FileList | null): void {
    this.file.set(files?.item(0) ?? null);
  }
}

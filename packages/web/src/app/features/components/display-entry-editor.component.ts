import { ChangeDetectionStrategy, Component, effect, output, signal } from '@angular/core';
import type { DisplayEntryType } from '../../core/models';

export interface DisplayEntryEditorUpdate {
  title: string;
  description: string | null;
  type: DisplayEntryType;
  pictureUrl: string | null;
  file: File | null;
}

/** Editor for a display entry (Mantine DisplayEntryEditor). Emits null when invalid. */
@Component({
  selector: 'app-display-entry-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <div>
        <label class="ds-label">Title</label>
        <input class="ds-input" [value]="title()" (input)="title.set($any($event.target).value)" />
      </div>
      <div>
        <label class="ds-label">Description</label>
        <textarea class="ds-input" rows="3" [value]="description()" (input)="description.set($any($event.target).value)"></textarea>
      </div>
      <div>
        <label class="ds-label">Type</label>
        <select class="ds-input" [value]="type()" (change)="type.set($any($event.target).value)">
          <option value="Portrait">Portrait</option>
          <option value="Background">Background</option>
        </select>
      </div>
      <label class="ds-btn cursor-pointer w-fit">
        {{ previewUrl() ? 'Replace' : 'Add' }} Image
        <input type="file" class="hidden" (change)="onFile($event)" />
      </label>
      @if (previewUrl()) {
        <img class="max-h-56 rounded object-contain" [src]="previewUrl()" alt="preview" />
      }
    </div>
  `,
})
export class DisplayEntryEditorComponent {
  readonly changed = output<DisplayEntryEditorUpdate | null>();

  readonly title = signal('');
  readonly description = signal('');
  readonly type = signal<DisplayEntryType>('Portrait');
  readonly file = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      const title = this.title();
      const valid = /[a-zA-Z]+/.test(title);
      this.changed.emit(
        valid
          ? {
              title,
              description: this.description() || null,
              type: this.type(),
              pictureUrl: null,
              file: this.file(),
            }
          : null,
      );
    });
  }

  onFile(event: Event): void {
    const selected = (event.target as HTMLInputElement).files?.item(0) ?? null;
    this.file.set(selected);
    this.previewUrl.set(selected ? URL.createObjectURL(selected) : null);
  }
}

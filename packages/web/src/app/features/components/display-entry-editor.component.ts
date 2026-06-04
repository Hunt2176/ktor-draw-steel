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
        <textarea
          class="ds-input min-h-24 resize-y"
          rows="4"
          [value]="description()"
          (input)="description.set($any($event.target).value)"
        ></textarea>
      </div>
      <div>
        <label class="ds-label">Type</label>
        <div class="inline-flex overflow-hidden rounded-md border border-m-dark-4" role="group">
          @for (option of typeOptions; track option) {
            <button
              type="button"
              class="font-display px-4 py-1.5 text-sm transition-colors"
              [class.bg-ds-accent]="type() === option"
              [class.text-m-dark-9]="type() === option"
              [class.text-m-dark-1]="type() !== option"
              [class.hover:bg-m-dark-6]="type() !== option"
              [attr.aria-pressed]="type() === option"
              (click)="type.set(option)"
            >
              {{ option }}
            </button>
          }
        </div>
      </div>
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors"
        [class.border-ds-accent]="dragging()"
        [class.bg-m-dark-6]="dragging()"
        [class.border-m-dark-4]="!dragging()"
        (dragover)="onDragOver($event)"
        (dragenter)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        @if (previewUrl()) {
          <img class="max-h-56 rounded object-contain" [src]="previewUrl()" alt="preview" />
          <span class="font-display text-xs text-ds-accent">Click or drop to replace</span>
        } @else {
          <span class="font-display text-base text-ds-accent">Drop an image here</span>
          <span class="text-sm text-m-dark-1">or click to browse</span>
        }
        <input type="file" class="hidden" accept="image/*" (change)="onFile($event)" />
      </label>
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
  readonly dragging = signal(false);

  /** The selectable display-entry types, rendered as a segmented control. */
  protected readonly typeOptions: DisplayEntryType[] = ['Portrait', 'Background'];

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
    this.setFile(selected);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const selected = event.dataTransfer?.files?.item(0) ?? null;
    if (selected) this.setFile(selected);
  }

  private setFile(selected: File | null): void {
    this.file.set(selected);
    this.previewUrl.set(selected ? URL.createObjectURL(selected) : null);
  }
}

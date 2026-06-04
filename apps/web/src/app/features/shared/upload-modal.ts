import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';

/** Mantine upload modal: pick a file, preview it, upload, emit the stored name. */
@Component({
  selector: 'ds-upload-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Modal, Button],
  template: `
    <ds-modal
      [opened]="opened()"
      title="Upload"
      [level]="level()"
      (closed)="close()"
    >
      <input
        #fileInput
        type="file"
        class="hidden"
        [attr.accept]="accept()"
        (change)="onFileChange(fileInput.files)"
      />

      <div
        class="ds-dropzone"
        [class.ds-dropzone--active]="dragOver()"
        role="button"
        tabindex="0"
        [attr.aria-label]="'Drag an image here or click to browse'"
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        @if (previewUrl()) {
          <img
            [src]="previewUrl()"
            class="ds-dropzone__preview"
            alt="Selected file preview"
          />
        } @else {
          <svg
            class="ds-dropzone__glyph"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          <div class="ds-dropzone__hint">
            Drag an image here or click to browse
          </div>
        }
      </div>

      @if (file(); as f) {
        <div class="ds-fileinfo">
          <span class="ds-fileinfo__name">{{ f.name }}</span>
          <span class="ds-fileinfo__size">{{ formatSize(f.size) }}</span>
        </div>
      }

      @if (acceptHint(); as hint) {
        <div class="ds-accept-hint">Accepted types: {{ hint }}</div>
      }

      <div class="mt-3 flex justify-center">
        <ds-button variant="subtle" (click)="fileInput.click()">
          Select File
        </ds-button>
      </div>

      <hr class="my-4 border-[color:var(--color-dark-5)]" />
      <div class="flex justify-end">
        <ds-button [disabled]="uploadDisabled()" (click)="upload()">
          Upload
        </ds-button>
      </div>
    </ds-modal>
  `,
  styles: [
    `
      .ds-dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        min-height: 11rem;
        padding: 1.25rem;
        border: 2px dashed var(--color-dark-4, #495057);
        border-radius: 0.7rem;
        background: color-mix(
          in srgb,
          var(--color-dark-6, #25262b) 40%,
          transparent
        );
        color: var(--color-dark-2, #c1c2c5);
        cursor: pointer;
        text-align: center;
        transition:
          border-color 0.12s,
          background 0.12s,
          color 0.12s;
      }
      .ds-dropzone:hover {
        border-color: var(--color-brand-blue, #4dabf7);
        color: var(--color-dark-0, #fff);
      }
      .ds-dropzone:focus-visible {
        outline: 2px solid var(--color-brand-blue, #4dabf7);
        outline-offset: 2px;
      }
      .ds-dropzone--active {
        border-color: var(--color-brand-green, #69db7c);
        background: color-mix(
          in srgb,
          var(--color-brand-green, #69db7c) 14%,
          transparent
        );
        color: var(--color-dark-0, #fff);
      }
      .ds-dropzone__glyph {
        width: 2.4rem;
        height: 2.4rem;
        opacity: 0.85;
      }
      .ds-dropzone__hint {
        font-size: 0.85rem;
      }
      .ds-dropzone__preview {
        max-height: 14rem;
        max-width: 100%;
        object-fit: contain;
        border-radius: 0.4rem;
        pointer-events: none;
      }
      .ds-fileinfo {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 0.75rem;
        font-size: 0.85rem;
        color: var(--color-dark-1, #e9ecef);
      }
      .ds-fileinfo__name {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ds-fileinfo__size {
        flex: none;
        color: var(--color-dark-2, #c1c2c5);
      }
      .ds-accept-hint {
        margin-top: 0.4rem;
        font-size: 0.75rem;
        color: var(--color-dark-3, #909296);
      }
    `,
  ],
})
export class UploadModal {
  private readonly api = inject(ApiService);

  readonly opened = input(false);
  readonly accept = input<string | undefined>(undefined);
  readonly level = input(0);
  readonly hide = output<void>();
  readonly complete = output<string>();

  protected readonly file = signal<File | null>(null);
  protected readonly pending = signal(false);
  protected readonly dragOver = signal(false);
  protected readonly previewUrl = computed(() => {
    const f = this.file();
    return f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
  });
  protected readonly uploadDisabled = computed(
    () => this.pending() || this.file() == null,
  );

  /** Human-readable list of accepted extensions derived from the `accept` input. */
  protected readonly acceptHint = computed(() => {
    const raw = this.accept();
    if (!raw) return null;
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts.length ? parts.join(', ') : null;
  });

  protected onFileChange(files: FileList | null): void {
    this.file.set(files?.item(0) ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.onFileChange(event.dataTransfer?.files ?? null);
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  protected close(): void {
    this.file.set(null);
    this.hide.emit();
  }

  protected async upload(): Promise<void> {
    const f = this.file();
    if (!f) return;
    this.pending.set(true);
    try {
      const res = await this.api.uploadFile(f);
      this.complete.emit(res.fileName);
    } finally {
      this.pending.set(false);
    }
  }
}

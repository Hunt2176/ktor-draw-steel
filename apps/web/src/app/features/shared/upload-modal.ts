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
      <div class="flex flex-col items-center gap-3">
        @if (previewUrl()) {
          <img [src]="previewUrl()" class="max-h-64 object-contain" alt="" />
        }
        @if (file()) {
          <label>{{ file()!.name }}</label>
        }
        <ds-button (click)="fileInput.click()">Select File</ds-button>
      </div>
      <hr class="my-4 border-[color:var(--color-dark-5)]" />
      <div class="flex justify-end">
        <ds-button [disabled]="uploadDisabled()" (click)="upload()">Upload</ds-button>
      </div>
    </ds-modal>
  `,
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
  protected readonly previewUrl = computed(() => {
    const f = this.file();
    return f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
  });
  protected readonly uploadDisabled = computed(
    () => this.pending() || this.file() == null,
  );

  protected onFileChange(files: FileList | null): void {
    this.file.set(files?.item(0) ?? null);
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

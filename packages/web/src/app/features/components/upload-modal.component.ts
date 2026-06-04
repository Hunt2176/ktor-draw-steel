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
import { ButtonComponent } from '../../ui/button.component';
import { ModalComponent } from '../../ui/modal.component';

/** Formats a byte count into a human-readable string (e.g. "1.2 MB"). */
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${units[exponent]}`;
}

/** Upload a file with an image preview (Mantine UploadModal). */
@Component({
  selector: 'app-upload-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, ModalComponent],
  template: `
    <app-modal [opened]="show()" [level]="level()" title="Upload" (closed)="onClose()">
      <div class="flex flex-col items-stretch gap-3">
        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
          [class.border-ds-accent]="dragging()"
          [class.bg-m-dark-6]="dragging()"
          [class.border-m-dark-4]="!dragging()"
          (dragover)="onDragOver($event)"
          (dragenter)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          @if (previewUrl()) {
            <img class="max-h-64 rounded" [src]="previewUrl()" alt="preview" />
          }
          @if (file()) {
            <span class="text-sm text-m-dark-0">
              {{ file()!.name }}
              <span class="text-m-dark-1">({{ formattedSize() }})</span>
            </span>
            <span class="font-display text-xs text-ds-accent">Click or drop to replace</span>
          } @else {
            <span class="font-display text-base text-ds-accent">Drop a file here</span>
            <span class="text-sm text-m-dark-1">or click to browse</span>
            <span class="text-xs text-m-dark-2">Accepts: {{ acceptHint() }}</span>
          }
          <input type="file" class="hidden" [accept]="accept()" (change)="onFileChange($event)" />
        </label>
      </div>
      <hr class="ds-divider" />
      <div class="flex justify-end">
        <app-button [disabled]="pending() || file() == null" (clicked)="upload()">Upload</app-button>
      </div>
    </app-modal>
  `,
})
export class UploadModalComponent {
  private readonly api = inject(ApiService);
  readonly show = input(false);
  readonly accept = input<string>('');
  readonly level = input(1);
  readonly hide = output<void>();
  readonly complete = output<string>();

  readonly file = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly pending = signal(false);
  readonly dragging = signal(false);

  /** Human-readable size of the selected file (e.g. "1.2 MB"). */
  readonly formattedSize = computed(() => formatBytes(this.file()?.size ?? 0));

  /** A short hint listing the accepted types, or a generic fallback. */
  readonly acceptHint = computed(() => {
    const raw = this.accept().trim();
    if (!raw) return 'Images';
    return raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (part.startsWith('.') ? part.slice(1).toUpperCase() : part))
      .join(', ');
  });

  onFileChange(event: Event): void {
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

  onClose(): void {
    this.setFile(null);
    this.hide.emit();
  }

  async upload(): Promise<void> {
    const selected = this.file();
    if (!selected) return;
    this.pending.set(true);
    try {
      const result = await this.api.uploadFile(selected);
      this.complete.emit(result.fileName);
      this.setFile(null);
    } finally {
      this.pending.set(false);
    }
  }
}

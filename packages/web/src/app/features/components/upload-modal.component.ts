import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { ButtonComponent } from '../../ui/button.component';
import { ModalComponent } from '../../ui/modal.component';

/** Upload a file with an image preview (Mantine UploadModal). */
@Component({
  selector: 'app-upload-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, ModalComponent],
  template: `
    <app-modal [opened]="show()" [level]="level()" title="Upload" (closed)="onClose()">
      <div class="flex flex-col items-center gap-3">
        @if (previewUrl()) {
          <img class="max-h-64 rounded" [src]="previewUrl()" alt="preview" />
        }
        @if (file()) {
          <span class="text-sm text-m-dark-1">{{ file()!.name }}</span>
        }
        <label class="ds-btn cursor-pointer">
          Select File
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

  onFileChange(event: Event): void {
    const selected = (event.target as HTMLInputElement).files?.item(0) ?? null;
    this.setFile(selected);
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

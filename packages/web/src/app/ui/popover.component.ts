import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Click-toggled popover with an anchored dropdown (Mantine Popover). Project the
 * trigger with `[popTarget]` and the content with `[popDropdown]`. Closes on
 * outside click or Escape; exposes `close()` via `exportAs`.
 *
 * `position` anchors the dropdown to the trigger's left edge or centres it.
 * The dropdown is width-capped (`max-w-[90vw]`) to avoid horizontal overflow,
 * and animates in with a reduced-motion-safe fade/scale.
 */
@Component({
  selector: 'app-popover',
  standalone: true,
  exportAs: 'popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex cursor-pointer"
      aria-haspopup="true"
      [attr.aria-expanded]="open()"
      (click)="toggle($event)"
    >
      <ng-content select="[popTarget]" />
    </span>
    @if (open()) {
      <div
        class="ds-pop-dropdown ds-card absolute z-[200] mt-2 min-w-[16rem] max-w-[90vw]"
        [class.ds-pop--left]="position() === 'left'"
        [class.ds-pop--center]="position() === 'center'"
        (click)="$event.stopPropagation()"
      >
        <ng-content select="[popDropdown]" />
      </div>
    }
  `,
  styles: [
    `
      /* Anchor the dropdown to the trigger's left edge. */
      .ds-pop--left {
        left: 0;
        --ds-pop-base-transform: translateX(0);
      }
      /* Horizontally centre the dropdown over the trigger. */
      .ds-pop--center {
        left: 50%;
        --ds-pop-base-transform: translateX(-50%);
      }
      @keyframes ds-pop-in {
        from {
          opacity: 0;
          transform: var(--ds-pop-base-transform, translateX(0)) scale(0.97)
            translateY(-0.25rem);
        }
        to {
          opacity: 1;
          transform: var(--ds-pop-base-transform, translateX(0)) scale(1) translateY(0);
        }
      }
      .ds-pop-dropdown {
        /* Hold the resting transform (centring) after the entrance finishes. */
        transform: var(--ds-pop-base-transform, translateX(0));
        animation: ds-pop-in 0.15s ease-out;
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-pop-dropdown {
          animation: none;
        }
      }
    `,
  ],
  host: { class: 'relative inline-flex' },
})
export class PopoverComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly position = input<'left' | 'center'>('left');
  readonly open = signal(false);

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }
}

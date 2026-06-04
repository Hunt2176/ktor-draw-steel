import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import type { ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Mantine `Popover` approximation built on the CDK connected overlay.
 *
 * Usage:
 *   <ds-popover>
 *     <button dsTrigger>open</button>
 *     <div dsDropdown>content</div>
 *   </ds-popover>
 *
 * `opened` is a two-way model so callers (e.g. confirmation popovers) can drive it.
 */
@Component({
  selector: 'ds-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule],
  template: `
    <span
      class="ds-pop-trigger"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      (click)="toggle()"
    >
      <ng-content select="[dsTrigger]" />
    </span>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="opened()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="opened.set(false)"
      (overlayKeydown)="onKeydown($event)"
    >
      <div class="glass ds-pop-dropdown" [style.width]="width()">
        <ng-content select="[dsDropdown]" />
      </div>
    </ng-template>
  `,
  styles: [
    `
      .ds-pop-trigger {
        display: inline-flex;
      }
      .ds-pop-dropdown {
        border: 1px solid var(--color-dark-4);
        border-radius: 0.6rem;
        padding: 0.75rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        min-width: 12rem;
      }
    `,
  ],
})
export class Popover {
  readonly opened = model(false);
  readonly width = input<string | undefined>(undefined);

  protected readonly positions: ConnectedPosition[] = [
    {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];

  protected toggle(): void {
    this.opened.update((v) => !v);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.opened.set(false);
  }
}

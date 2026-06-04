import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PALETTE, type AccentColor } from './palette';

export interface RingSection {
  value: number; // 0–100
  color: string; // accent name or hex
}

interface RenderedSection {
  color: string;
  dashoffset: number;
  rotation: number;
}

/** Donut progress ring with stacked sections (Mantine RingProgress). */
@Component({
  selector: 'app-ring-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" [style.width.px]="size()" [style.height.px]="size()">
      <svg
        [attr.width]="size()"
        [attr.height]="size()"
        [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
      >
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="trackColor()"
          [attr.stroke-width]="thickness()"
        />
        @for (s of rendered(); track $index) {
          <circle
            class="ds-ring-section"
            [attr.cx]="center()"
            [attr.cy]="center()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke]="s.color"
            [attr.stroke-width]="thickness()"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference()"
            [attr.stroke-dashoffset]="s.dashoffset"
            [style.--ds-ring-offset]="s.dashoffset"
            [style.--ds-ring-circumference]="circumference()"
            [style.transform]="'rotate(' + s.rotation + 'deg)'"
            [style.transformOrigin]="'center'"
          />
        }
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      /*
       * Entrance sweep: each section starts fully "empty" (dashoffset ==
       * circumference) and animates to its computed dashoffset on first
       * render. fill-mode is "backwards" only — the keyframe's "from" applies
       * before the run, but once it completes the property is released back to
       * the [attr.stroke-dashoffset] binding. This is what keeps later value
       * changes (HP/recovery edits) working via the existing 0.25s transition
       * and guarantees the settled geometry/visual output is byte-identical to
       * before the animation was added.
       */
      .ds-ring-section {
        transition: stroke-dashoffset 0.25s ease;
        animation: ds-ring-sweep 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
      }

      @keyframes ds-ring-sweep {
        from {
          stroke-dashoffset: var(--ds-ring-circumference);
        }
        to {
          stroke-dashoffset: var(--ds-ring-offset);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ds-ring-section {
          animation: none;
        }
      }
    `,
  ],
})
export class RingProgressComponent {
  readonly size = input(100);
  readonly thickness = input(12);
  readonly sections = input<RingSection[]>([]);
  readonly rootColor = input<string | undefined>(undefined);

  readonly center = computed(() => this.size() / 2);
  readonly radius = computed(() => (this.size() - this.thickness()) / 2);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());

  readonly trackColor = computed(() =>
    this.rootColor() ? resolveColor(this.rootColor()!) : 'var(--color-m-dark-4)',
  );

  readonly rendered = computed<RenderedSection[]>(() => {
    const c = this.circumference();
    let cumulative = 0;
    const out: RenderedSection[] = [];
    for (const section of this.sections()) {
      const value = Math.max(0, Math.min(section.value, 100));
      out.push({
        color: resolveColor(section.color),
        dashoffset: c * (1 - value / 100),
        rotation: cumulative * 3.6 - 90,
      });
      cumulative += value;
    }
    return out;
  });
}

function resolveColor(color: string): string {
  const accent = PALETTE[color as AccentColor];
  return accent ? accent.base : color;
}

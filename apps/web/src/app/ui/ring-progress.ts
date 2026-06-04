import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface RingSection {
  /** Percentage of the full ring (0-100). */
  value: number;
  /** Colour name (mapped to hex) or hex string. */
  color: string;
}

const RING_COLORS: Record<string, string> = {
  green: '#40c057',
  orange: '#fd7e14',
  red: '#fa5252',
  yellow: '#fcc419',
  blue: '#228be6',
  dark: '#25262b',
  grape: '#be4bdb',
  teal: '#12b886',
  gray: '#868e96',
};

function ringColor(name: string | undefined): string {
  if (!name) return '#2c2e33';
  return RING_COLORS[name] ?? name;
}

/** Mantine `RingProgress` approximation — stacked SVG arc sections + centre label. */
@Component({
  selector: 'ds-ring-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ring"
      [style.width.px]="size()"
      [style.height.px]="size()"
    >
      <svg [attr.width]="size()" [attr.height]="size()">
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="trackColor()"
          [attr.stroke-width]="thickness()"
        />
        @for (seg of segments(); track $index) {
          <circle
            [attr.cx]="center()"
            [attr.cy]="center()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke]="seg.color"
            [attr.stroke-width]="thickness()"
            stroke-linecap="round"
            [attr.stroke-dasharray]="seg.len + ' ' + circumference()"
            [attr.transform]="
              'rotate(' + seg.rotate + ' ' + center() + ' ' + center() + ')'
            "
          />
        }
      </svg>
      <div class="ring-label">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .ring {
        position: relative;
        display: inline-flex;
      }
      .ring svg {
        transform: rotate(0);
      }
      .ring-label {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
    `,
  ],
})
export class RingProgress {
  readonly sections = input<RingSection[]>([]);
  readonly rootColor = input<string | undefined>(undefined);
  readonly size = input(100);
  readonly thickness = input(12);

  protected readonly center = computed(() => this.size() / 2);
  protected readonly radius = computed(() => (this.size() - this.thickness()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  protected readonly trackColor = computed(() => ringColor(this.rootColor()));

  protected readonly segments = computed(() => {
    const circ = this.circumference();
    let cumulative = 0;
    return this.sections().map((s) => {
      const value = Math.max(0, Math.min(s.value, 100));
      const len = (value / 100) * circ;
      const rotate = (cumulative / 100) * 360 - 90;
      cumulative += s.value;
      return { len, rotate, color: ringColor(s.color) };
    });
  });
}

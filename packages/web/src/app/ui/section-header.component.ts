import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The repeated glass, left-anchored chip used as a section header. Projects the
 * title via the default slot and trailing controls via `[actions]`, replacing
 * the inline `glass left-anchored inline-flex ... p-3` panels.
 */
@Component({
  selector: 'app-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass left-anchored inline-flex w-fit items-center gap-2 p-3">
      <div class="font-display font-bold leading-none">
        <ng-content />
      </div>
      <ng-content select="[actions]" />
    </div>
  `,
  host: { class: 'block' },
})
export class SectionHeaderComponent {}

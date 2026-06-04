import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { icon, type IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * Renders a FontAwesome SVG icon. Uses the framework-agnostic svg-core so we
 * avoid coupling to a specific angular-fontawesome version.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="inline-flex" [innerHTML]="html()"></span>`,
  styles: [':host { display: inline-flex; line-height: 0; }'],
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly name = input.required<IconDefinition>();

  readonly html = computed<SafeHtml>(() => {
    const rendered = icon(this.name());
    return this.sanitizer.bypassSecurityTrustHtml(rendered ? rendered.html.join('') : '');
  });
}

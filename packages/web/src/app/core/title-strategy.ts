import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Sets the document title as `Draw Steel — <route title>`, falling back to the
 * bare brand when a route declares no title.
 */
@Injectable({ providedIn: 'root' })
export class DrawSteelTitleStrategy extends TitleStrategy {
  private static readonly BRAND = 'Draw Steel';

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      routeTitle ? `${DrawSteelTitleStrategy.BRAND} — ${routeTitle}` : DrawSteelTitleStrategy.BRAND,
    );
  }
}

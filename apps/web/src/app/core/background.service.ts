import { Injectable } from '@angular/core';
import type { Campaign } from '@draw-steel/shared';

/** Applies a campaign's background image to the app root (mirrors useCampaignBackground). */
@Injectable({ providedIn: 'root' })
export class BackgroundService {
  apply(campaign: Campaign | undefined): void {
    const root = document.querySelector('ds-root') as HTMLElement | null;
    if (!root) return;
    const background = campaign?.background;
    if (background) {
      root.style.backgroundImage = `url(${background})`;
      root.style.backgroundRepeat = 'no-repeat';
      root.style.backgroundSize = 'cover';
      root.style.backgroundAttachment = 'fixed';
    } else {
      root.style.background = '';
    }
  }
}

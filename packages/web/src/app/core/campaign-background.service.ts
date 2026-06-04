import { Injectable } from '@angular/core';
import type { Campaign } from '@draw-steel/shared';

/**
 * Applies a campaign's background image to the page body. Port of the original
 * `useCampaignBackground` hook.
 */
@Injectable({ providedIn: 'root' })
export class CampaignBackgroundService {
  apply(campaign: Campaign | undefined): void {
    const root = document.querySelector('app-root') as HTMLElement | null;
    const target = root ?? document.body;
    const background = campaign?.background;
    if (background) {
      target.style.backgroundImage = `url(${background})`;
      target.style.backgroundRepeat = 'no-repeat';
      target.style.backgroundSize = 'cover';
      target.style.backgroundAttachment = 'fixed';
    } else {
      target.style.background = '';
    }
  }
}

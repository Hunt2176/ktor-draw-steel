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
    if (background && this.isImageSrc(background)) {
      target.style.backgroundImage = `url(${background})`;
      target.style.backgroundRepeat = 'no-repeat';
      target.style.backgroundSize = 'cover';
      target.style.backgroundAttachment = 'fixed';
    } else {
      target.style.background = '';
    }
  }

  /**
   * Heuristic guard so prose accidentally stored in `background` (legacy/seed
   * data) is not emitted as an invalid `url(...)`. Accepts absolute URLs,
   * root-relative paths, data URIs, or recognised image-extension paths.
   */
  private isImageSrc(value: string): boolean {
    return /^(https?:\/\/|\/|data:image\/)/.test(value) || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(value);
  }
}

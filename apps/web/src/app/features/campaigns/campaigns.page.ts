import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Button } from '../../ui/button';
import type { CampaignDetails } from '@draw-steel/shared';

@Component({
  selector: 'ds-campaigns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Campaigns</h1>
      <table>
        <tbody>
          @for (details of campaigns.value() ?? []; track details.campaign.id) {
            <tr>
              <td class="py-1">
                <ds-button (click)="select(details)">{{
                  details.campaign.name
                }}</ds-button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CampaignsPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly campaigns = resource({
    loader: () => this.api.fetchCampaigns(),
  });

  protected select(details: CampaignDetails): void {
    void this.router.navigate(['/campaigns', details.campaign.id]);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CampaignDetails } from '../../core/models';
import { CampaignStore } from '../../core/campaign-store.service';
import { ButtonComponent } from '../../ui/button.component';

/** Campaign picker — a list of buttons, one per campaign. */
@Component({
  selector: 'app-campaigns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    @if (campaigns(); as list) {
      <div class="p-4">
        <h1 class="mb-4 text-2xl font-bold">Campaigns</h1>
        <table>
          <tbody>
            @for (details of list; track details.campaign.id) {
              <tr>
                <td class="py-1">
                  <app-button (clicked)="select(details)">{{ details.campaign.name }}</app-button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class CampaignsComponent {
  private readonly store = inject(CampaignStore);
  private readonly router = inject(Router);
  protected readonly campaigns = this.store.campaignList();

  select(details: CampaignDetails): void {
    void this.router.navigate(['/campaigns', details.campaign.id]);
  }
}

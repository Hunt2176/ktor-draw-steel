import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ds-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="p-4">
      Stuff Here
      <div class="mt-2">
        <a class="text-[color:var(--color-brand-blue)] underline" routerLink="/campaigns"
          >Campaigns</a
        >
      </div>
    </div>
  `,
})
export class HomePage {}

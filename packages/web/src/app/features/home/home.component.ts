import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Landing page — matches the original placeholder, with a link into campaigns. */
@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="p-4">
      Stuff Here
      <div class="mt-4">
        <a class="text-m-blue-light underline" routerLink="/campaigns">Campaigns</a>
      </div>
    </div>
  `,
})
export class HomeComponent {}

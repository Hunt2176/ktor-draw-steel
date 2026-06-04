import type { Routes } from '@angular/router';

/** Route map — a 1:1 port of the original React Router configuration. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'campaigns',
    loadComponent: () =>
      import('./features/campaigns/campaigns.component').then((m) => m.CampaignsComponent),
  },
  {
    path: 'campaigns/:id',
    loadComponent: () =>
      import('./features/campaign-detail/campaign-detail.component').then(
        (m) => m.CampaignDetailComponent,
      ),
  },
  {
    path: 'campaigns/:id/characters',
    loadComponent: () =>
      import('./features/character-page/character-page.component').then(
        (m) => m.CharacterPageComponent,
      ),
  },
  {
    path: 'campaigns/:id/display',
    loadComponent: () =>
      import('./features/display/display.component').then((m) => m.DisplayComponent),
  },
  {
    path: 'characters/:id',
    loadComponent: () =>
      import('./features/character-page/character-page.component').then(
        (m) => m.CharacterPageComponent,
      ),
  },
  {
    path: 'combats/:id',
    loadComponent: () => import('./features/combat/combat.component').then((m) => m.CombatComponent),
  },
];

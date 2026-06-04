import type { Routes } from '@angular/router';

/** Route map — a 1:1 port of the original React Router configuration. */
export const routes: Routes = [
  {
    path: '',
    title: 'Home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'campaigns',
    title: 'Campaigns',
    loadComponent: () =>
      import('./features/campaigns/campaigns.component').then((m) => m.CampaignsComponent),
  },
  {
    path: 'campaigns/:id',
    title: 'Campaign',
    loadComponent: () =>
      import('./features/campaign-detail/campaign-detail.component').then(
        (m) => m.CampaignDetailComponent,
      ),
  },
  {
    path: 'campaigns/:id/characters',
    title: 'Character',
    loadComponent: () =>
      import('./features/character-page/character-page.component').then(
        (m) => m.CharacterPageComponent,
      ),
  },
  {
    path: 'campaigns/:id/display',
    title: 'Display',
    loadComponent: () =>
      import('./features/display/display.component').then((m) => m.DisplayComponent),
  },
  {
    path: 'characters/:id',
    title: 'Character',
    loadComponent: () =>
      import('./features/character-page/character-page.component').then(
        (m) => m.CharacterPageComponent,
      ),
  },
  {
    path: 'combats/:id',
    title: 'Combat',
    loadComponent: () => import('./features/combat/combat.component').then((m) => m.CombatComponent),
  },
];

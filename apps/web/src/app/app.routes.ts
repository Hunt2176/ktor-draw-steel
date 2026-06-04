import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'campaigns',
    loadComponent: () =>
      import('./features/campaigns/campaigns.page').then((m) => m.CampaignsPage),
  },
  {
    path: 'campaigns/:id',
    loadComponent: () =>
      import('./features/campaign-detail/campaign-detail.page').then(
        (m) => m.CampaignDetailPage,
      ),
  },
  {
    path: 'campaigns/:id/characters',
    loadComponent: () =>
      import('./features/character/character.page').then((m) => m.CharacterPage),
  },
  {
    path: 'campaigns/:id/display',
    loadComponent: () =>
      import('./features/display/display.page').then((m) => m.DisplayPage),
  },
  {
    path: 'characters/:id',
    loadComponent: () =>
      import('./features/character/character.page').then((m) => m.CharacterPage),
  },
  {
    path: 'combats/:id',
    loadComponent: () =>
      import('./features/combat/combat.page').then((m) => m.CombatPage),
  },
];

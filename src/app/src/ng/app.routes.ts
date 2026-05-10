import { Routes } from '@angular/router';
import { CampaignDetailPageComponent } from './pages/campaign-detail.page';
import { CampaignsPageComponent } from './pages/campaigns.page';
import { CharactersPageComponent } from './pages/characters.page';
import { CombatPageComponent } from './pages/combat.page';
import { DisplayPageComponent } from './pages/display.page';
import { HomePageComponent } from './pages/home.page';

export const appRoutes: Routes = [
    { path: '', component: HomePageComponent },
    { path: 'campaigns', component: CampaignsPageComponent },
    { path: 'campaigns/:id', component: CampaignDetailPageComponent },
    { path: 'campaigns/:id/characters', component: CharactersPageComponent },
    { path: 'campaigns/:id/display', component: DisplayPageComponent },
    { path: 'characters/:id', component: CharactersPageComponent },
    { path: 'combats/:id', component: CombatPageComponent },
    { path: '**', redirectTo: '' },
];

import { Routes } from '@angular/router';
import { CampaignDetailPageComponent } from '@app/pages/campaign-detail/campaign-detail.page';
import { CampaignsPageComponent } from '@app/pages/campaigns/campaigns.page';
import { CharactersPageComponent } from '@app/pages/characters/characters.page';
import { CombatPageComponent } from '@app/pages/combat/combat.page';
import { DisplayPageComponent } from '@app/pages/display/display.page';
import { HomePageComponent } from '@app/pages/home/home.page';

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

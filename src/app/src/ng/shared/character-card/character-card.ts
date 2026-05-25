import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Character } from '@app-types/models';
import { MatCard, MatCardHeader, MatCardContent, MatCardImage } from "@angular/material/card";
import { Gauge } from "@app/shared/gauge/gauge";
import { BaseDirective } from "@app/shared/base.directive";
import { MatIconButton } from "@angular/material/button";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MenuItem } from "@app-types/menu-item";

@Component({
	selector: 'app-character-card',
	imports: [MatCard, MatCardHeader, MatCardContent, Gauge, MatCardImage, MatIconButton, FontAwesomeModule, MatMenu, MatMenuTrigger, MatMenuItem],
	templateUrl: './character-card.html',
	styleUrl: './character-card.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterCard extends BaseDirective {
	
	readonly character = input.required<Character>();
	readonly menuItems = input<MenuItem[]>([]);
	
	readonly faEllipsisVertical = faEllipsisVertical;
	
	readonly imageUrlToUse = computed(() => {
		return this.character().pictureUrl?.trim() ?? '';
	});
	
	readonly imageLoadError = linkedSignal<any>(() => {
		this.imageUrlToUse();
		return null;
	});

	readonly hpPool = computed(() => {
		return Character.getHp(this.character());
	});
	readonly recoveriesPool = computed(() => {
		return Character.getRecoveries(this.character());
	});
}

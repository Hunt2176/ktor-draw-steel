import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Character } from '@app/types/models';
import { MatCard, MatCardHeader, MatCardContent, MatCardImage } from "@angular/material/card";
import { Gauge } from "../gauge/gauge";

@Component({
	selector: 'app-character-card',
	imports: [MatCard, MatCardHeader, MatCardContent, MatCardImage, Gauge],
	templateUrl: './character-card.html',
	styleUrl: './character-card.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterCard {

	readonly character = input.required<Character>();

	readonly hpPool = computed(() => {
		return Character.getHp(this.character());
	});
	readonly recoveriesPool = computed(() => {
		return Character.getRecoveries(this.character());
	});
}

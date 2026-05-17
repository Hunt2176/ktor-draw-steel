import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CharacterPool } from '@app/types/models';

@Component({
	selector: 'app-gauge',
	imports: [MatProgressSpinnerModule],
	template: `
		<mat-progress-spinner mode="determinate" [value]="gaugeValue()" />
	`,
	styleUrl: './gauge.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gauge {
	readonly pool = input.required<CharacterPool>();

	protected gaugeValue = computed(() => {
		return this.pool().percent * 100;
	});
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CharacterPool } from '@app-types/models';

@Component({
	selector: 'app-gauge',
	imports: [MatProgressSpinnerModule],
	template: `
		<mat-progress-spinner mode="determinate" [value]="gaugeValue()" />
		@if (labelToUse(); as labelToUse) {
			<span>{{ labelToUse }}</span>
		}
	`,
	styleUrl: './gauge.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'grid text-center'
	}
})
export class Gauge {
	readonly pool = input.required<CharacterPool>();
	readonly label = input<string>();
	
	protected readonly labelToUse = computed(() => {
		return this.label()?.trim() ?? '';
	})

	protected gaugeValue = computed(() => {
		return this.pool().percent * 100;
	});
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Combatant } from '@app/types/models';

@Injectable({
	providedIn: 'root',
})
export class CombatantService {
	private readonly http = inject(HttpClient);

	updateCombatantActive(id: number, available: boolean) {
		return this.http.patch<Combatant>(`/api/combatants/${id}`, {
			available,
		});
	}

	updateCombatantValue(
		id: number,
		{
			key,
			value,
			type,
		}: {
			key: 'resources' | 'surges';
			value: number;
			type: 'increase' | 'decrease';
		}
	) {
		return this.http.patch<Combatant>(`/api/combatants/${id}/${key}`, {
			type: type.toUpperCase(),
			value,
		});
	}
}

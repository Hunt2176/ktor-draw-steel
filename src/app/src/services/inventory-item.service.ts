import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InventoryItem } from '@app/types/models';

export interface ModifyRequest {
	modifyBy: number;
	type: 'INCREASE' | 'DECREASE';
}

@Injectable({
	providedIn: 'root',
})
export class InventoryItemService {
	private readonly http = inject(HttpClient);

	createInventoryItem(
		character: number,
		item: Pick<InventoryItem, 'name' | 'quantity'>
	) {
		const toSend = {
			character,
			...item,
		};

		return this.http.post<InventoryItem>('/api/inventoryItem', toSend);
	}

	modifyInventoryItemQuantity(id: number, request: ModifyRequest) {
		return this.http.patch<InventoryItem>(
			`/api/inventoryItem/${id}/modify/quantity`,
			request
		);
	}

	deleteInventoryItem(id: number) {
		return this.http.delete(`/api/inventoryItem/${id}`);
	}
}

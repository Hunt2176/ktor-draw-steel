import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DisplayEntry } from '@app/types/models';

@Injectable({
	providedIn: 'root',
})
export class DisplayEntryService {
	private readonly http = inject(HttpClient);

	createDisplayEntry(entry: Omit<DisplayEntry, 'id'>) {
		return this.http.post<DisplayEntry>('/api/displayEntry', entry);
	}

	deleteDisplayEntry(id: number) {
		return this.http.delete(`/api/displayEntry/${id}`);
	}
}

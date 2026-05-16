import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
	providedIn: 'root',
})
export class FileService {
	private readonly http = inject(HttpClient);

	listFiles() {
		return this.http.get<{ files: string[] }>('/files');
	}

	uploadFile(file: File) {
		const formData = new FormData();
		formData.append('file', file);

		return this.http.post<{ fileName: string }>('/files', formData);
	}
}

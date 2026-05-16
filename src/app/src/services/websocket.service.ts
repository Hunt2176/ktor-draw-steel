import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject, filter } from 'rxjs';

export interface SocketUpdate {
	changeType: 'Created' | 'Updated' | 'Removed';
	campaignId: number;
	entityType: string | null;
	dataId: number | null;
	data: unknown | null;
}

@Injectable({
	providedIn: 'root',
})
export class WebSocketService {
	private socket: WebSocket | null = null;
	private currentCampaignId: number | null = null;
	private readonly messageSubject = new Subject<SocketUpdate>();
	private readonly connectionStatusSubject = new BehaviorSubject<boolean>(false);

	public readonly message$ = this.messageSubject.asObservable();
	public readonly isConnected$ = this.connectionStatusSubject.asObservable();

	constructor() {
		// Auto-cleanup on destroy
		this.cleanupSocket = this.cleanupSocket.bind(this);
	}

	/**
	 * Connect to the WebSocket for a specific campaign
	 */
	connectToCampaign(campaignId: number): void {
		// If already connected to the same campaign, don't reconnect
		if (this.currentCampaignId === campaignId && this.socket?.readyState === WebSocket.OPEN) {
			return;
		}

		// Clean up existing connection
		if (this.socket) {
			this.socket.close();
		}

		this.currentCampaignId = campaignId;
		this.initializeSocket(campaignId);
	}

	/**
	 * Disconnect from the current WebSocket
	 */
	disconnect(): void {
		this.cleanupSocket();
	}

	/**
	 * Get updates for a specific campaign
	 */
	getCampaignUpdates(campaignId: number): Observable<SocketUpdate> {
		return this.message$.pipe(filter((msg) => msg.campaignId === campaignId));
	}

	private initializeSocket(campaignId: number): void {
		try {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${window.location.host}/watch/${campaignId}`;

			this.socket = new WebSocket(wsUrl);

			this.socket.addEventListener('open', () => {
				this.connectionStatusSubject.next(true);
				console.log(`WebSocket connected to campaign ${campaignId}`);
			});

			this.socket.addEventListener('message', (event) => {
				try {
					const update = JSON.parse(event.data) as SocketUpdate;
					this.messageSubject.next(update);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			});

			this.socket.addEventListener('error', (event) => {
				console.error('WebSocket error:', event);
				this.connectionStatusSubject.next(false);
			});

			this.socket.addEventListener('close', () => {
				this.connectionStatusSubject.next(false);
				console.log(`WebSocket disconnected from campaign ${campaignId}`);
				this.socket = null;
			});
		} catch (error) {
			console.error('Failed to initialize WebSocket:', error);
			this.connectionStatusSubject.next(false);
		}
	}

	private cleanupSocket(): void {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
		this.currentCampaignId = null;
		this.connectionStatusSubject.next(false);
	}
}

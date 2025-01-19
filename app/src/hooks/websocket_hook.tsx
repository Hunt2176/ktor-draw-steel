import { useEffect, useState } from "react";

export function useWebSocket(url: string | URL | undefined): WebSocketState {
	const [wsState, setWsState] = useState<WebSocketState>({readyState: undefined, sendMessage: () => {}});
	
	function updateWebSocketState(socket?: WebSocket, message?: string | null) {
		const deadEndSend = () => {
			throw new Error("WebSocket not connected");
		}
		
		if (socket == null) {
			setWsState({
				sendMessage: deadEndSend
			});
			
			return;
		}
		
		setWsState({
			readyState: socket.readyState,
			sendMessage: socket.readyState == WebSocket.OPEN
				? (message) => socket.send(message)
				: deadEndSend,
			lastMessage: message === null ? undefined : message ?? wsState.lastMessage
		});
	}
	
	useEffect(() => {
		if (url == null) {
			return;
		}
		
		const socket = new WebSocket(url!);
		socket.onmessage = (ev) => {
			updateWebSocketState(socket, ev.data);
		}
		socket.onopen = () => {
			updateWebSocketState(socket);
		}
		socket.onclose = () => {
			updateWebSocketState(socket);
		}
		return () => {
			socket.close();
		}
	}, [url]);
	
	return wsState;
}

type WebSocketSendValue = Parameters<typeof WebSocket.prototype.send>[0];
export interface WebSocketState {
	readyState?: number;
	sendMessage: (message: WebSocketSendValue) => void;
	lastMessage?: string;
}
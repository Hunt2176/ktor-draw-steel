import { useWebSocket } from "src/hooks/websocket_hook.tsx";

export function SocketTest() {
	const socketState = useWebSocket("/campaigns/2");
	
	function fmt() {
		const msg = socketState.lastMessage;
		if (msg == null) {
			return undefined;
		}
		
		try {
			const data = JSON.parse(msg);
			return JSON.stringify(data, null, 2);
		} catch (e) {
			return `ERROR: ${e}`;
		}
	}
	
	return (
		<>
			<div>
				{
					socketState.readyState == WebSocket.OPEN
						? <span>Connected</span>
						: <span>Not connected</span>
				}
			</div>
			<div>
				<code>
					{fmt() ?? 'Waiting for event...'}
				</code>
			</div>
		</>
	);
}
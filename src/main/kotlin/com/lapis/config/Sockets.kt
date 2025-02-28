package com.lapis.config

import com.lapis.services.SocketService
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlin.time.Duration.Companion.seconds

fun Application.configureSockets()
{
	install(WebSockets) {
		pingPeriod = 15.seconds
		timeout = 15.seconds
		maxFrameSize = Long.MAX_VALUE
		masking = false
	}
	
	val socketService = getKoinApplication().koin.get<SocketService>()
	
	routing {
		val endPoint = "/watch/{id}"
		
		webSocket(endPoint) {
			val id = call.parameters["id"]?.toIntOrNull()
			if (id == null) {
				close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "The id of the entity is invalid"))
				return@webSocket
			}
			
			socketService.addConnection(id, this@webSocket)
		}
	}
}

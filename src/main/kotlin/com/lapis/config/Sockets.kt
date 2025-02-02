package com.lapis.config

import com.lapis.database.base.toCamelCase
import com.lapis.services.base.SocketService
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
	
	val socketServices = getKoinApplication().koin.getAll<SocketService<*>>()
	
	routing {
		socketServices.forEach {
			val tableName = it.typeEntity.table.tableName.toCamelCase()
			val endPoint = "/watch/$tableName/{id}"
			
			webSocket(endPoint) {
				val id = call.parameters["id"]?.toIntOrNull()
				if (id == null) {
					close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "The id of the entity is invalid"))
					return@webSocket
				}
				it.addConnection(id, this@webSocket)
			}
		}
	}
}

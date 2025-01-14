package com.lapis.config

import com.lapis.database.ExposedCampaign
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.transactions.transaction
import kotlin.time.Duration.Companion.seconds

fun Application.configureSockets()
{
	install(WebSockets) {
		pingPeriod = 15.seconds
		timeout = 15.seconds
		maxFrameSize = Long.MAX_VALUE
		masking = false
	}
	routing {
		webSocket("/ws") { // websocketSession
			for (frame in incoming)
			{
				if (frame is Frame.Text)
				{
					val text = frame.readText()
					outgoing.send(Frame.Text("YOU SAID: $text"))
					if (text.equals("bye", ignoreCase = true))
					{
						close(CloseReason(CloseReason.Codes.NORMAL, "Client said BYE"))
					}
				}
			}
		}
		webSocket("/campaigns") {
			for (frame in incoming)
			{
				if (frame is Frame.Text)
				{
					val text = frame.readText()
					if (text == "next") {
						val c = transaction {
							ExposedCampaign.all().map { it.toDTO() }
							
						}
						val str = Json.encodeToString(c)
						outgoing.send(Frame.Text(str))
					}
					else if (text == "bye")
					{
						close(CloseReason(CloseReason.Codes.NORMAL, "Client said BYE"))
					}
				}
			}
		}
	}
}

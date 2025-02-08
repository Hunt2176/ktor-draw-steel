package com.lapis.config

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.autohead.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.resources.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File

fun Application.configureRouting()
{
	install(AutoHeadResponse)
	install(Resources)
	install(StatusPages) {
		exception<Throwable> { call, cause ->
			call.respondText(text = "500: $cause", status = HttpStatusCode.InternalServerError)
		}
	}
	
	setupFileHandling()
	
	routing {
		staticResources("/static", "static")
		
		staticFiles("/files", File("files"))
		
		singlePageApplication {
			useResources = true
			applicationRoute = "/"
			filesPath = "static/app"
			defaultPage = "index.html"
		}
	}
}

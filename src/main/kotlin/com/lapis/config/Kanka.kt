package com.lapis.config

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.util.*

const val KANKA_API_BASE = "https://api.kanka.io/1.0"

fun Application.setupKankaRouting()
{
	val apiKey = environment.config.propertyOrNull("kanka.api_key")?.getString()
	
	val kankaClient = HttpClient(CIO) {
		install(Logging)
		expectSuccess = true
	}
	
	routing {
		get("/kanka/{...}") {
			if (apiKey == null) {
				call.respondText("Kanka integration is disabled", status = io.ktor.http.HttpStatusCode.ServiceUnavailable)
				return@get
			}
			
			val path = call.request.uri.removePrefix("/kanka")
			val apiPath = "${KANKA_API_BASE}$path"
			val apiResponse = kankaClient.get(apiPath) {
				headers {
					contentType(ContentType.Application.Json)
					bearerAuth(apiKey)
				}
			}
			
			val apiBytes = apiResponse.readRawBytes()
			call.response.headers.apply {
				apiResponse.headers
					.filter { key, _ -> key.startsWith("X-") }
					.forEach { key, values ->
						values.forEach { value ->
							append(key, value)
						}
					}
			}
			call.respondBytes(apiBytes, contentType = apiResponse.contentType(), status = apiResponse.status)
		}
	}
	
	if (apiKey == null) {
		kankaClient.close()
	}
}
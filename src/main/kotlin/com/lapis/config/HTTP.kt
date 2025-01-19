package com.lapis.config

import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.compression.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.partialcontent.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

fun Application.configureHTTP()
{
	val jsonBuilder = Json {
		ignoreUnknownKeys = true
		isLenient = true
	}
	
	getKoinModule().single { jsonBuilder }
	
	install(ContentNegotiation) {
		json(json = jsonBuilder)
	}
	install(Compression)
	install(DefaultHeaders) {
		header("X-Engine", "Ktor") // will send this header with each response
	}
	install(PartialContent) {
		// Maximum number of ranges that will be accepted from a HTTP request.
		// If the HTTP request specifies more ranges, they will all be merged into a single range.
		maxRangeCount = 10
	}
	
	val p = createRouteScopedPlugin("ErrorToJson") {
		onCallRespond { call ->
			val needsJsonResp = call.request.headers.getAll(HttpHeaders.Accept)?.contains(ContentType.Application.Json.toString()) != true
			val isError = call.response.status()?.isSuccess() == false
			
			if (needsJsonResp || !isError) {
				return@onCallRespond
			}
			
			transformBody { body ->
				if (body !is String) {
					body
				}
				else {
					val resp = mapOf("error" to body)
					val jResp = jsonBuilder.encodeToString(resp)
					jResp
				}
			}
		}
	}
	
	install(p)
}

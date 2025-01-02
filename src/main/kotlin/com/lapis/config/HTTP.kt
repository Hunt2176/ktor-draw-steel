package com.lapis.config

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.compression.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.partialcontent.*
import kotlinx.serialization.json.Json

fun Application.configureHTTP()
{
	install(ContentNegotiation) {
		json(json = Json {
			ignoreUnknownKeys = true
			isLenient = true
		})
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
}

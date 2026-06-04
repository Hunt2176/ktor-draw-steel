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
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.Instant
import kotlinx.datetime.plus

const val KANKA_API_BASE = "https://api.kanka.io/1.0"

fun Application.setupKankaRouting()
{
	val apiKey = environment.config.propertyOrNull("kanka.api_key")?.getString()
	val cacheDelay = environment.config.propertyOrNull("kanka.cache_delay")?.getString()?.toLongOrNull() ?: 60L
	
	val kankaClient = HttpClient(CIO) {
		install(Logging)
		expectSuccess = true
	}
	
	val cache = mutableMapOf<String, CacheEntry>()
	
	routing {
		get("/kanka/{...}") {
			if (apiKey == null) {
				call.respondText("Kanka integration is disabled", status = HttpStatusCode.ServiceUnavailable)
				return@get
			}
			
			val path = call.request.uri.removePrefix("/kanka")
			val apiPath = "${KANKA_API_BASE}$path"
			
			call.response.headers.append("X-Cache-Delay", cacheDelay.toString())
			
			val cachedEntry = cache[apiPath]
			if (!(cachedEntry == null || cachedEntry.date.plus(cacheDelay, DateTimeUnit.SECOND) < Clock.System.now())) {
				call.response.headers.append("X-Cache-Hit", "true")
				call.response.headers.append("X-Cache-Date", cachedEntry.date.toString())
				call.respondBytes(cachedEntry.data, contentType = ContentType.Application.Json)
				return@get
			}
			
			val apiResponse = kankaClient.get(apiPath) {
				headers {
					contentType(ContentType.Application.Json)
					bearerAuth(apiKey)
				}
			}
			
			val apiBytes = apiResponse.readRawBytes()
			
			if (apiResponse.status.isSuccess()) {
				cache[apiPath] = CacheEntry(
					Clock.System.now(),
					apiBytes
				)
			}
			else {
				cache.remove(apiPath)
			}
			
			call.response.headers.apply {
				append("X-Cache-Hit", "false")
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

data class CacheEntry(val date: Instant, val data: ByteArray)
{
	override fun equals(other: Any?): Boolean
	{
		if (this === other) return true
		if (javaClass != other?.javaClass) return false
		
		other as CacheEntry
		
		if (date != other.date) return false
		if (!data.contentEquals(other.data)) return false
		
		return true
	}
	
	override fun hashCode(): Int
	{
		var result = date.hashCode()
		result = 31 * result + data.contentHashCode()
		return result
	}
}
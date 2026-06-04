package com.lapis.config

import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.utils.io.jvm.javaio.*
import kotlinx.serialization.Serializable
import java.io.File
import java.util.*

fun Application.setupFileHandling() {
	
	routing {
		get("/files") {
			val files = File("files").listFiles()?.map { it.name } ?: emptyList()
			call.respond(FileQueryResponse(files))
		}
		
		post("/files") {
			val guid = UUID.randomUUID().toString()
			val multipart = call.receiveMultipart()
			
			var file: File? = null
			var fileName = ""
			
			multipart.forEachPart { part ->
				if (part is PartData.FileItem) {
					val originalFileName = part.originalFileName
					if (originalFileName != null) {
						val ext = File(originalFileName).extension
						fileName = "$guid.$ext"
					}
					
					file = File("files/$fileName")
					
					part.provider().toInputStream().use { input ->
						val lFile = file ?: return@use
						
						lFile.outputStream().use { output ->
							input.copyTo(output)
						}
					}
				}
				
				part.dispose()
			}
			
			val lFile = file
			if (lFile == null || !lFile.exists()) {
				call.respond(HttpStatusCode.InternalServerError)
				return@post
			}
			
			call.respond(FileUploadResponse(fileName))
		}
	}
}

@Serializable
private data class FileQueryResponse(
	val files: Collection<String>
)

@Serializable
private data class FileUploadResponse(
	val fileName: String
)
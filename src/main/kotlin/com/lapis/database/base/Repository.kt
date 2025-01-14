package com.lapis.database.base

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

class BaseRepositoryEntityMapper<EType: Entity<Int>>(
	val toDTO: EType.() -> Any = { this },
	val fromJson: EType.(JsonObject) -> Unit
)

open class BaseRepository<EType: Entity<Int>, ECType: EntityClass<Int, EType>> (
	private val entityClass: ECType,
	val database: Database,
	private val mapper: BaseRepositoryEntityMapper<EType>
)
{
	init {
		transaction(database) {
			SchemaUtils.create(entityClass.table)
		}
	}
	
	open fun Route.customizeRoute(baseRoute: Route) {
		// Override this method to add custom routes
	}
	
	internal fun registerRoutes(baseRoute: Route) {
		val name = entityClass.table.tableName.toCamelCase()
		baseRoute.route("/$name") {
			
			patch("/{id}") {
				val id = call.parameters["id"]?.toIntOrNull()
				if (id == null) {
					call.respond(HttpStatusCode.BadRequest, "Invalid ID")
					return@patch
				}
				
				val requestBody = call.receiveText()
				val jsonBody = Json.parseToJsonElement(requestBody).jsonObject
				
				val res = transaction {
					entityClass.findByIdAndUpdate(id) {
						mapper.fromJson(it, jsonBody)
					}?.let { mapper.toDTO(it) }
				}
				
				if (res == null) {
					call.respond(HttpStatusCode.NotFound, "Entity not found")
				} else {
					call.respond(HttpStatusCode.OK, res)
				}
			}
			post {
				val requestBody = call.receiveText()
				val jsonBody = Json.parseToJsonElement(requestBody).jsonObject
				
				val toReturn = transaction {
					val obj = entityClass.new {
						mapper.fromJson(this, jsonBody)
					}
					
					return@transaction mapper.toDTO(obj)
				}
				
				call.respond(HttpStatusCode.Created, toReturn)
			}
			
			get {
				val res = transaction(database) {
					entityClass.all().map {
						mapper.toDTO(it)
					}
				}
				
				call.respond(HttpStatusCode.OK, res)
			}
			
			get("/{id}") {
				val id = call.parameters["id"]?.toIntOrNull()
				if (id == null) {
					call.respond(HttpStatusCode.BadRequest, "Invalid ID")
					return@get
				}
				
				val res = transaction {
					entityClass.findById(id)?.run {
						mapper.toDTO(this)
					}
				}
				
				if (res == null) {
					call.respond(HttpStatusCode.NotFound, "Entity not found")
				} else {
					call.respond(HttpStatusCode.OK, res)
				}
			}
			
			delete("/{id}") {
				val id = call.parameters["id"]?.toIntOrNull()
				if (id == null) {
					call.respond(HttpStatusCode.BadRequest, "Invalid ID")
					return@delete
				}
				
				val res = transaction {
					entityClass.findById(id)?.delete()
				}
				
				if (res == null) {
					call.respond(HttpStatusCode.NotFound, "Entity not found")
				} else {
					call.respond(HttpStatusCode.OK, "Entity deleted")
				}
			}
			
			customizeRoute(this)
		}
	}
}

fun String.toCamelCase(): String {
	return this
		.split(" ", "_", "-") // Split by spaces, underscores, or hyphens
		.filter { it.isNotEmpty() } // Remove empty strings
		.mapIndexed { index, word ->
			if (index == 0) {
				word.replaceFirstChar { it.lowercase() } // Lowercase the first word's first character
			} else {
				word.replaceFirstChar { it.uppercase() } // Capitalize the first letter of subsequent words
			}
		}
		.joinToString("") // Combine into a single string
}
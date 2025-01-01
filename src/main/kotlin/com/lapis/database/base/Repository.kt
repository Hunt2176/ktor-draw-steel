package com.lapis.database.base

import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

open class BaseRepository<EType: Entity<Int>, ECType: EntityClass<Int, EType>> (
	private val entityClass: ECType,
	val database: Database,
	val toDTO: EType.() -> Any
)
{
	init {
		transaction(database) {
			SchemaUtils.create(entityClass.table)
		}
	}
	
	fun registerRoutes(baseRoute: Route) {
		val name = entityClass.table.tableName.toCamelCase()
		baseRoute.route("/$name") {
			get {
				val res = transaction(database) {
					entityClass.all().map { it.toDTO() }
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
					entityClass.findById(id)?.toDTO()
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
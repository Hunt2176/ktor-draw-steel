package com.lapis.database.base

import com.lapis.annotations.AllOpen
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Deferred
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.Transaction
import org.jetbrains.exposed.sql.transactions.experimental.suspendedTransactionAsync
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.transactions.transactionManager

class BaseRepositoryEntityMapper<EType: Entity<Int>>(
	val toDTO: EType.() -> Any = { this },
	val fromJson: EType.(JsonObject) -> Unit
)

@AllOpen
class BaseRepository<EType: Entity<Int>, ECType: EntityClass<Int, EType>> (
	private val entityClass: ECType,
	override val database: Database,
	private val mapper: BaseRepositoryEntityMapper<EType>
) : ScopedTransactionProvider
{
	init {
		setup()
	}
	
	private final fun setup() {
		transaction {
			SchemaUtils.create(entityClass.table)
			val statements = SchemaUtils.addMissingColumnsStatements(entityClass.table)
			if (statements.isEmpty()) {
				return@transaction
			}
			else {
				statements.forEach {
					exec(it)
				}
			}
		}
	}
	
	fun fetchById(id: Int): EType? {
		return transaction {
			entityClass.findById(id)
		}
	}
	
	fun RoutingContext.fetchById(): EType? {
		return transaction {
			val id = call.parameters["id"]?.toIntOrNull()
			if (id == null) {
				null
			}
			else {
				entityClass.findById(id)
			}
		}
	}
	
	fun Route.additionalRouteSetup() {
		// Override this method to add custom routes
	}
	
	fun Route.getRoot() {
		get {
			val res = transaction(database) {
				entityClass.all().map {
					mapper.toDTO(it)
				}
			}
			
			call.respond(HttpStatusCode.OK, res)
		}
	}
	
	fun Route.getById() {
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
	}
	
	fun Route.deleteById() {
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
	
	fun Route.postJson() {
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
	}
	
	fun Route.patchEntity() {
		patch("/{id}") {
			val id = call.parameters["id"]?.toIntOrNull()
			if (id == null) {
				call.respond(HttpStatusCode.BadRequest, "Invalid ID")
			}
			else {
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
			
		}
	}
	
	protected fun Route.createValueModificationRoute(type: String, onCall: suspend (item: EType, req: ValueModificationRequest) -> Unit) {
		patch("/{id}/modify/$type") {
			asyncTransaction {
				val e = fetchById()
				val req = call.receive<ValueModificationRequest>()
				if (e == null) {
					call.respond(HttpStatusCode.NotFound, "Entity not found")
				}
				else {
					onCall(e, req)
					
					val dto = mapper.toDTO(e)
					call.respond(dto)
				}
			}.await()
		}
	}
	
	internal fun registerRoutes(baseRoute: Route) {
		val name = entityClass.table.tableName.toCamelCase()
		baseRoute.route("/$name") {
			getRoot()
			getById()
			deleteById()
			postJson()
			patchEntity()
			additionalRouteSetup()
		}
	}
	
	@Serializable
	protected data class ValueModificationRequest(
		val modifyBy: Int,
		val type: Type
	) {
		enum class Type {
			INCREASE,
			DECREASE
		}
	}
}

interface ScopedTransactionProvider {
	val database : Database
	fun <T> transaction(statement: Transaction.() -> T): T =
		transaction(
			database.transactionManager.defaultIsolationLevel,
			database.transactionManager.defaultReadOnly,
			database,
			statement
		)
	
	suspend fun <T> asyncTransaction(statement: suspend Transaction.() -> T): Deferred<T> =
		suspendedTransactionAsync(
			db = database,
			transactionIsolation = database.transactionManager.defaultIsolationLevel,
			readOnly = database.transactionManager.defaultReadOnly,
			statement = statement
		)
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
package com.lapis.services.base

import com.lapis.database.base.ScopedTransactionProvider
import io.ktor.util.logging.*
import io.ktor.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityChange
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.sql.Database
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.slf4j.LoggerFactory

abstract class SocketService<EntityType : Entity<Int>> : KoinComponent, ScopedTransactionProvider
{
	protected open val logger: Logger = LoggerFactory.getLogger(this::class.java)
	
	/**
	 * Returns the id of the entity to broadcast an update for, or null if no update is needed
	 */
	protected abstract fun getEntityIdsToUpdate(event: EntityChange): Collection<Int>
	protected abstract fun toJsonObject(entity: EntityType): JsonObject?
	
	abstract val typeEntity: EntityClass<Int, EntityType>
	
	override val database by inject<Database>()
	
	protected open val context = Dispatchers.Default
	
	protected open val json by inject<Json>()
	
	private val activeConnections = hashMapOf<Int, HashSet<DefaultWebSocketSession>>()
	
	protected open fun getEntityFromId(id: Int): EntityType? {
		return transaction {
			typeEntity.findById(id)
		}
	}
	
	suspend fun addConnection(trackingId: Int, session: DefaultWebSocketSession) {
		val fn = transaction {
			val entity = getEntityFromId(trackingId)
			if (entity == null) {
				suspend {
					session.close(CloseReason(CloseReason.Codes.VIOLATED_POLICY,
						"Entity $trackingId not found in ${typeEntity::class.simpleName}")
					)
				}
			}
			else {
				suspend {
					synchronized(activeConnections) {
						activeConnections.getOrPut(trackingId) { hashSetOf() }.add(session)
					}
					session.closeReason.await()
					synchronized(activeConnections) {
						activeConnections[trackingId]?.remove(session)
					}
				}
			}
			
		}
		
		fn.invoke()
	}
	
	fun updateFromEntityChange(event: EntityChange): Job
	{
		val job = Job()
		val activityScope = CoroutineScope(job + context)
		
		val ids = mutableListOf<Int>()
		
		try {
			ids.addAll(getEntityIdsToUpdate(event))
		} catch (e: Exception) {
			logger.error(e)
			job.completeExceptionally(e)
			
			return job
		}
		
		if (ids.isEmpty()) {
			return job.apply { complete() }
		}
		
		return activityScope.launch {
			ids.forEach { id ->
				sendUpdate(id)
			}
		}
	}
	
	private suspend fun sendUpdate(entityId: Int) {
		val sockets: Set<DefaultWebSocketSession>
		val jsonStr: String
		
		synchronized(activeConnections) {
			val foundSockets = activeConnections[entityId]
			if (foundSockets?.isEmpty() != false) {
				return
			}
			
			// Copy sockets so we can iterate later without being synchronized
			sockets = HashSet(foundSockets)
			
			val jsonObj = transaction {
				getEntityFromId(entityId)?.let { toJsonObject(it) }
			}
			
			if (jsonObj == null) {
				return
			}
			
			jsonStr = json.encodeToString(jsonObj)
		}
		
		sockets.forEach { socket ->
			socket.send(jsonStr)
		}
	}
}
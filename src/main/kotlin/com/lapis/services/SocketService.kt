package com.lapis.services

import com.lapis.database.*
import com.lapis.database.base.ScopedTransactionProvider
import io.ktor.util.logging.*
import io.ktor.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.encodeToJsonElement
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityChange
import org.jetbrains.exposed.dao.EntityChangeType
import org.jetbrains.exposed.dao.toEntity
import org.jetbrains.exposed.sql.Database
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.slf4j.LoggerFactory

class SocketService : KoinComponent, ScopedTransactionProvider
{
	private val logger: Logger = LoggerFactory.getLogger(this::class.java)
	
	override val database by inject<Database>()
	
	val json by inject<Json>()
	
	private val activeConnections = hashMapOf<Int, HashSet<DefaultWebSocketSession>>()
	
	suspend fun addConnection(campaignId: Int, session: DefaultWebSocketSession) {
		val fn = transaction {
			val campaign = getCampaign(campaignId)
			if (campaign == null) {
				suspend {
					session.close(CloseReason(CloseReason.Codes.VIOLATED_POLICY,
						"Campaign $campaignId not found.")
					)
				}
			}
			else {
				suspend {
					synchronized(activeConnections) {
						activeConnections.getOrPut(campaignId) { hashSetOf() }.add(session)
					}
					session.closeReason.await()
					synchronized(activeConnections) {
						activeConnections[campaignId]?.remove(session)
					}
				}
			}
			
		}
		
		fn.invoke()
	}
	
	fun updateFromEntityChange(event: EntityChange): Job
	{
		val job = Job()
		val activityScope = CoroutineScope(job + Dispatchers.Default)
		
		try {
			val update = createUpdateFromEntityChange(event) ?: return job.apply { complete() }
			
			return activityScope.launch {
				sendUpdate(update)
			}
			
		} catch (e: Throwable) {
			logger.error("Error sending socket update", e)
			return job.apply { completeExceptionally(e) }
		}
	}
	
	private fun createUpdateFromEntityChange(event: EntityChange): CampaignSocketUpdate? = transaction {
		val entity = event.toEntity<Int, Entity<Int>>() ?: return@transaction null
		
		val res: SocketServiceMatchResult
		when (entity) {
			is ExposedDisplayEntry -> {
				res = SocketServiceMatchResult(
					campaignId = entity.campaign.id.value,
					value = json.encodeToJsonElement(entity.toDTO())
				)
			}
			is ExposedCampaign -> {
				res = SocketServiceMatchResult(
					campaignId = entity.id.value,
					value = json.encodeToJsonElement(entity.toDTO())
				)
			}
			is ExposedCharacter -> {
				res = SocketServiceMatchResult(
					campaignId = entity.campaign.id.value,
					value = json.encodeToJsonElement(entity.toDTO())
				)
			}
			is ExposedCharacterCondition -> {
				res = SocketServiceMatchResult(
					campaignId = entity.character.campaign.id.value,
					value = json.encodeToJsonElement(entity.toDTO())
				)
			}
			is ExposedCombat -> {
				res = SocketServiceMatchResult(
					campaignId = entity.campaign.id.value,
					value = json.encodeToJsonElement(entity.toDTO())
				)
			}
			is ExposedCombatant -> {
				res = SocketServiceMatchResult(
					campaignId = entity.combat.campaign.id.value,
					value = json.encodeToJsonElement(entity.toDTO())
				)
			}
			else -> return@transaction null
		}
		
		return@transaction CampaignSocketUpdate(
			changeType = event.changeType,
			campaignId = res.campaignId,
			dataId = entity.id.value,
			entityType = entity::class.simpleName,
			data = res.value
		)
	}
	
	private fun getCampaign(id: Int): ExposedCampaign? = transaction {
		ExposedCampaign.findById(id)
	}
	
	private suspend fun sendUpdate(update: CampaignSocketUpdate) {
		val sockets: Set<DefaultWebSocketSession>
		val jsonStr: String
		
		synchronized(activeConnections) {
			val foundSockets = activeConnections[update.campaignId]
			if (foundSockets?.isEmpty() != false) {
				return
			}
			
			// Copy sockets so we can iterate later without being synchronized
			sockets = HashSet(foundSockets)
			
			jsonStr = json.encodeToString(update)
		}
		
		sockets.forEach { socket ->
			socket.send(jsonStr)
		}
	}
}

private data class SocketServiceMatchResult(
	val campaignId: Int,
	val value: JsonElement
)

@Serializable
data class CampaignSocketUpdate(
	val changeType: EntityChangeType,
	val campaignId: Int,
	val entityType: String?,
	val dataId: Int?,
	val data: JsonElement?
)
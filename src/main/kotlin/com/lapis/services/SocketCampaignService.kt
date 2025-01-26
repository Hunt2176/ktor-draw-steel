package com.lapis.services

import com.lapis.database.*
import com.lapis.database.base.ScopedTransactionProvider
import io.ktor.websocket.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.dao.EntityChange
import org.jetbrains.exposed.dao.EntityChangeType
import org.jetbrains.exposed.sql.Database
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

class SocketCampaignService : KoinComponent, ScopedTransactionProvider
{
	override val database by inject<Database>()
	private val context = Dispatchers.Default
	
	private val json by inject<Json>()
	private val campaignRepo by inject<CampaignRepository>()
	
	private val campaignConnections = hashMapOf<Int, HashSet<DefaultWebSocketSession>>()
	
	private val transactionProvider = object : ScopedTransactionProvider {
		override val database: Database
			get() = this@SocketCampaignService.database
	}
	
	suspend fun addConnection(campaignId: Int, session: DefaultWebSocketSession) {
		val fn = transactionProvider.transaction {
			val campaign = ExposedCampaign.find { Campaigns.id eq campaignId }.firstOrNull()
			if (campaign == null) {
				suspend {
					session.close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Campaign not found"))
				}
			}
			else {
				suspend {
					synchronized(campaignConnections) {
						campaignConnections.getOrPut(campaignId) { hashSetOf() }.add(session)
					}
					session.closeReason.await()
					synchronized(campaignConnections) {
						campaignConnections[campaignId]?.remove(session)
					}
				}
			}
			
		}
		
		fn.invoke()
	}
	
	suspend fun sendCampaignUpdate(campaignId: Int) {
		val sockets: Set<DefaultWebSocketSession>
		val jsonStr: String
		
		synchronized(campaignConnections) {
			val foundSockets = campaignConnections[campaignId]
			if (foundSockets?.isEmpty() != false) {
				return
			}
			
			// Copy sockets so we can iterate later without being synchronized
			sockets = HashSet(foundSockets)
			
			val list = campaignRepo.getCampaignDetails(listOf(campaignId))
			if (list.isEmpty()) {
				return
			}
			
			val campaignDetail = list.first()
			jsonStr = json.encodeToString(campaignDetail)
		}
		
		sockets.forEach { socket ->
			socket.send(jsonStr)
		}
	}
	
	fun updateFromEntityChange(event: EntityChange, id: Int): Job {
		val job = Job()
		return CoroutineScope(job + context).launch {
			when (event.changeType) {
				EntityChangeType.Updated -> {
					val tableType = event.entityClass.table
					
					when (tableType) {
						Campaigns -> {
							sendCampaignUpdate(id)
						}
						Combats -> {
							val campaignId = transactionProvider.transaction {
								ExposedCombat.findById(id)?.campaign?.id?.value
							}
							if (campaignId == null) {
								return@launch
							}
							
							sendCampaignUpdate(campaignId)
						}
						Characters -> {
							val campaignId = transactionProvider.transaction {
								ExposedCharacter.findById(id)?.campaign?.id?.value
							}
							
							if (campaignId == null) {
								return@launch
							}
							
							sendCampaignUpdate(campaignId)
						}
					}
				}
				else -> {}
			}
		}
		
	}
}
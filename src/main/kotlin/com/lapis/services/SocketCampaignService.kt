package com.lapis.services

import com.lapis.database.CampaignRepository
import com.lapis.database.ExposedCampaign
import com.lapis.database.ExposedCharacter
import com.lapis.database.ExposedCharacterCondition
import com.lapis.database.base.ScopedTransactionProvider
import com.lapis.services.base.SocketService
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityChange
import org.jetbrains.exposed.dao.toEntity
import org.koin.core.component.inject

class SocketCampaignService : SocketService<ExposedCampaign>(), ScopedTransactionProvider
{
	override val typeEntity = ExposedCampaign
	private val campaignRepo by inject<CampaignRepository>()
	
	override fun getEntityIdsToUpdate(event: EntityChange): Collection<Int> =
		transaction {
			val entity = event.toEntity<Int, Entity<Int>>()
			val ids = arrayListOf<Int>()
			
			when (entity) {
				is ExposedCampaign -> ids.add(entity.id.value)
				is ExposedCharacter, is ExposedCharacterCondition -> {
					val character = if (entity is ExposedCharacter) {
						entity
					} else {
						(entity as ExposedCharacterCondition).character
					}
					
					ids.add(character.campaign.id.value)
				}
			}
			
			ids
		}
	
	
	override fun toJsonObject(entity: ExposedCampaign): JsonObject?
	{
		val arr = campaignRepo.getCampaignDetails(listOf(entity.id.value))
		val obj = arr.firstOrNull()
		
		return obj?.jsonObject
	}
}
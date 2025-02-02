package com.lapis.services

import com.lapis.database.*
import com.lapis.services.base.SocketService
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.jsonObject
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityChange
import org.jetbrains.exposed.dao.toEntity

class SocketCombatService : SocketService<ExposedCombat>()
{
	override val typeEntity = ExposedCombat
	
	override suspend fun getEntityIdsToUpdate(event: EntityChange): List<Int> =
		transaction {
			val entity = event.toEntity<Int, Entity<Int>>()
			
			val ids = arrayListOf<Int>()
			when (entity) {
				is ExposedCombat -> ids.add(entity.id.value)
				is ExposedCombatant -> ids.add(entity.combat.id.value)
				is ExposedCharacter, is ExposedCharacterCondition -> {
					val character = if (entity is ExposedCharacter) {
						entity
					} else {
						(entity as ExposedCharacterCondition).character
					}
					
					ExposedCombatant.find { Combatants.character eq character.id }
						.forEach { ids.add(it.combat.id.value) }
				}
			}
			
			ids
		}
	
	override fun toJsonObject(entity: ExposedCombat): JsonObject?
	{
		return json.encodeToJsonElement(entity.toDTO()).jsonObject
	}
}
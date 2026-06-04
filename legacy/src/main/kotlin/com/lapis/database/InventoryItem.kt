package com.lapis.database

import com.lapis.database.HasExposedCharacter.Companion.deserializeExposedCharacter
import com.lapis.database.base.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.Database

class InventoryItemRepository(database: Database) : BaseRepository<ExposedInventoryItem, ExposedInventoryItem.Companion>(
	ExposedInventoryItem.Companion,
	database,
	BaseRepositoryEntityMapper(
		{ toDTO() },
		{ customizeFromJson(it) }
	)
) {
	override fun Route.additionalRouteSetup()
	{
		createValueModificationRoute("quantity") { item, req ->
			
			val newVal: Int = when (req.type) {
				ValueModificationRequest.Type.INCREASE -> {
					(item.quantity + req.modifyBy).coerceAtLeast(0);
				}
				
				ValueModificationRequest.Type.DECREASE -> {
					(item.quantity - req.modifyBy).coerceAtLeast(0)
				}
			}
			
			item.quantity = newVal
		}
	}
}

object InventoryItem : IntIdTable(), HasName, HasCharacter
{
	override val name = text("name")
	override val character = HasCharacter.createField(this)
	
	val quantity = integer("quantity").check { it.greaterEq(0) }
}

class ExposedInventoryItem(id: EntityID<Int>) : IntEntity(id), HasExposedCharacter, HasDTO<InventoryItemDTO>, FromJson<ExposedInventoryItem> {
	companion object : IntEntityClass<ExposedInventoryItem>(InventoryItem)
	
	var name by InventoryItem.name
	var quantity by InventoryItem.quantity
	
	override var character by ExposedCharacter referencedOn InventoryItem.character
	
	
	override fun toDTO(): InventoryItemDTO
	{
		return InventoryItemDTO.fromEntity(this)
	}
	
	override fun ExposedInventoryItem.customizeFromJson(json: JsonObject)
	{
		json["name"]?.jsonPrimitive?.content?.let { name = it }
		json["quantity"]?.jsonPrimitive?.intOrNull?.let { quantity = it.coerceAtLeast(0) }
		deserializeExposedCharacter(json)
	}
}

@Serializable
data class InventoryItemDTO(
	val id: Int,
	val name: String,
	val characterId: Int,
	val quantity: Int
) {
	companion object {
		fun fromEntity(entity: ExposedInventoryItem): InventoryItemDTO {
			return InventoryItemDTO(
				entity.id.value,
				entity.name,
				entity.character.id.value,
				entity.quantity
			)
		}
	}
}
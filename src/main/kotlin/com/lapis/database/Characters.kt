package com.lapis.database

import com.lapis.database.base.FromJson
import com.lapis.database.base.HasDTO
import com.lapis.database.base.HasName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

object Characters : IntIdTable(), HasName
{
	override val name = varchar("name", 255)
	
	val removedHp = integer("removed_hp").default(0)
	val maxHp = integer("max_hp").default(0)
	val temporaryHp = integer("temporary_hp").default(0)
	
	val recoveries = integer("recoveries").default(0)
	val maxRecoveries = integer("max_recoveries").default(0)
	
	val resources = integer("resources").default(0)
	val surges = integer("surges").default(0)
	val victories = integer("victories").default(0)
	
	val pictureUrl = varchar("picture_url", 255).nullable()
	val border = varchar("border", 255).nullable()
	
	val campaign = reference("campaign", Campaigns)
	val user = reference("user", Users,
		onDelete = ReferenceOption.CASCADE,
		onUpdate = ReferenceOption.CASCADE
	)
}

class ExposedCharacter(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<CharacterDTO>, FromJson<ExposedCharacter>
{
	companion object : EntityClass<Int, ExposedCharacter>(Characters)
	
	var name by Characters.name
	var removedHp by Characters.removedHp
	var maxHp by Characters.maxHp
	var temporaryHp by Characters.temporaryHp
	
	var recoveries by Characters.recoveries
	var maxRecoveries by Characters.maxRecoveries
	
	var resources by Characters.resources
	var surges by Characters.surges
	var victories by Characters.victories
	
	var pictureUrl by Characters.pictureUrl
	var border by Characters.border
	
	var campaign by ExposedCampaign referencedOn Characters.campaign
	var user by ExposedUser referencedOn Characters.user
	
	val conditions by ExposedCharacterCondition referrersOn CharacterConditions.character
	
	override fun toDTO(): CharacterDTO {
		return CharacterDTO.fromEntity(this)
	}
	
	override fun ExposedCharacter.customizeFromJson(json: JsonObject)
	{
		json["name"]?.jsonPrimitive?.content?.let { name = it }
		json["removedHp"]?.jsonPrimitive?.int?.let { removedHp = it }
		json["maxHp"]?.jsonPrimitive?.int?.let { maxHp = it }
		json["temporaryHp"]?.jsonPrimitive?.int?.let { temporaryHp = it }
		
		json["recoveries"]?.jsonPrimitive?.int?.let { recoveries = it }
		json["maxRecoveries"]?.jsonPrimitive?.int?.let { maxRecoveries = it }
		
		json["resources"]?.jsonPrimitive?.int?.let { resources = it }
		json["surges"]?.jsonPrimitive?.int?.let { surges = it }
		json["victories"]?.jsonPrimitive?.int?.let { victories = it }
		
		if (json.containsKey("pictureUrl")) json["pictureUrl"]?.jsonPrimitive?.contentOrNull?.let { pictureUrl = it }
		if (json.containsKey("border")) json["border"]?.jsonPrimitive?.contentOrNull?.let { border = it }
		
		json["campaign"]?.jsonPrimitive?.int?.let { campaign = ExposedCampaign.findById(it) ?: error("Campaign not found") }
		json["user"]?.jsonPrimitive?.int?.let { user = ExposedUser.findById(it) ?: error("User not found") }
	}
}

@Serializable
data class CharacterDTO (
	val id: Int,
	val name: String,
	val removedHp: Int,
	val maxHp: Int,
	val temporaryHp: Int,
	val recoveries: Int,
	val maxRecoveries: Int,
	val resources: Int,
	val surges: Int,
	val victories: Int,
	val campaign: Int,
	val user: Int,
	val pictureUrl: String?,
	val border: String?,
	val conditions: List<CharacterConditionDTO>
)
{
	companion object
	{
		fun fromEntity(entity: ExposedCharacter): CharacterDTO
		{
			return CharacterDTO(
				entity.id.value,
				entity.name,
				entity.removedHp,
				entity.maxHp,
				entity.temporaryHp,
				entity.recoveries,
				entity.maxRecoveries,
				entity.resources,
				entity.surges,
				entity.victories,
				entity.campaign.id.value,
				entity.user.id.value,
				entity.pictureUrl,
				entity.border,
				entity.conditions.map { it.toDTO() }
			)
		}
	}
}
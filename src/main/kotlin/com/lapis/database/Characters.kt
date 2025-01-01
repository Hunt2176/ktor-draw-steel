package com.lapis.database

import com.lapis.database.base.HasDTO
import com.lapis.database.base.HasName
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

object Characters : IntIdTable(), HasName
{
	override val name = varchar("name", 50)
	
	val removedHp = integer("removed_hp").default(0)
	val maxHp = integer("max_hp").default(0)
	val temporaryHp = integer("temporary_hp").default(0)
	
	val recoveries = integer("recoveries").default(0)
	val maxRecoveries = integer("max_recoveries").default(0)
	
	val resources = integer("resources").default(0)
	val surges = integer("surges").default(0)
	val victories = integer("victories").default(0)
	
	val campaign = reference("campaign", Campaigns)
	val user = reference("user", Users,
		onDelete = ReferenceOption.CASCADE,
		onUpdate = ReferenceOption.CASCADE
	)
}

class ExposedCharacter(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<CharacterDTO>
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
	
	var campaign by ExposedCampaign referencedOn Characters.campaign
	var user by ExposedUser referencedOn Characters.user
	
	val conditions by ExposedCharacterCondition referrersOn CharacterConditions.character
	
	override fun toDTO(): CharacterDTO {
		return CharacterDTO.fromEntity(this)
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
				entity.conditions.map { it.toDTO() }
			)
		}
	}
}
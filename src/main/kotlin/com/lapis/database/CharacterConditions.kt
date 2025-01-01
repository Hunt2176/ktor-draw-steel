package com.lapis.database

import com.lapis.database.base.HasDTO
import com.lapis.database.base.HasName
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.IntEntity
import org.jetbrains.exposed.dao.IntEntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

object CharacterConditions : IntIdTable(), HasName
{
	val character = reference("character", Characters,
		onDelete = ReferenceOption.CASCADE,
		onUpdate = ReferenceOption.CASCADE
	)
	
	override val name = varchar("name", 50)
	val endType = enumeration<EndType>("end_type")
}

class ExposedCharacterCondition(id: EntityID<Int>) : IntEntity(id), HasDTO<CharacterConditionDTO>
{
	companion object : IntEntityClass<ExposedCharacterCondition>(CharacterConditions)
	
	var character by ExposedCharacter referencedOn CharacterConditions.character
	var name by CharacterConditions.name
	var endType by CharacterConditions.endType
	
	override fun toDTO(): CharacterConditionDTO {
		return CharacterConditionDTO.fromEntity(this)
	}
}

@Serializable
data class CharacterConditionDTO(
	val id: Int,
	val character: Int,
	val name: String,
	val endType: EndType
) {
	companion object {
		fun fromEntity(entity: ExposedCharacterCondition): CharacterConditionDTO {
			return CharacterConditionDTO(
				entity.id.value,
				entity.character.id.value,
				entity.name,
				entity.endType
			)
		}
	}
}

@Serializable
enum class EndType {
	endOfTurn,
	save
}
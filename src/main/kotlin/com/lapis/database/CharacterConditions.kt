package com.lapis.database

import com.lapis.database.base.FromJson
import com.lapis.database.base.HasDTO
import com.lapis.database.base.HasName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
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

class ExposedCharacterCondition(id: EntityID<Int>) : IntEntity(id), HasDTO<CharacterConditionDTO>, FromJson<ExposedCharacterCondition>
{
	companion object : IntEntityClass<ExposedCharacterCondition>(CharacterConditions)
	
	var character by ExposedCharacter referencedOn CharacterConditions.character
	var name by CharacterConditions.name
	var endType by CharacterConditions.endType
	
	override fun toDTO(): CharacterConditionDTO {
		return CharacterConditionDTO.fromEntity(this)
	}
	
	override fun ExposedCharacterCondition.customizeFromJson(json: JsonObject)
	{
		json["endType"]?.jsonPrimitive?.content?.let { endType = EndType.valueOf(it) }
		json["name"]?.jsonPrimitive?.content?.let { name = it }
		
		json["character"]?.jsonPrimitive?.int?.let { character = ExposedCharacter.findById(it) ?: error("Character not found") }
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
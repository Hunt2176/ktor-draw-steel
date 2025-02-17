package com.lapis.database

import com.lapis.database.base.FromJson
import com.lapis.database.base.HasDTO
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

object Combatants : IntIdTable()
{
	val available = bool("available").default(true)
	val surges = integer("surges").default(0).check { it greaterEq 0 }
	val resources = integer("resources").default(0).check { it greaterEq 0 }
	
	val combat = reference("combat", Combats,
		onDelete = ReferenceOption.CASCADE,
		onUpdate = ReferenceOption.CASCADE
	)
	
	val character = reference("character", Characters,
		onDelete = ReferenceOption.CASCADE,
		onUpdate = ReferenceOption.CASCADE
	)
}

class ExposedCombatant(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<CombatantDTO>, FromJson<ExposedCombatant>
{
	companion object : EntityClass<Int, ExposedCombatant>(Combatants)
	
	var available by Combatants.available
	var surges by Combatants.surges
	var resources by Combatants.resources
	
	var combat by ExposedCombat referencedOn Combatants.combat
	var character by ExposedCharacter referencedOn Combatants.character
	
	override fun toDTO(): CombatantDTO
	{
		return CombatantDTO.fromEntity(this)
	}
	
	override fun ExposedCombatant.customizeFromJson(json: JsonObject)
	{
		json["available"]?.jsonPrimitive?.boolean?.let { available = it }
		json["surges"]?.jsonPrimitive?.int?.let { surges = it }
		json["resources"]?.jsonPrimitive?.int?.let { resources = it }
		json["combat"]?.jsonPrimitive?.int?.let { combat = ExposedCombat.findById(it) ?: error("Combat not found") }
		json["character"]?.jsonPrimitive?.int?.let { character = ExposedCharacter.findById(it) ?: error("Character not found") }
	}
}

@Serializable
data class CombatantDTO(
	val id: Int,
	val available: Boolean,
	val surges: Int,
	val resources: Int,
	val combat: Int,
	val character: CharacterDTO
)
{
	companion object
	{
		fun fromEntity(entity: ExposedCombatant): CombatantDTO
		{
			return CombatantDTO(
				entity.id.value,
				entity.available,
				entity.surges,
				entity.resources,
				entity.combat.id.value,
				entity.character.toDTO()
			)
		}
	}
}
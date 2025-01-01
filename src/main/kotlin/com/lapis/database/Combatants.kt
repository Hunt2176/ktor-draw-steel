package com.lapis.database

import com.lapis.database.base.HasDTO
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

object Combatants : IntIdTable()
{
	val available = bool("available").default(true)
	
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
) : Entity<Int>(id), HasDTO<CombatantDTO>
{
	companion object : EntityClass<Int, ExposedCombatant>(Combatants)
	
	var available by Combatants.available
	var combat by ExposedCombat referencedOn Combatants.combat
	var character by ExposedCharacter referencedOn Combatants.character
	
	override fun toDTO(): CombatantDTO
	{
		return CombatantDTO.fromEntity(this)
	}
}

@Serializable
data class CombatantDTO(
	val id: Int,
	val available: Boolean,
	val combat: Int,
	val character: CharacterDTO
)
{
	companion object
	{
		fun fromEntity(entity: ExposedCombatant): CombatantDTO
		{
			return CombatantDTO(entity.id.value, entity.available, entity.combat.id.value, entity.character.toDTO())
		}
	}
}
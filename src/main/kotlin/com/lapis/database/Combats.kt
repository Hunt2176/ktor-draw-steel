package com.lapis.database

import com.lapis.database.base.FromJson
import com.lapis.database.base.HasDTO
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

object Combats : IntIdTable()
{
	var round = integer("round").default(1).check { it greaterEq 1 }
	
	val campaign = reference("campaign", Campaigns, onDelete = ReferenceOption.CASCADE, onUpdate = ReferenceOption.CASCADE)
}

class ExposedCombat(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<CombatDTO>, FromJson<ExposedCombat>
{
	companion object : EntityClass<Int, ExposedCombat>(Combats)
	
	var round by Combats.round
	var campaign by ExposedCampaign referencedOn Combats.campaign
	
	val combatants by ExposedCombatant referrersOn Combatants.combat
	
	override fun toDTO(): CombatDTO
	{
		return CombatDTO.fromEntity(this)
	}
	
	override fun ExposedCombat.customizeFromJson(json: JsonObject)
	{
		json["round"]?.jsonPrimitive?.int?.let { round = it }
		json["campaign"]?.jsonPrimitive?.int?.let { campaign = ExposedCampaign.findById(it) ?: error("Campaign not found") }
	}
}

@Serializable
data class CombatDTO(
	val id: Int,
	val round: Int,
	val campaign: Int,
	val combatants: List<CombatantDTO>
)
{
	companion object
	{
		fun fromEntity(entity: ExposedCombat): CombatDTO
		{
			return CombatDTO(entity.id.value, entity.round, entity.campaign.id.value, entity.combatants.map { CombatantDTO.fromEntity(it) })
		}
	}
}
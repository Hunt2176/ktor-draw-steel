package com.lapis.database

import com.lapis.database.base.BaseRepository
import com.lapis.database.base.BaseRepositoryEntityMapper
import com.lapis.database.base.FromJson
import com.lapis.database.base.HasDTO
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.ReferenceOption

class CombatantRepository(database: Database) : BaseRepository<ExposedCombatant, ExposedCombatant.Companion>(
	ExposedCombatant, database, BaseRepositoryEntityMapper(
		{ this.toDTO() },
		{ this.customizeFromJson(it) }
	)
) {
	override fun Route.additionalRouteSetup()
	{
		patch("{id}/resources") {
			call.respond(consumeModification(ModifyType.RESOURCES))
		}
		
		patch("{id}/surges") {
			call.respond(consumeModification(ModifyType.SURGES))
		}
	}
	
	private suspend fun RoutingContext.consumeModification(type: ModifyType): CombatantDTO {
		val id = call.parameters["id"]?.toIntOrNull() ?: error("Invalid ID")
		val request = call.receive<CombatantValueModificationRequest>()
		val modifyBy = when (request.type) {
			CombatantValueModificationRequest.Type.INCREASE -> request.value
			CombatantValueModificationRequest.Type.DECREASE -> -request.value
		}
		
		return transaction {
			val combatant = ExposedCombatant.findById(id) ?: error("Combatant not found")
			when (type) {
				ModifyType.RESOURCES -> combatant.resources = (combatant.resources + modifyBy).coerceAtLeast(0)
				ModifyType.SURGES -> combatant.surges = (combatant.surges + modifyBy).coerceAtLeast(0)
			}
			
			combatant.toDTO()
		}
	}
	
	@Serializable
	private data class CombatantValueModificationRequest(
		val value: Int,
		val type: Type
	) {
		enum class Type {
			INCREASE,
			DECREASE
		}
	}
	
	enum class ModifyType {
		RESOURCES,
		SURGES
	}
}

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
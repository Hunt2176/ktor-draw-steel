package com.lapis.database

import com.lapis.database.base.BaseRepository
import com.lapis.database.base.BaseRepositoryEntityMapper
import com.lapis.database.base.FromJson
import com.lapis.database.base.HasDTO
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.and

class CombatRepository(database: Database) : BaseRepository<ExposedCombat, ExposedCombat.Companion>(
	ExposedCombat, database, BaseRepositoryEntityMapper(
		{ this.toDTO() },
		{ this.customizeFromJson(it) }
	)
) {
	
	override fun Route.additionalRouteSetup() {
		post("/create") {
			val body = call.receive<CreateCombatRequest>()
			
			val response = transaction {
				val campaign = ExposedCampaign.findById(body.campaign) ?: error("Campaign not found")
				val characters = body.characters.map { charId ->
					ExposedCharacter.find {
						Characters.campaign.eq(campaign.id) and Characters.id.eq(charId)
					}.firstOrNull() ?: error("Character $charId belonging to ${campaign.id} not found")
				}
				
				val combat = ExposedCombat.new {
					this.campaign = campaign
				}
				
				characters.forEach { char ->
					ExposedCombatant.new {
						this.character = char
						this.combat = combat
					}
				}
				
				combat.toDTO()
			}
			
			call.respond(HttpStatusCode.Created, response)
		}
		
		patch("{id}/nextRound") {
			val id = call.parameters["id"]?.toIntOrNull() ?: error("Invalid ID")
			val body = call.receive<NextRoundRequest>()
			
			val response = transaction {
				val combat = ExposedCombat.findById(id) ?: error("Combat not found")
				if (combat.round != body.fromRound) {
					error("Combat round has changed")
				}
				
				combat.round += 1
				if (body.reset) {
					combat.combatants.forEach { it.available = true }
				}
				
				combat.toDTO()
			}
			
			call.respond(HttpStatusCode.OK, response)
		}
		
		patch("{id}/add") {
			val id = call.parameters["id"]?.toIntOrNull() ?: error("Invalid ID")
			val body = call.receive<CombatantRequest>()
			
			val response = transaction {
				val combat = ExposedCombat.findById(id) ?: error("Combat not found")
				val character = ExposedCharacter.find { (Characters.id eq body.character) and (Characters.campaign eq combat.campaign.id) }
					.firstOrNull() ?: error("Character ${body.character} belonging to ${combat.campaign.id} not found")
				
				ExposedCombatant.new {
					this.character = character
					this.combat = combat
				}
				
				combat.toDTO()
			}
			
			call.respond(HttpStatusCode.OK, response)
		}
		
		patch("{id}/remove") {
			val id = call.parameters["id"]?.toIntOrNull() ?: error("Invalid ID")
			val body = call.receive<CombatantRequest>()
			
			val response = transaction {
				val combat = ExposedCombat.findById(id) ?: error("Combat not found")
				val combatant = ExposedCombatant.find { (Combatants.id eq body.character) and (Combatants.combat eq combat.id) }
					.firstOrNull() ?: error("Combatant ${body.character} not found in ${combat.id}")
				
				combatant.delete()
				combat.toDTO()
			}
			
			call.respond(HttpStatusCode.OK, response)
		}
	}
	
	@Serializable
	private data class CreateCombatRequest(
		val campaign: Int,
		val characters: Set<Int>
	)
	
	@Serializable
	private data class NextRoundRequest(
		val fromRound: Int,
		val reset: Boolean
	)
	
	@Serializable
	private data class CombatantRequest(
		val character: Int
	)
}

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
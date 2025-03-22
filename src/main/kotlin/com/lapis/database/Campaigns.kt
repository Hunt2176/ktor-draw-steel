package com.lapis.database

import com.lapis.database.base.*
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.Database

class CampaignRepository(database: Database) : BaseRepository<ExposedCampaign, ExposedCampaign.Companion>(
	ExposedCampaign.Companion,
	database,
	BaseRepositoryEntityMapper(
		{ this.toDTO() },
		{ this.customizeFromJson(it) }
	)
) {
	
	final fun getCampaignDetails(ids: Collection<Int>?): JsonArray {
		val res = transaction {
			val campaigns =
				if (ids == null) {
					ExposedCampaign.all().map { it.toDTO() }
				} else {
					ExposedCampaign.find { Campaigns.id inList ids }.map { it.toDTO() }
				}
			
			val characters = ExposedCharacter
				.find { Characters.campaign inList campaigns.map { it.id } }
				.map { it.toDTO() }
			
			val displayEntries = ExposedDisplayEntry
				.find { DisplayEntry.campaign inList campaigns.map { it.id } }
				.map { it.toDTO() }
			
			campaigns.map { c ->
				mapOf(
					"campaign" to Json.encodeToJsonElement(c),
					"characters" to Json.encodeToJsonElement(characters),
					"entries" to Json.encodeToJsonElement(displayEntries),
				)
			}
		}
		
		return Json.encodeToJsonElement<List<Map<String, JsonElement>>>(res).jsonArray
	}
	
	override fun Route.getRoot()
	{
		get {
			val res = getCampaignDetails(null)
			call.respond(HttpStatusCode.OK, res)
		}
	}
	
	override fun Route.getById() {
		get("/{id}") {
			val id = call.parameters["id"]?.toIntOrNull()
			if (id == null) {
				call.respond(HttpStatusCode.BadRequest, "Invalid ID")
				return@get
			}
			
			val res = getCampaignDetails(listOf(id))
			if (res.isEmpty()) {
				call.respond(HttpStatusCode.NotFound, "Campaign not found")
				return@get
			}
			
			call.respond(HttpStatusCode.OK, res[0])
		}
	}
	
	override fun Route.additionalRouteSetup()
	{
		get("{id}/combats") {
			val id = call.parameters["id"]?.toIntOrNull()
			if (id == null) {
				call.respond(HttpStatusCode.BadRequest, "Invalid ID")
				return@get
			}
			
			val callback = transaction {
				ExposedCampaign.findById(id)
					?: return@transaction suspend {
						call.respond(HttpStatusCode.NotFound, "Campaign not found")
					}
				
				val combats = ExposedCombat.find { Combats.campaign eq id }.map { it.toDTO() }
				return@transaction suspend {
					call.respond(HttpStatusCode.OK, combats)
				}
			}
			
			callback()
		}
		
		get("/{id}/characters") {
			val id = call.parameters["id"]?.toIntOrNull()
			if (id == null) {
				call.respond(HttpStatusCode.BadRequest, "Invalid ID")
				return@get
			}
			
			val callback = transaction {
				ExposedCampaign.findById(id)
					?: return@transaction suspend {
						call.respond(HttpStatusCode.NotFound, "Campaign not found")
					}
				
				val characters = ExposedCharacter.find { Characters.campaign eq id }.map { it.toDTO() }
				return@transaction suspend {
					call.respond(HttpStatusCode.OK, characters)
				}
			}
			
			callback()
		}
	}
}

object Campaigns : IntIdTable(), HasName {
	override val name: Column<String> = varchar("name", 100)
	val background = text("background").nullable()
}

class ExposedCampaign(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<CampaignDTO>, FromJson<ExposedCampaign> {
	companion object : EntityClass<Int, ExposedCampaign>(Campaigns)
	
	var name by Campaigns.name
	var background by Campaigns.background
	
	override fun toDTO(): CampaignDTO {
		return CampaignDTO.fromEntity(this)
	}
	
	override fun ExposedCampaign.customizeFromJson(json: JsonObject)
	{
		json["name"]?.jsonPrimitive?.content?.let { name = it }
		json["background"]?.jsonPrimitive?.content?.let { background = it }
	}
}

@Serializable
data class CampaignDTO(
	val id: Int,
	val name: String,
	val background: String?
) {
	companion object {
		fun fromEntity(entity: ExposedCampaign): CampaignDTO {
			return CampaignDTO(entity.id.value, entity.name, entity.background)
		}
	}
}
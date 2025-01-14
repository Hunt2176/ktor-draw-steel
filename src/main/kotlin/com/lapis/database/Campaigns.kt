package com.lapis.database

import com.lapis.database.base.*
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.Column
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction

class CampaignRepository(database: Database) : BaseRepository<ExposedCampaign, ExposedCampaign.Companion>(
	ExposedCampaign.Companion,
	database,
	BaseRepositoryEntityMapper(
		{ this.toDTO() },
		{ this.customizeFromJson(it) }
	)
) {
	override fun Route.customizeRoute(baseRoute: Route)
	{
		get("/{id}/characters") {
			val id = call.parameters["id"]?.toIntOrNull()
			if (id == null) {
				call.respond(HttpStatusCode.BadRequest, "Invalid ID")
				return@get
			}
			
			val callback = transaction(database) {
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
}

class ExposedCampaign(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<CampaignDTO>, FromJson<ExposedCampaign> {
	companion object : EntityClass<Int, ExposedCampaign>(Campaigns)
	
	var name by Campaigns.name
	
	override fun toDTO(): CampaignDTO {
		return CampaignDTO.fromEntity(this)
	}
	
	override fun ExposedCampaign.customizeFromJson(json: JsonObject)
	{
		json["name"]?.jsonPrimitive?.content?.let { name = it }
	}
}

@Serializable
data class CampaignDTO(
	val id: Int,
	val name: String
) {
	companion object {
		fun fromEntity(entity: ExposedCampaign): CampaignDTO {
			return CampaignDTO(entity.id.value, entity.name)
		}
	}
}
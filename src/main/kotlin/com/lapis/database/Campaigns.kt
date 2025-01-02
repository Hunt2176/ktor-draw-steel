package com.lapis.database

import com.lapis.database.base.FromJson
import com.lapis.database.base.HasDTO
import com.lapis.database.base.HasName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.Column

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
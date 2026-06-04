package com.lapis.database

import com.lapis.database.base.FromJson
import com.lapis.database.base.HasCampaign
import com.lapis.database.base.HasDTO
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.ReferenceOption

object DisplayEntry : IntIdTable(), HasCampaign
{
	var title = text("title")
	var description = text("description").nullable()
	var pictureUrl = text("picture_url").nullable()
	var type = enumerationByName("type", 255, DisplayEntryType::class)
	
	override val campaign = reference("campaign", Campaigns, onDelete = ReferenceOption.CASCADE, onUpdate = ReferenceOption.CASCADE)
}

enum class DisplayEntryType {
	Portrait,
	Background
}

class ExposedDisplayEntry(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<DisplayEntryDTO>, FromJson<ExposedDisplayEntry>
{
	companion object : EntityClass<Int, ExposedDisplayEntry>(DisplayEntry)
	
	var title by DisplayEntry.title
	var description by DisplayEntry.description
	var pictureUrl by DisplayEntry.pictureUrl
	var type by DisplayEntry.type
	
	var campaign by ExposedCampaign referencedOn DisplayEntry.campaign
	
	override fun toDTO(): DisplayEntryDTO
	{
		return DisplayEntryDTO.fromEntity(this)
	}
	
	override fun ExposedDisplayEntry.customizeFromJson(json: JsonObject)
	{
		json["title"]?.jsonPrimitive?.contentOrNull?.let { title = it }
		json["description"]?.jsonPrimitive?.contentOrNull?.let { description = it }
		json["pictureUrl"]?.jsonPrimitive?.contentOrNull?.let { pictureUrl = it }
		json["type"]?.jsonPrimitive?.content?.let { type = DisplayEntryType.valueOf(it) }
		
		json["campaign"]?.jsonPrimitive?.int?.let { campaign = ExposedCampaign.findById(it) ?: error("Campaign not found") }
	}
}

@Serializable
data class DisplayEntryDTO(
	val id: Int,
	val title: String,
	val description: String?,
	val pictureUrl: String?,
	val type: DisplayEntryType,
	val campaign: Int
) {
	companion object
	{
		fun fromEntity(entity: ExposedDisplayEntry): DisplayEntryDTO
		{
			return DisplayEntryDTO(
				id = entity.id.value,
				title = entity.title,
				description = entity.description,
				pictureUrl = entity.pictureUrl,
				type = entity.type,
				campaign = entity.campaign.id.value
			)
		}
	}
}
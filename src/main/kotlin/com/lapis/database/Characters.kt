package com.lapis.database

import com.lapis.database.base.*
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.ReferenceOption

class CharacterRepository(database: Database) : BaseRepository<ExposedCharacter, ExposedCharacter.Companion>(
	ExposedCharacter.Companion,
	database,
	BaseRepositoryEntityMapper(
		{ this.toDTO() },
		{ this.customizeFromJson(it) }
	)
) {
	override fun Route.additionalRouteSetup()
	{
		patch("{id}/modify/health") {
			val requestText = call.receiveText()
			val update = Json.decodeFromString<CharacterHealthModifier>(requestText)
			
			val res = this@CharacterRepository.transaction {
				val character = ExposedCharacter.findById(call.parameters["id"]?.toIntOrNull() ?: error("Invalid ID")) ?: error("Character not found")
				val removed = character.removedHp
				val newRemoved = when (update.type) {
					CharacterHealthModifier.Type.HEAL -> removed - update.mod
					CharacterHealthModifier.Type.DAMAGE -> removed + update.mod
				}
				
				character.removedHp = newRemoved.coerceAtLeast(0)
				return@transaction character.toDTO()
			}
			
			call.respond(HttpStatusCode.OK, res)
		}
	}
	
	@Serializable
	private data class CharacterHealthModifier(
		val mod: Int,
		val type: Type
	) {
		enum class Type {
			HEAL,
			DAMAGE
		}
	}
}

object Characters : IntIdTable(), HasName, HasCampaign
{
	override val name = varchar("name", 255)
	
	val might = integer("might").default(0)
	val agility = integer("agility").default(0)
	val reason = integer("reason").default(0)
	val intuition = integer("intuition").default(0)
	val presence = integer("presence").default(0)
	
	val removedHp = integer("removed_hp").default(0)
	val maxHp = integer("max_hp").default(0)
	val temporaryHp = integer("temporary_hp").default(0)
	
	val removedRecoveries = integer("removed_recoveries").default(0)
	val maxRecoveries = integer("max_recoveries").default(0)
	
	val resources = integer("resources").default(0)
	val surges = integer("surges").default(0)
	val victories = integer("victories").default(0)
	
	val pictureUrl = varchar("picture_url", 255).nullable()
	val border = varchar("border", 255).nullable()
	
	override val campaign = reference("campaign", Campaigns)
	val user = reference("user", Users,
		onDelete = ReferenceOption.CASCADE,
		onUpdate = ReferenceOption.CASCADE
	)
}

class ExposedCharacter(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<CharacterDTO>, FromJson<ExposedCharacter>
{
	companion object : EntityClass<Int, ExposedCharacter>(Characters)
	
	var name by Characters.name
	
	var might by Characters.might
	var agility by Characters.agility
	var reason by Characters.reason
	var intuition by Characters.intuition
	var presence by Characters.presence
	
	var removedHp by Characters.removedHp
	var maxHp by Characters.maxHp
	var temporaryHp by Characters.temporaryHp
	
	var removedRecoveries by Characters.removedRecoveries
	var maxRecoveries by Characters.maxRecoveries
	
	var resources by Characters.resources
	var surges by Characters.surges
	var victories by Characters.victories
	
	var pictureUrl by Characters.pictureUrl
	var border by Characters.border
	
	var campaign by ExposedCampaign referencedOn Characters.campaign
	var user by ExposedUser referencedOn Characters.user
	
	val conditions by ExposedCharacterCondition referrersOn CharacterConditions.character
	
	override fun toDTO(): CharacterDTO {
		return CharacterDTO.fromEntity(this)
	}
	
	override fun ExposedCharacter.customizeFromJson(json: JsonObject)
	{
		json["name"]?.jsonPrimitive?.content?.let { name = it }
		
		json["might"]?.jsonPrimitive?.int?.let { might = it }
		json["agility"]?.jsonPrimitive?.int?.let { agility = it }
		json["reason"]?.jsonPrimitive?.int?.let { reason = it }
		json["intuition"]?.jsonPrimitive?.int?.let { intuition = it }
		json["presence"]?.jsonPrimitive?.int?.let { presence = it }
		
		json["removedHp"]?.jsonPrimitive?.int?.let { removedHp = it }
		json["maxHp"]?.jsonPrimitive?.int?.let { maxHp = it }
		json["temporaryHp"]?.jsonPrimitive?.int?.let { temporaryHp = it }
		
		json["removedRecoveries"]?.jsonPrimitive?.int?.let { removedRecoveries = it }
		json["maxRecoveries"]?.jsonPrimitive?.int?.let { maxRecoveries = it }
		
		json["resources"]?.jsonPrimitive?.int?.let { resources = it }
		json["surges"]?.jsonPrimitive?.int?.let { surges = it }
		json["victories"]?.jsonPrimitive?.int?.let { victories = it }
		
		if (json.containsKey("pictureUrl")) json["pictureUrl"]?.jsonPrimitive?.contentOrNull?.let { pictureUrl = it }
		if (json.containsKey("border")) json["border"]?.jsonPrimitive?.contentOrNull?.let { border = it }
		
		json["campaign"]?.jsonPrimitive?.int?.let { campaign = ExposedCampaign.findById(it) ?: error("Campaign not found") }
		json["user"]?.jsonPrimitive?.int?.let { user = ExposedUser.findById(it) ?: error("User not found") }
	}
}

@Serializable
data class CharacterDTO (
	val id: Int,
	val name: String,
	val might: Int,
	val agility: Int,
	val reason: Int,
	val intuition: Int,
	val presence: Int,
	val removedHp: Int,
	val maxHp: Int,
	val temporaryHp: Int,
	val removedRecoveries: Int,
	val maxRecoveries: Int,
	val resources: Int,
	val surges: Int,
	val victories: Int,
	val campaign: Int,
	val user: Int,
	val pictureUrl: String?,
	val border: String?,
	val conditions: List<CharacterConditionDTO>
)
{
	companion object
	{
		fun fromEntity(entity: ExposedCharacter): CharacterDTO
		{
			return CharacterDTO(
				entity.id.value,
				entity.name,
				entity.might,
				entity.agility,
				entity.reason,
				entity.intuition,
				entity.presence,
				entity.removedHp,
				entity.maxHp,
				entity.temporaryHp,
				entity.removedRecoveries,
				entity.maxRecoveries,
				entity.resources,
				entity.surges,
				entity.victories,
				entity.campaign.id.value,
				entity.user.id.value,
				entity.pictureUrl,
				entity.border,
				entity.conditions.map { it.toDTO() }
			)
		}
	}
}
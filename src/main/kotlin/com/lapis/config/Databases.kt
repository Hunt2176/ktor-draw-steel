package com.lapis.config

import com.lapis.database.*
import com.lapis.database.base.BaseRepository
import io.ktor.server.application.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction

fun Application.configureDatabases()
{
	val database = Database.connect(
		url = "jdbc:sqlite:draw_steel.sqlite",
		driver = "org.sqlite.JDBC",
		setupConnection = {
			val statement = it.createStatement()
			statement.execute("PRAGMA foreign_keys=ON")
		}
	)
	
	val repos = transaction(database) {
		arrayOf(
			BaseRepository(ExposedCampaign, database, ExposedCampaign::toDTO),
			BaseRepository(ExposedUser, database, ExposedUser::toDTO),
			BaseRepository(ExposedCharacter, database, ExposedCharacter::toDTO),
			BaseRepository(ExposedCharacterCondition, database, ExposedCharacterCondition::toDTO),
			BaseRepository(ExposedCombat, database, ExposedCombat::toDTO),
			BaseRepository(ExposedCombatant, database, ExposedCombatant::toDTO),
		)
	}
	
	routing {
		route("/api") {
			repos.forEach { it.registerRoutes(this) }
		}
	}
	
//	transaction(database) {
//		val campaignId = Campaigns.insert {
//			it[name] = "Test Campaign"
//		}[Campaigns.id]
//
//		val userId = Users.insert {
//			it[name] = "Test User"
//		}[Users.id]
//
//		val characterId = Characters.insert {
//			it[name] = "Test Character"
//			it[user] = userId
//			it[campaign] = campaignId
//		}[Characters.id]
//
//		CharacterConditions.insert {
//			it[name] = "Test Condition"
//			it[character] = characterId
//			it[endType] = EndType.endOfTurn
//		}
//
//		val combatId = Combats.insert {
//			it[campaign] = campaignId
//		}[Combats.id]
//
//		Combatants.insert {
//			it[combat] = combatId
//			it[character] = characterId
//		}
//	}
}
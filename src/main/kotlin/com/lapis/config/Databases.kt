package com.lapis.config

import com.lapis.database.*
import com.lapis.database.base.BaseRepository
import com.lapis.database.base.BaseRepositoryEntityMapper
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
			CampaignRepository(database),
			BaseRepository(ExposedUser, database, BaseRepositoryEntityMapper(ExposedUser::toDTO) {
				customizeFromJson(it)
			}),
			BaseRepository(ExposedCharacter, database, BaseRepositoryEntityMapper(ExposedCharacter::toDTO) {
				customizeFromJson(it)
			}),
			BaseRepository(ExposedCharacterCondition, database, BaseRepositoryEntityMapper(ExposedCharacterCondition::toDTO) {
				customizeFromJson(it)
			}),
			BaseRepository(ExposedCombat, database, BaseRepositoryEntityMapper(ExposedCombat::toDTO) {
				customizeFromJson(it)
			}),
			BaseRepository(ExposedCombatant, database, BaseRepositoryEntityMapper(ExposedCombatant::toDTO) {
				customizeFromJson(it)
			}),
		)
	}
	
	routing {
		route("/api") {
			repos.forEach { it.registerRoutes(this) }
		}
	}
}
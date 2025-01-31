package com.lapis.config

import com.lapis.database.*
import com.lapis.database.base.BaseRepository
import com.lapis.database.base.BaseRepositoryEntityMapper
import com.lapis.services.SocketCampaignService
import io.ktor.server.application.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.dao.EntityHook
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction
import org.koin.ktor.ext.inject

fun Application.configureDatabases()
{
	val campaignService by inject<SocketCampaignService>()
	
	val database = Database.connect(
		url = "jdbc:sqlite:draw_steel.sqlite",
		driver = "org.sqlite.JDBC",
		setupConnection = {
			val statement = it.createStatement()
			statement.execute("PRAGMA foreign_keys=ON")
		}
	)
	
	getKoinModule().single { database }
	
	val repos = transaction(database) {
		arrayOf(
			CampaignRepository(database).also { repo -> getKoinModule().single { repo } },
			CharacterRepository(database).also { repo -> getKoinModule().single { repo } },
			BaseRepository(ExposedUser, database, BaseRepositoryEntityMapper(ExposedUser::toDTO) {
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
	
	EntityHook.subscribe { event ->
		val id = event.entityId.value
		if (id !is Int) {
			return@subscribe
		}
		
		campaignService.updateFromEntityChange(event, id)
	}
}
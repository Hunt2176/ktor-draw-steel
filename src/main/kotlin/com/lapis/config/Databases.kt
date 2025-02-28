package com.lapis.config

import com.lapis.database.*
import com.lapis.database.base.BaseRepository
import com.lapis.database.base.BaseRepositoryEntityMapper
import com.lapis.services.SocketService
import io.ktor.server.application.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.dao.EntityHook
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction

fun Application.configureDatabases()
{
	val socketService = getKoinApplication().koin.get<SocketService>()
	
	val database = Database.connect(
		url = "jdbc:sqlite:draw_steel.sqlite",
		driver = "org.sqlite.JDBC",
		setupConnection = {
			val statement = it.createStatement()
			statement.execute("PRAGMA foreign_keys=ON")
		}
	)
	
	getKoinApplication().modules(
		KoinModule().apply {
			single { database }
		}
	)
	
	val repoModule = KoinModule()
	
	val repos = transaction(database) {
		arrayOf(
			CampaignRepository(database).also { repo -> repoModule.single { repo } },
			CharacterRepository(database).also { repo -> repoModule.single { repo } },
			CombatRepository(database).also { repo -> repoModule.single { repo } },
			CombatantRepository(database).also { repo -> repoModule.single { repo } },
			BaseRepository(ExposedUser, database, BaseRepositoryEntityMapper(ExposedUser::toDTO) {
				customizeFromJson(it)
			}),
			BaseRepository(ExposedCharacterCondition, database, BaseRepositoryEntityMapper(ExposedCharacterCondition::toDTO) {
				customizeFromJson(it)
			}),
		)
	}
	
	getKoinApplication().modules(repoModule)
	
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
		
		socketService.updateFromEntityChange(event)
	}
}
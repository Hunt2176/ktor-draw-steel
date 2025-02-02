package com.lapis.config

import com.lapis.services.SocketCampaignService
import com.lapis.services.SocketCombatService
import com.lapis.services.base.SocketService
import io.ktor.server.application.*
import org.koin.core.KoinApplication
import org.koin.core.context.startKoin
import org.koin.core.logger.Level
import org.koin.core.logger.Logger
import org.koin.core.logger.MESSAGE
import org.koin.core.module.Module
import org.koin.dsl.bind
import org.koin.dsl.module
import org.koin.ktor.plugin.Koin

typealias KtorLogger = io.ktor.util.logging.Logger
typealias KoinModule = Module

private lateinit var app: KoinApplication

private val appModule = module {
	single { SocketCampaignService() } bind SocketService::class
	single { SocketCombatService() } bind SocketService::class
}

fun getKoinApplication(): KoinApplication = app

fun Application.configureInjection()
{
	startKoin {
		modules(appModule)
	}
	
	install(Koin) {
		logger(LoggerRelay(log))
		modules(appModule)
		
		app = this
	}
}

private class LoggerRelay(private val logger: KtorLogger) : Logger()
{
	override fun display(level: Level, msg: MESSAGE)
	{
		when (level)
		{
			Level.DEBUG -> logger.debug(msg)
			Level.INFO -> logger.info(msg)
			Level.ERROR -> logger.error(msg)
			Level.NONE -> logger.trace(msg)
			else -> logger.info("{Level${level.name}} $msg")
		}
	}
	
}
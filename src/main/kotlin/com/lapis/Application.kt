package com.lapis

import com.lapis.config.*
import io.ktor.server.application.*

fun main(args: Array<String>)
{
	io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module()
{
	configureInjection()
	configureHTTP()
	configureDatabases()
	configureSockets()
	configureMonitoring()
	configureRouting()
}

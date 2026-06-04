package com.lapis

import com.lapis.config.*
import io.ktor.server.application.*

fun main(args: Array<String>)
{
	val newArgs = args
		.plus("-config=application-base.yaml")
		.plus("-config=application.yaml")
	
	io.ktor.server.netty.EngineMain.main(newArgs)
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

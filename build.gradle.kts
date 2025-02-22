@file:Suppress("PropertyName")

val exposed_version: String by project
val h2_version: String by project
val kotlin_version: String by project
val logback_version: String by project
val sqlite_version: String by project
val koin_version: String by project

plugins {
	kotlin("jvm") version "2.1.0"
	id("io.ktor.plugin") version "3.0.3"
	id("org.jetbrains.kotlin.plugin.serialization") version "2.1.0"
	id("org.jetbrains.kotlin.plugin.allopen") version "2.1.0"
	id("idea")
}

group = "com.lapis"
version = "0.0.1"

idea {
	module {
		isDownloadJavadoc = true
		isDownloadSources = true
	}
}

allOpen {
	annotation("com.lapis.annotations.AllOpen")
}

application {
	mainClass.set("io.ktor.server.netty.EngineMain")
	
	val isDevelopment: Boolean = project.ext.has("development")
	applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
}

repositories {
	mavenCentral()
	maven { url = uri("https://packages.confluent.io/maven/") }
}

val buildApp by tasks.registering {
	group = "frontend"
	description = "Builds the frontend app"
	doLast {
		exec {
			workingDir = file("$projectDir")
			commandLine("bun", "install")
			commandLine("bun", "run", "build")
		}
	}
}

val clean = tasks.getByName("clean")
val build = tasks.getByName("build")

val fullBuild by tasks.registering {
	group = "build"
	description = "Run clean, buildApp and build"
	dependsOn(clean)
	dependsOn(buildApp)
	dependsOn(build)
}

dependencies {
	implementation(project.dependencies.platform("io.insert-koin:koin-bom:$koin_version"))
	implementation("io.insert-koin:koin-core:$koin_version")
	implementation("io.insert-koin:koin-ktor:$koin_version")
	implementation("org.xerial:sqlite-jdbc:$sqlite_version")
	implementation("io.ktor:ktor-server-auto-head-response-jvm")
	implementation("io.ktor:ktor-server-core-jvm")
	implementation("io.ktor:ktor-server-resources-jvm")
	implementation("io.ktor:ktor-server-host-common-jvm")
	implementation("io.ktor:ktor-server-status-pages-jvm")
	implementation("io.ktor:ktor-server-compression-jvm")
	implementation("io.ktor:ktor-server-default-headers-jvm")
	implementation("io.ktor:ktor-server-partial-content-jvm")
	implementation("io.ktor:ktor-server-content-negotiation-jvm")
	implementation("io.ktor:ktor-serialization-kotlinx-json-jvm")
	implementation("org.jetbrains.exposed:exposed-core:$exposed_version")
	implementation("org.jetbrains.exposed:exposed-jdbc:$exposed_version")
	implementation("org.jetbrains.exposed:exposed-dao:$exposed_version")
	implementation("com.h2database:h2:$h2_version")
	implementation("io.ktor:ktor-server-websockets-jvm")
	implementation("io.github.flaxoos:ktor-server-task-scheduling-core:2.1.1")
	implementation("io.github.flaxoos:ktor-server-task-scheduling-redis:2.1.1")
	implementation("io.github.flaxoos:ktor-server-task-scheduling-mongodb:2.1.1")
	implementation("io.github.flaxoos:ktor-server-task-scheduling-jdbc:2.1.1")
	implementation("io.ktor:ktor-server-call-logging-jvm")
	implementation("io.ktor:ktor-server-netty-jvm")
	implementation("ch.qos.logback:logback-classic:$logback_version")
	implementation("io.ktor:ktor-server-config-yaml-jvm")
	testImplementation("io.ktor:ktor-server-test-host-jvm")
	testImplementation("org.jetbrains.kotlin:kotlin-test-junit:$kotlin_version")
}

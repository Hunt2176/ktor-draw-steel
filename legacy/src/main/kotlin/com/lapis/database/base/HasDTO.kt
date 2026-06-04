package com.lapis.database.base

import kotlinx.serialization.json.JsonObject
import org.jetbrains.exposed.dao.Entity

interface HasDTO<SType : Any>
{
	fun toDTO(): SType
}

interface FromJson<EType: Entity<Int>> {
	
	fun EType.customizeFromJson(json: JsonObject)
}
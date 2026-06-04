package com.lapis.database.base

import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.Column

interface HasName
{
	val name: Column<String>
}

interface HasCampaign
{
	val campaign: Column<EntityID<Int>>
}
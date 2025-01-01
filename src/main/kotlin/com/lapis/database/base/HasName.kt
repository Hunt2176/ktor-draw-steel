package com.lapis.database.base

import org.jetbrains.exposed.sql.Column

interface HasName
{
	val name: Column<String>
}
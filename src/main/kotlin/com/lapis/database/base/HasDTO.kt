package com.lapis.database.base

interface HasDTO<SType : Any>
{
	fun toDTO(): SType
}
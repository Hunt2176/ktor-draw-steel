package com.lapis.database

import com.lapis.database.base.HasDTO
import com.lapis.database.base.HasName
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.Entity
import org.jetbrains.exposed.dao.EntityClass
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.dao.id.IntIdTable

object Users : IntIdTable(), HasName
{
	override val name = varchar("name", 100)
}

class ExposedUser(
	id: EntityID<Int>
) : Entity<Int>(id), HasDTO<UserDTO>
{
	companion object : EntityClass<Int, ExposedUser>(Users)
	
	var name by Users.name
	
	override fun toDTO(): UserDTO
	{
		return UserDTO.fromEntity(this)
	}
}

@Serializable
data class UserDTO(
	val id: Int,
	val name: String
)
{
	companion object
	{
		fun fromEntity(entity: ExposedUser): UserDTO
		{
			return UserDTO(entity.id.value, entity.name)
		}
	}
}
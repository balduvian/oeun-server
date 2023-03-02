package com.balduvian

import com.google.gson.JsonParser
import java.io.InputStreamReader

class Badge(
	var id: String,
	var displayName: String,
	var picture: String,
)

object Badges {
	val badgesList = ArrayList<Badge>()

	private fun loadBadgesData(reader: InputStreamReader): ArrayList<Badge> {
		try {
			val jsonArray = JsonParser.parseReader(reader).asJsonArray
			val ret = ArrayList<Badge>()

			for (element in jsonArray) {
				ret.add(JsonUtil.readerGson.fromJson(element, Badge::class.java))
			}

			return ret
		} catch (ex: Exception) {
			throw Exception("badges.json in wrong file format")
		}
	}

	fun loadBadges() {
		val badgesDataFile = Directories.PATH_BADGES.path.resolve("badges.json").toFile()

		badgesList.addAll(if (badgesDataFile.exists()) {
			loadBadgesData(badgesDataFile.reader())
		} else {
			println("badges.json doesn't exist, creating it")
			badgesDataFile.writeText("[]")
			ArrayList()
		})
	}

	fun addOrReplace(oldId: String?, badge: Badge) {
		val existing = if (oldId == null) null else badgesList.find { existing -> existing.id == oldId }

		if (existing != null) {
			existing.id = badge.id
			existing.displayName = badge.displayName
			existing.picture = badge.picture
		} else {
			badgesList.add(badge)
		}
	}

	fun remove(id: String): Boolean {
		val index = badgesList.indexOfFirst { badge -> badge.id == id }
		if (index == -1) return false
		badgesList.removeAt(index)
		return true
	}
}

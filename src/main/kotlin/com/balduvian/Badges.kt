package com.balduvian

import com.balduvian.images.ImagePool
import com.balduvian.`object`.Badge
import com.balduvian.util.JsonUtil
import com.balduvian.util.PrettyException
import com.google.gson.JsonParser
import java.io.InputStreamReader
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.io.path.Path

object Badges {
	val badgesList = ArrayList<Badge>()
	private val saverPool: ExecutorService = Executors.newFixedThreadPool(1)

	private fun badgesFile() = Directories.PATH_BADGES.path.resolve("badges.json").toFile()

	private fun loadBadgesData(reader: InputStreamReader): ArrayList<Badge> {
		try {
			val jsonArray = JsonParser.parseReader(reader).asJsonArray
			val ret = ArrayList<Badge>()

			for (element in jsonArray) {
				ret.add(JsonUtil.localGson.fromJson(element, Badge::class.java))
			}

			return ret
		} catch (ex: Exception) {
			throw Exception("badges.json in wrong file format")
		}
	}

	fun loadBadges() {
		val badgesFile = badgesFile()

		badgesList.addAll(if (badgesFile.exists()) {
			loadBadgesData(badgesFile.reader())
		} else {
			println("badges.json doesn't exist, creating it")
			badgesFile.writeText("[]")
			ArrayList()
		})
	}

	private fun saveBadges() {
		val badgesFile = badgesFile()
		val serialized = JsonUtil.localGson.toJson(badgesList)
		badgesFile.writeText(serialized)
	}

	fun addOrReplace(oldId: String?, uploadBadge: Badge): Badge {
		val existing = if (oldId == null) null else badgesList.find { existing -> existing.id == oldId }

		if (uploadBadge.displayName == null || uploadBadge.id == null)
			throw PrettyException("Badly formatted upload badge")

		val imageFilename = ImagePool.BADGES.images.handleUploadedPicture(existing?.picture, uploadBadge.picture)
			?: throw PrettyException("Badge needs an image")
		uploadBadge.picture = imageFilename

		return if (existing != null) {
			val wasChanged = existing.id != uploadBadge.id ||
				existing.displayName != uploadBadge.displayName ||
				existing.picture != uploadBadge.picture

			if (wasChanged) {
				existing.id = uploadBadge.id
				existing.displayName = uploadBadge.displayName
				existing.picture = uploadBadge.picture

				saverPool.execute { saveBadges() }
			}

			existing
		} else {
			badgesList.add(uploadBadge)

			saverPool.execute { saveBadges() }

			uploadBadge
		}
	}

	fun remove(id: String): Boolean {
		val index = badgesList.indexOfFirst { badge -> badge.id == id }
		if (index == -1) return false
		val deleted = badgesList.removeAt(index)

		ImagePool.BADGES.images.moveToTrash(Path(deleted.picture))
		saverPool.execute { saveBadges() }

		return true
	}
}

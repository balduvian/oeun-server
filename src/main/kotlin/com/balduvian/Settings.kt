package com.balduvian

import com.balduvian.util.JsonUtil
import com.balduvian.util.NotFoundException
import java.io.File

object Settings {
	val DEFAULT_PORT = 35432
	val OPTIONS_PATH = "./options.json"

	var options = load()

	class Options (
		var port: Int,
		var deckName: String?,
		var modelName: String?,
		var extensionId: String?,
		var dayCutoffHour: Int?,
	) {
		fun save() {
			val file = File(OPTIONS_PATH)

			val writer = file.writer()
			writer.write(JsonUtil.localGson.toJson(this))
			writer.close()
		}

		fun getDeckModelName(): Pair<String, String> {
			return (deckName ?: throw NotFoundException("No Deck Name specified")) to
				(modelName ?: throw NotFoundException("No Model Name specified"))
		}

		fun getDayCutoffHour(): Int {
			return dayCutoffHour ?: 0
		}
	}

	fun load(): Options {
		val file = File(OPTIONS_PATH)

		return if (file.exists()) {
			JsonUtil.localGson.fromJson(File(OPTIONS_PATH).reader(), Options::class.java)
		} else {
			val defaultOptions = Options(DEFAULT_PORT, null, null, null, null)

			defaultOptions.save()

			defaultOptions
		}
	}
}

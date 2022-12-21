package com.balduvian

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
	) {
		fun save() {
			val file = File(OPTIONS_PATH)

			val writer = file.writer()
			writer.write(JsonUtil.saverGson.toJson(this))
			writer.close()
		}

		fun getDeckModelName(): Pair<String, String> {
			return (deckName ?: throw NotFoundException("No Deck Name specified")) to
				(modelName ?: throw NotFoundException("No Model Name specified"))
		}
	}

	fun load(): Options {
		val file = File(OPTIONS_PATH)

		return if (file.exists()) {
			JsonUtil.readerGson.fromJson(File(OPTIONS_PATH).reader(), Options::class.java)
		} else {
			val defaultOptions = Options(DEFAULT_PORT, null, null, null)

			defaultOptions.save()

			defaultOptions
		}
	}
}

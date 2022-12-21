package com.balduvian

import com.balduvian.Util.getMaybe
import com.google.gson.*
import java.io.File
import java.io.FileWriter
import java.io.InputStream
import java.nio.charset.Charset
import java.time.ZonedDateTime
import java.util.*
import kotlin.collections.ArrayList

class Card(
	var id: Int,
	var word: String,
	var part: Part?,
	var definition: String,
	var sentence: String?,
	var picture: String?,
	var date: ZonedDateTime,
	var badges: ArrayList<String>,
	var anki: AnkiData?,
) {
	data class AnkiData(
		var id: Long,
		val added: ZonedDateTime,
	)

	class UploadCard(
		val id: Int?,
		val word: String,
		val part: Part?,
		val definition: String,
		val sentence: String?,
		val picture: String?,
		val badges: ArrayList<String>,
		val anki: Boolean,
	) {
		companion object {
			fun deserialize(stream: InputStream): UploadCard {
				val obj = JsonParser.parseReader(stream.reader()).asJsonObject

				return UploadCard(
					obj.getMaybe("id")?.asInt,
					obj.get("word").asString,
					obj.getMaybe("part")?.asString?.let { Part.valueOf(it) },
					obj.get("definition").asString,
					obj.getMaybe("sentence")?.asString,
					obj.getMaybe("picture")?.asString,
					obj.getAsJsonArray("badges").map { it.asString } as ArrayList<String>,
					obj.get("anki").asBoolean
				)
			}
		}
	}

	fun serialize(): JsonObject {
		return JsonUtil.senderGson.toJsonTree(this) as JsonObject
	}

	private fun filename(directoryPath: String, scramble: Boolean): String {
		return directoryPath + "card_" + (if (scramble) UUID.randomUUID().toString() else id.toString()) + ".json"
	}

	fun save(directoryPath: String, scramble: Boolean = false) {
		val file = File(filename(directoryPath, scramble))
		val fileWriter = FileWriter(file, Charset.forName("UTF-8"))
		fileWriter.write(JsonUtil.saverGson.toJson(serialize()))
		fileWriter.close()
	}

	fun unsave(directoryPath: String) {
		val file = File(filename(directoryPath, false))
		file.delete()
	}

	fun permuteInto(uploadCard: UploadCard) {
		this.word = uploadCard.word
		this.part = uploadCard.part
		this.definition = uploadCard.definition
		this.sentence = uploadCard.sentence
		this.picture = uploadCard.picture
		this.badges = uploadCard.badges
	}

	companion object {
		fun fromUpload(id: Int, uploadCard: UploadCard): Card {
			return Card(
				id,
				uploadCard.word,
				uploadCard.part,
				uploadCard.definition,
				uploadCard.sentence,
				uploadCard.picture,
				ZonedDateTime.now(),
				uploadCard.badges,
				null
			)
		}

		/** sample card name: card_-33789782.json */
		fun isCardFile(name: String): Boolean {
			return name.startsWith("card_") && name.endsWith(".json")
		}

		fun deserialize(stream: InputStream): Card {
			return JsonUtil.readerGson.fromJson(stream.reader(), Card::class.java)
		}
	}
}
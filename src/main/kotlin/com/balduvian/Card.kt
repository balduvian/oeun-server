package com.balduvian

import com.balduvian.Util.getMaybe
import com.google.gson.*
import java.io.File
import java.io.FileWriter
import java.io.InputStream
import java.nio.charset.Charset
import java.nio.file.Path
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
	var edited: ZonedDateTime?,
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

	fun filename(): Path {
		return Path.of("card_${id}.json")
	}

	fun save(directory: Path, filename: Path) {
		val file = directory.resolve(filename).toFile()
		val fileWriter = FileWriter(file, Charset.forName("UTF-8"))
		fileWriter.write(JsonUtil.saverGson.toJson(serialize()))
		fileWriter.close()
	}

	fun delete(directory: Path, filename: Path) {
		val file = directory.resolve(filename).toFile()
		file.delete()
	}

	companion object {
		fun scrambledName(): Path {
			return Path.of("card_${UUID.randomUUID()}.json")
		}

		fun fromUpload(id: Int, uploadCard: UploadCard, pictureFilename: String?): Card {
			val now = ZonedDateTime.now()

			return Card(
				id,
				uploadCard.word,
				uploadCard.part,
				uploadCard.definition,
				uploadCard.sentence,
				pictureFilename,
				now,
				now,
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
package com.balduvian.`object`

import com.balduvian.util.Highlighter
import com.balduvian.util.JsonUtil
import com.balduvian.util.getMaybe
import com.balduvian.util.serialize
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.io.FileWriter
import java.io.InputStream
import java.nio.charset.Charset
import java.nio.file.Path
import java.time.ZonedDateTime
import java.util.*

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

	fun serialize(doHighlight: Boolean = true): JsonObject {
		val obj = JsonObject()

		obj.addProperty("id", id)
		obj.addProperty("word", word)
		obj.addProperty("part", part?.name)

		obj.addProperty("definition", definition)
		obj.addProperty("sentence", sentence)

		if (doHighlight) {
			obj.add("definition_highlights", Highlighter.multiSerialize(Highlighter.highlightString(definition)))
			obj.add("sentence_highlights", sentence?.let { Highlighter.multiSerialize(Highlighter.highlightString(it)) })
		}

		obj.addProperty("picture", picture)
		obj.add("date", date.serialize())
		obj.add("edited", edited?.serialize())

		val badgesArray = JsonArray()
		for (badge in badges) {
			badgesArray.add(badge)
		}
		obj.add("badges", badgesArray)

		anki?.let {
			val ankiDataObj = JsonObject()

			ankiDataObj.addProperty("id", it.id)
			ankiDataObj.add("added", it.added.serialize())

			obj.add("anki", ankiDataObj)
		}

		return obj
	}

	fun filename(): Path {
		return Path.of("card_${id}.json")
	}

	fun save(directory: Path, filename: Path) {
		val file = directory.resolve(filename).toFile()
		val fileWriter = FileWriter(file, Charset.forName("UTF-8"))
		fileWriter.write(JsonUtil.localGson.toJson(serialize(doHighlight = false)))
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
			return JsonUtil.localGson.fromJson(stream.reader(), Card::class.java)
		}
	}
}
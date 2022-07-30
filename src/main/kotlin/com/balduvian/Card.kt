package com.balduvian

import com.balduvian.Util.getMaybe
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.io.File
import java.io.FileWriter
import java.io.InputStream
import java.nio.charset.Charset
import java.util.*
import kotlin.collections.ArrayList

class Card(
	var id: Int,
	var word: String,
	var part: Part?,
	var definition: String,
	var sentence: String?,
	var picture: String?,
	var date: Date,
	var badges: ArrayList<String>,
) {
	class UploadCard(
		val id: Int?,
		val word: String,
		val part: Part?,
		val definition: String,
		val sentence: String?,
		val picture: String?,
		val badges: ArrayList<String>,
	) {
		companion object {
			fun deserialize(stream: InputStream): UploadCard {
				val obj = JsonParser.parseReader(stream.reader()).asJsonObject

				return UploadCard(
					obj.getMaybe("id")?.asInt,
					obj.get("word").asString,
					Part.values().find { it.name == obj.getMaybe("part")?.asString },
					obj.get("definition").asString,
					obj.getMaybe("sentence")?.asString,
					obj.getMaybe("picture")?.asString,
					obj.getAsJsonArray("badges").map { it.asString } as ArrayList<String>,
				)
			}
		}
	}

	fun serialize(): JsonObject {
		return Util.senderGson.toJsonTree(this) as JsonObject
	}

	private fun filename(directoryPath: String, scramble: Boolean): String {
		return directoryPath + "card-" + id.toString() + (if (scramble) "-" + UUID.randomUUID().toString() else "") + ".json"
	}

	fun save(directoryPath: String, scramble: Boolean = false) {
		val file = File(filename(directoryPath, scramble))
		val fileWriter = FileWriter(file, Charset.forName("UTF-8"))
		fileWriter.write(Util.saverGson.toJson(serialize()))
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
		/** sample card name: card-3782.json */
		fun isCardFile(name: String): Boolean {
			return name.startsWith("card-") && name.endsWith(".json")
		}

		fun deserialize(stream: InputStream): Card {
			return Util.readerGson.fromJson(stream.reader(), Card::class.java)
		}
	}
}
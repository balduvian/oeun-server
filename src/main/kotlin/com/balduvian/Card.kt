package com.balduvian

import com.google.gson.JsonObject
import java.io.File
import java.io.FileWriter
import java.io.InputStream
import java.nio.charset.Charset
import java.util.*

class Card(
	var id: Int,
	var word: String,
	var part: Part?,
	var definition: String,
	var sentence: String?,
	var picture: String?,
	/* metadata */
	var date: Date,
	var badges: ArrayList<Badge>,
) {
	fun serialize(pretty: Boolean): String {
		return if (pretty) {
			Util.saverGson
		} else {
			Util.senderGson
		}.toJson(this)
	}


	private fun filename(directoryPath: String, scramble: Boolean): String {
		return directoryPath + "card-" + id.toString() + (if (scramble) "-" + UUID.randomUUID().toString() else "") + ".json"
	}

	fun save(directoryPath: String, scramble: Boolean = false) {
		val file = File(filename(directoryPath, scramble))
		val fileWriter = FileWriter(file, Charset.forName("UTF-8"))
		fileWriter.write(serialize(true))
		fileWriter.close()
	}

	fun unsave(directoryPath: String) {
		val file = File(filename(directoryPath, false))
		file.delete()
	}

	fun permuteInto(editObject: JsonObject) {
		val word = editObject.get("word")?.asString
		if (word != null) this.word = word

		val part = editObject.get("part")?.asString?.let { Part.valueOf(it) }
		if (part != null) this.part = part

		val definition = editObject.get("definition")?.asString
		if (definition != null) this.definition = definition

		val sentence = editObject.get("sentence")?.asString
		if (sentence != null) this.sentence = sentence

		val picture = editObject.get("picture")?.asString
		if (picture != null) this.picture = picture

		val badges = editObject.get("badge")?.asJsonArray?.map { element -> Badge.valueOf(element.asString) } as ArrayList<Badge>?
		if (badges != null) this.badges = badges
	}

	companion object {
		/* sample card name: card-3782.json */

		fun isCardFile(name: String): Boolean {
			return name.startsWith("card-") && name.endsWith(".json")
		}

		fun deserialize(stream: InputStream): Card {
			return Util.readerGson.fromJson(stream.reader(), Card::class.java)
		}
	}
}
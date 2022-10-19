package com.balduvian

import com.google.gson.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.http.*

object AnkiConnect {
	val senderGson = GsonBuilder().create()
	val client = HttpClient(CIO)
	val version = 6
	val PORT = 8765

	fun ankiFormat(string: String): String {
		return string.replace(Regex("\\*\\*(.+)\\*\\*"), "<b>$1</b>")
	}

	fun createRequestObj(action: String, params: JsonElement): JsonObject {
		val obj = JsonObject()
		obj.addProperty("action", action)
		obj.addProperty("version", 6)
		obj.add("params", params)
		return obj
	}

	fun createNoteParams(
		deckName: String,
		modelName: String,
		card: Card,
	): JsonObject {
		val params = JsonObject()
		val note = JsonObject()

		note.addProperty("deckName", deckName)
		note.addProperty("modelName", modelName)

		val options = JsonObject()
		options.addProperty("allowDuplicate", false)
		options.addProperty("duplicateScope", "deck")
		val duplicateScope = JsonObject()
		duplicateScope.addProperty("deckName", deckName)
		duplicateScope.addProperty("checkChildren", false)
		duplicateScope.addProperty("checkAllModels", false)
		options.add("duplicateScopeOptions", duplicateScope)
		note.add("options", options)

		note.add("tags", JsonArray())

		val fields = JsonObject()
		fields.addProperty("Sentence", ankiFormat(card.sentence ?: "[No sentence]"))
		fields.addProperty("Target", card.word)
		fields.addProperty("Part", card.part?.english ?: "")
		fields.addProperty("Definition", card.definition)
		note.add("fields", fields)

		card.picture?.let {
			val picture = JsonArray()
			val entry = JsonObject()

			entry.addProperty("url", "http://localhost:${Settings.options.port}/api/images/${ImagePool.CARDS.name.lowercase()}/${it}")
			entry.addProperty("filename", it)
			val pictureFields = JsonArray()
			pictureFields.add("Picture")
			entry.add("fields", pictureFields)

			picture.add(entry)
			note.add("picture", picture)
		}

		params.add("note", note)
		return params
	}

	suspend fun request(obj: JsonObject) {
		val response = client.post("http://localhost:${PORT}") {
			this.contentType(ContentType.Application.Json)
			this.setBody(senderGson.toJson(obj))
		}

		val obj = try {
			val body: String = response.body()
			JsonParser.parseString(body).asJsonObject
		} catch (ex: Exception) {
			throw PrettyException("Could not complete Anki request")
		}

		val error = obj.get("error")
		if (!error.isJsonNull) {
			/* treat duplicates as good */
			if (error.asString != "cannot create note because it is a duplicate")
				throw PrettyException(error.asString)
		}
	}
}
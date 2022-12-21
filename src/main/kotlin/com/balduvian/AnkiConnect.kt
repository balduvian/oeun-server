package com.balduvian

import com.balduvian.Util.getMaybe
import com.google.gson.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import java.io.File
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.*
import kotlin.collections.ArrayList

object AnkiConnect {
	val senderGson = GsonBuilder().create()
	val client = HttpClient(CIO)
	val version = 6
	val PORT = 8765

	fun ankiFormat(string: String): String {
		return string.replace(Regex("\\*\\*(.+?)\\*\\*"), "<b>$1</b>")
	}

	fun createRequestObj(action: String, params: JsonElement): JsonObject {
		val obj = JsonObject()
		obj.addProperty("action", action)
		obj.addProperty("version", 6)
		obj.add("params", params)
		return obj
	}

	/*
	* "note": {
            "id": 1514547547030,
            "fields": {
                "Front": "new front content",
                "Back": "new back content"
            },
            "audio": [{
                "url": "https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=猫&kana=ねこ",
                "filename": "yomichan_ねこ_猫.mp3",
                "skipHash": "7e2c2f954ef6051373ba916f000168dc",
                "fields": [
                    "Front"
                ]
            }]
        }
	* */

	fun fieldsObject(card: Card): JsonObject {
		val fields = JsonObject()
		fields.addProperty("CardId", card.id.toString())
		fields.addProperty("Sentence", ankiFormat(card.sentence ?: "[No sentence]"))
		fields.addProperty("Target", card.word)
		fields.addProperty("Part", card.part?.english ?: "")
		fields.addProperty("Definition", card.definition)
		return fields
	}

	fun pictureArray(path: String): JsonArray {
		val picture = JsonArray()
		val entry = JsonObject()

		entry.addProperty("url", "http://localhost:${Settings.options.port}/api/images/${ImagePool.CARDS.name.lowercase()}/${path}")
		entry.addProperty("filename", path)
		val pictureFields = JsonArray()
		pictureFields.add("Picture")
		entry.add("fields", pictureFields)

		picture.add(entry)
		return picture
	}

	fun deleteNotesParams(
		ankiId: Long,
	): JsonObject {
		val params = JsonObject()
		val notes = JsonArray()
		notes.add(ankiId)
		params.add("notes", notes)
		return params
	}

	fun findNoteParams(
		deckName: String,
		modelName: String,
		card: Card,
	): JsonObject {
		val params = JsonObject()
		params.addProperty("query", "\"deck:${deckName}\" \"note:${modelName}\" \"CardId:${card.id}\"")
		return params
	}

	fun updateNoteFieldsParams(
		card: Card,
		ankiId: Long,
	): JsonObject {
		val params = JsonObject()
		val note = JsonObject()

		note.addProperty("id", ankiId)
		note.add("fields", fieldsObject(card))
		card.picture?.let { note.add("picture", pictureArray(it)) }

		params.add("note", note)
		return params
	}

	fun addNoteParams(
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
		note.add("fields", fieldsObject(card))
		card.picture?.let { note.add("picture", pictureArray(it)) }

		params.add("note", note)
		return params
	}

	data class AnkiResponse(val error: String?, val result: JsonElement)

	suspend fun jsonPostRequest(requestObj: JsonObject): AnkiResponse {
		val response = client.post("http://localhost:${PORT}") {
			this.contentType(ContentType.Application.Json)
			this.setBody(senderGson.toJson(requestObj))
		}

		return try {
			val body: String = response.body()
			val responseObj = JsonParser.parseString(body).asJsonObject

			AnkiResponse(
				responseObj.getMaybe("error")?.let { if (it.isJsonNull) null else it.asString },
				responseObj.get("result")
			)
		} catch (ex: Exception) {
			throw PrettyException("Could not complete Anki request")
		}
	}

	suspend fun addCardToAnki(deckName: String, modelName: String, card: Card): Long {
		val (error, result) = jsonPostRequest(createRequestObj("addNote", addNoteParams(deckName, modelName, card)))
		if (error == null) return result.asLong

		/* catastrophic failure */
		if (error != "Cannot create note because it is a duplicate") throw PrettyException(error)

		/* note actually already existed, edit it */
		val ankiId = findCardAnkiId(deckName, modelName, card) ?: throw PrettyException("Card exists but also doesn't")

		val (editError) = jsonPostRequest(createRequestObj("updateNoteFields", updateNoteFieldsParams(card, ankiId)))
		if (editError != null) throw PrettyException(editError)

		return ankiId
	}

	suspend fun editCardInAnki(deckName: String, modelName: String, card: Card): Long {
		val ankiId = card.anki?.id ?: throw PrettyException("Card is not linked to Anki")

		val (error) = jsonPostRequest(createRequestObj("updateNoteFields", updateNoteFieldsParams(card, ankiId)))
		if (error == null) return ankiId

		/* note was not found */
		val (addError, addResult) = jsonPostRequest(createRequestObj("addNote", addNoteParams(deckName, modelName, card)))
		if (addError != null) throw PrettyException(addError)

		return addResult.asLong
	}

	/**
	 * @return null if the card does not exist
	 */
	suspend fun findCardAnkiId(deckName: String, modelName: String, card: Card): Long? {
		val (error, result) = jsonPostRequest(createRequestObj("findNotes", findNoteParams(deckName, modelName, card)))
		if (error != null) throw PrettyException("Could not find this card's anki id")

		val results = result.asJsonArray
		if (results.isEmpty) return null
		return results[0].asLong
	}

	suspend fun deleteCardFromAnki(ankiId: Long) {
		val (error) = jsonPostRequest(createRequestObj("deleteNotes", deleteNotesParams(ankiId)))
		if (error != null) throw PrettyException(error)
	}
}

suspend fun main() {
	val cardsDir = File("./run/data/cards")
	val files = cardsDir.listFiles { file -> file.nameWithoutExtension.startsWith("card_") }!!

	val gson = GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create()

	fun findNoteParamsWord(
		deckName: String,
		modelName: String,
		word: String,
	): JsonObject {
		val params = JsonObject()
		params.addProperty("query", "\"deck:${deckName}\" \"note:${modelName}\" \"Target:${word}\"")
		return params
	}

	val zonedDate = ZonedDateTime.now()

	val newContents = files.map { file ->
		val json = JsonParser.parseReader(file.reader()).asJsonObject

		val inAnki = json.getMaybe("inAnki")?.asBoolean ?: false
		json.remove("inAnki")

		if (inAnki) {
			val (_, result) = AnkiConnect.jsonPostRequest(
				AnkiConnect.createRequestObj(
					"findNotes",
					findNoteParamsWord("Sentence Mining", "SME", json.get("word").asString)
				)
			)

			val results = result.asJsonArray
			if (results.isEmpty) {
				println("card ${json.get("id").asInt} doesn't exist in anki anymore")

			} else {
				println("card ${json.get("id").asInt} has anki id ${results[0]}")

				val cardObject = Card(
					json.get("id").asInt,
					json.get("word").asString,
					json.getMaybe("part")?.asString?.let { Part.valueOf(it) },
					json.get("definition").asString,
					json.getMaybe("sentence")?.asString,
					json.getMaybe("picture")?.asString,
					ZonedDateTime.parse(json.get("date").asString),
					ArrayList(),
					null,
				)

				AnkiConnect.jsonPostRequest(
					AnkiConnect.createRequestObj(
						"updateNoteFields",
						AnkiConnect.updateNoteFieldsParams(cardObject, results[0].asLong)
					)
				)

				val ankiStruct = JsonObject()
				ankiStruct.addProperty("id", results[0].asLong)
				ankiStruct.addProperty("added", zonedDate.toString())

				json.add("anki", ankiStruct)

				file.writeText(gson.toJson(json))
			}
		}
	}
}

package com.balduvian.routes

import com.balduvian.*
import com.balduvian.Collection
import com.google.gson.JsonParser
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.ankiRouting() {
	route("/api/anki") {
		post("{id?}") {
			try {
				val id = call.parameters["id"] ?: return@post Util.badRequest(call, "Missing id")
				val idNo = id.toIntOrNull() ?: return@post Util.badRequest(call, "Bad id")
				val card = Collection.getCard(idNo) ?: return@post Util.notFound(call, "Card not found")

				val deckName = Settings.options.deckName ?: return@post Util.notFound(call, "No Deck Name specified")
				val modelName = Settings.options.modelName ?: return@post Util.notFound(call, "No Model Name specified")

				AnkiConnect.request(AnkiConnect.createRequestObj("addNote", AnkiConnect.createNoteParams(deckName, modelName, card)))

				Collection.setCardAnki(card)

				Util.ok(call, "anki'd")

			} catch (ex: Exception) {
				ex.printStackTrace()
				Util.badRequest(call, "Bad anki data")
			}
		}
	}
}
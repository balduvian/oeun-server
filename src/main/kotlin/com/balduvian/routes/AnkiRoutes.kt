package com.balduvian.routes

import com.balduvian.*
import com.balduvian.Collection
import io.ktor.server.application.*
import io.ktor.server.routing.*

suspend inline fun handleError(call: ApplicationCall, crossinline run: suspend (call: ApplicationCall) -> Unit) {
	try {
		run(call)
	} catch (ex: RequestException) {
		Util.errorResponse(call, ex.message, ex.code)
	} catch (ex: Throwable) {
		ex.printStackTrace()
		Util.errorResponse(call, ex.message ?: "Unknown error", 500)
	}
}

fun Route.ankiRouting() {
	fun getCard(call: ApplicationCall): Card {
		val id = call.parameters["id"] ?: throw BadRequestException("Missing id")
		val idNo = id.toIntOrNull() ?: throw BadRequestException("Bad id")
		return Collection.getCard(idNo) ?: throw BadRequestException("Card not found")
	}

	route("/api/anki") {
		post("add/{id?}") {
			handleError(call) {
				val card = getCard(call)
				val (deckName, modelName) = Settings.options.getDeckModelName()

				val ankiId = AnkiConnect.addCardToAnki(deckName, modelName, card)
				Collection.setCardAnki(card, ankiId)

				Util.okJson(call, CardsState(Collection.getCollectionSize(), arrayListOf(card)).serialize())
			}
		}
		post("sync/{id?}") {
			handleError(call) {
				val card = getCard(call)
				val (deckName, modelName) = Settings.options.getDeckModelName()

				val ankiId = AnkiConnect.editCardInAnki(deckName, modelName, card)
				if (ankiId != card.anki?.id) Collection.setCardAnki(card, ankiId)

				Util.okJson(call, CardsState(Collection.getCollectionSize(), arrayListOf(card)).serialize())
			}
		}
		post("sync") {
			Util.badRequest(call, "Not implemented")
		}
	}
}
package com.balduvian.routes

import com.balduvian.*
import com.balduvian.Collection
import com.balduvian.Util.badRequest
import com.balduvian.Util.notFound
import com.balduvian.Util.okJson
import com.google.gson.JsonObject
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.random.Random

fun Route.collectionRouting() {
	route("/api/collection") {
		get("search/{q?}/{limit?}") {
			val query = call.parameters["q"] ?: ""
			val limit = call.parameters["limit"]?.toIntOrNull() ?: return@get badRequest(call, "Missing limit")

			val results = Collection.search(query, limit)

			okJson(call, Collection.serializeSearchResults(results))
		}
		get("{id?}") {
			val id = call.parameters["id"]?.toIntOrNull() ?: return@get badRequest(call, "Missing card id")

			val card = Collection.getCard(id) ?: return@get notFound(call, "Could not find card")

			okJson(call, card.serialize())
		}
		get("homonym/{id?}") {
			val id = call.parameters["id"]?.toIntOrNull() ?: return@get badRequest(call, "Missing homonym id")

			val homonym = Homonyms.getHomonym(id) ?: return@get notFound(call, "Could not find that homonym")

			okJson(call, CardsState(Collection.getCollectionSize(), homonym.cards).serialize())
		}
		get("size") {
			okJson(call, Collection.getCollectionSize().serialize())
		}
		get("homonym/card/{id?}") {
			val id = call.parameters["id"] ?: return@get badRequest(call, "Missing id")
			val idNo = id.toIntOrNull() ?: return@get badRequest(call, "Bad id")

			val card = Collection.getCard(idNo) ?: return@get notFound(call, "Card not found")

			val homonym = Homonyms.getHomonym(card.word) ?: return@get notFound(call, "Homonym not found")

			okJson(call, CardsState(Collection.getCollectionSize(), homonym.cards).serialize())
		}
		get("latest") {
			val collectionSize = Collection.getCollectionSize()

			if (Collection.cardsDateOrder.isEmpty())
				return@get okJson(call, CardsState(collectionSize, ArrayList()).serialize())

			val highest = Collection.cardsDateOrder.lastIndex
			val lowest = (highest - 9).coerceAtLeast(0)

			val sendCards = ArrayList<Card>(highest - lowest + 1)

			for (i in highest downTo lowest) {
				sendCards.add(Collection.cardsDateOrder[i])
			}

			okJson(call, CardsState(collectionSize, sendCards).serialize())
		}
		get("random") {
			val collectionSize = Collection.getCollectionSize()

			if (Collection.cards.isEmpty())
				return@get okJson(call, CardsState(collectionSize, ArrayList()).serialize())

			val card = Collection.cards[Random.nextInt(Collection.cards.size)]

			val homonym = Homonyms.getHomonym(card.word) ?: return@get notFound(call, "Homonym not found")

			okJson(call, CardsState(collectionSize, homonym.cards).serialize())
		}
		put {
			try {
				withContext(Dispatchers.IO) {
					val uploadCard = Card.UploadCard.deserialize(call.receiveStream())
					val (homonym, warnings) = Collection.putCard(uploadCard)

					val response = JsonObject()
					response.addProperty("url", "/cards/homonym/${homonym.id}")
					response.addProperty("word", homonym.word())
					response.add("warnings", warnings.serialize())

					okJson(call, response)
				}
			} catch (ex: PrettyException) {
				badRequest(call, ex.message)
			} catch (ex: Exception) {
				ex.printStackTrace()
				badRequest(call, "bad request")
			}
		}
		delete("{id?}") {
			val id = call.parameters["id"]?.toIntOrNull() ?: return@delete badRequest(call, "Missing card id")

			try {
				val warnings = Collection.removeCard(id)

				val response = JsonObject()
				response.add("warnings", warnings.serialize())

				okJson(call, response)

			} catch (ex: Exception) {
				badRequest(call, "Could not delete card")
			}
		}
	}
}

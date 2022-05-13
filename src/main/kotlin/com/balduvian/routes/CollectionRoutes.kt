package com.balduvian.routes

import com.balduvian.Card
import com.balduvian.PrettyException
import com.balduvian.Collection
import com.balduvian.Homonyms
import com.balduvian.Util.badRequest
import com.balduvian.Util.notFound
import com.balduvian.Util.ok
import com.balduvian.Util.okJson
import com.balduvian.Util.senderGson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.random.Random

fun Route.collectionRouting() {
	route("/api/collection") {
		get("browse") {
			call.respond(Collection.serializeBrowseCards())
		}
		get("search/{q?}/{limit?}") {
			val query = call.parameters["q"] ?: ""
			val limit = call.parameters["limit"]?.toIntOrNull() ?: return@get badRequest(call, "Missing limit")

			val results = Collection.search(query, limit)

			okJson(call, Collection.serializeSearchResults(results))
		}
		get("{id?}") {
			val id = call.parameters["id"]?.toIntOrNull() ?: return@get badRequest(call, "Missing card id")

			val card = Collection.getCard(id) ?: return@get notFound(call, "Could not find card")

			okJson(call, card.serialize(false))
		}
		get("homonym/{id?}") {
			val id = call.parameters["id"]?.toIntOrNull() ?: return@get badRequest(call, "Missing homonym id")

			val homonym = Homonyms.getHomonym(id) ?: return@get notFound(call, "Could not find that homonym")

			okJson(call, homonym.serialize())
		}
		get("size") {
			val obj = JsonObject()
			obj.addProperty("value", Collection.cards.size)
			okJson(call, senderGson.toJson(obj))
		}
		get("homonym/card/{id?}") {
			val id = call.parameters["id"] ?: return@get badRequest(call, "Missing id")
			val idNo = id.toIntOrNull() ?: return@get badRequest(call, "Bad id")

			val card = Collection.getCard(idNo) ?: return@get notFound(call, "Card not found")

			val homonym = Homonyms.getHomonym(card.word) ?: return@get notFound(call, "Homonym not found")

			okJson(call, homonym.serialize())
		}
		get("latest") {
			if (Collection.cards.isEmpty()) return@get okJson(call, Homonyms.Homonym.empty().serialize())

			val highest = Collection.cards.lastIndex
			val lowest = (highest - 9).coerceAtLeast(0)

			val cards = ArrayList<Card>(highest - lowest + 1)

			for (i in highest downTo lowest) {
				cards.add(Collection.cards[i])
			}

			okJson(call, Homonyms.Homonym(0, cards).serialize())
		}
		get("random") {
			if (Collection.cards.isEmpty()) return@get okJson(call, Homonyms.Homonym.empty().serialize())

			val card = Collection.cards[Random.nextInt(Collection.cards.size)]

			val homonym = Homonyms.getHomonym(card.word) ?: return@get notFound(call, "Homonym not found")

			okJson(call, homonym.serialize())
		}
		post {
			try {
				withContext(Dispatchers.IO) {
					val card = Card.deserialize(call.receiveStream())
					val homonym = Collection.addCard(card)

					val jsonObject = JsonObject()
					jsonObject.addProperty("url", "/api/collection/homonym/${homonym.id}")
					jsonObject.addProperty("word", homonym.word())

					okJson(call, senderGson.toJson(jsonObject))
				}
			} catch (ex: PrettyException) {
				badRequest(call, ex.message)
			} catch (ex: Exception) {
				ex.printStackTrace()
				badRequest(call, "Bad card data")
			}
		}
		patch {
			try {
				withContext(Dispatchers.IO) {
					val json = JsonParser.parseReader(call.receiveStream().reader())
					Collection.editCard(json)

					ok(call, "edited")
				}
			} catch (ex: PrettyException) {
				badRequest(call, ex.message)
			} catch (ex: Exception) {
				ex.printStackTrace()
				badRequest(call, "Bad request")
			}
		}
		delete("{id?}") {
			val id = call.parameters["id"]?.toIntOrNull() ?: return@delete badRequest(call, "Missing card id")

			try {
				Collection.removeCard(id)

				ok(call, "deleted")
			} catch (ex: Exception) {
				badRequest(call, "Could not delete card")
			}
		}
	}
}

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

fun Route.collectionRouting() {
	route("/api/collection") {
		get("browse") {
			call.respond(Collection.serializeBrowseCards())
		}
		get("search/{q?}/{limit?}") {
			val query = call.parameters["q"] ?: ""
			val limit = call.parameters["limit"]?.toIntOrNull() ?: return@get badRequest(call, "Missing limit")

			val results = Collection.search(query)

			okJson(call, Collection.serializeSearchResults(results, limit))
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
		post {
			try {
				withContext(Dispatchers.IO) {
					val card = Card.deserialize(call.receiveStream())
					val homonym = Collection.addCard(card)

					okJson(call, homonym.serialize())
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

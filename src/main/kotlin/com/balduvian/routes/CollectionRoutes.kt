package com.balduvian.routes

import com.balduvian.Card
import com.balduvian.PrettyException
import com.balduvian.Collection
import com.balduvian.Homonyms
import com.balduvian.Util.badRequest
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

			call.respond(Collection.serializeSearchResults(results, limit))
		}
		get("{id?}") {
			val id = call.parameters["id"] ?: return@get badRequest(call, "Missing card id")
			val idNo = id.toIntOrNull() ?: return@get badRequest(call, "Bad card id")
			val card = Collection.getCard(idNo) ?: return@get badRequest(call, "Could not find card")

			call.respond(card.serialize(false))
		}
		get("homonym/{id?}") {
			val id = call.parameters["id"] ?: return@get badRequest(call, "Missing homonym id")
			val idNo = id.toIntOrNull() ?: return@get badRequest(call, "Bad id")

			val homonym = Homonyms.getHomonym(idNo) ?: return@get badRequest(call, "Could not find that homonym")
			call.respond(homonym.serialize())
		}
		post {
			try {
				withContext(Dispatchers.IO) {
					val card = Card.deserialize(call.receiveStream())
					val homonym = Collection.addCard(card)

					call.respondText(homonym.serialize())
				}
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
					call.respond("{\"message\":\"Edited\"}")
				}
			} catch (ex: PrettyException) {
				return@patch badRequest(call, ex.message)
			} catch (ex: Exception) {
				return@patch badRequest(call, "Bad request")
			}
		}
		delete("{id?}") {
			val id = call.parameters["id"] ?: return@delete badRequest(call, "Missing card id")
			val idNo = id.toIntOrNull() ?: return@delete badRequest(call, "Bad card id")

			try {
				Collection.removeCard(idNo)
				call.respondText("{\"message\":\"Deleted\"}")

			} catch (ex: Exception) {
				return@delete badRequest(call, "Could not delete card")
			}
		}
	}
}

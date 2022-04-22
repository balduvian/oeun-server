package com.balduvian

import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*

object Util {
	val senderGson = GsonBuilder().create()
	val saverGson = GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create()
	val readerGson = saverGson

	suspend fun badRequest(call: ApplicationCall, message: String) {
		val json = JsonObject()
		json.addProperty("error", message)

		call.respondText(
			senderGson.toJson(json),
			status = HttpStatusCode.BadRequest
		)
	}

	suspend fun notFound(call: ApplicationCall, message: String) {
		val json = JsonObject()
		json.addProperty("error", message)

		call.respondText(
			senderGson.toJson(json),
			status = HttpStatusCode.NotFound
		)
	}

	suspend fun ok(call: ApplicationCall, message: String) {
		val json = JsonObject()
		json.addProperty("message", message)

		call.respondText (
			senderGson.toJson(json),
			status = HttpStatusCode.OK
		)
	}

	suspend fun okJson(call: ApplicationCall, json: String) {
		call.respondText (
			json,
			status = HttpStatusCode.OK
		)
	}
}

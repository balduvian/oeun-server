package com.balduvian

import com.google.gson.GsonBuilder
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*

object Util {
	val senderGson = GsonBuilder().create()
	val saverGson = GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create()
	val readerGson = saverGson

	suspend fun badRequest(call: ApplicationCall, message: String) {
		call.respondText(
			"{\"message\":\"$message\"}",
			status = HttpStatusCode.BadRequest
		)
	}

	suspend fun notFound(call: ApplicationCall, message: String) {
		call.respondText(
			"{\"message\":\"$message\"}",
			status = HttpStatusCode.NotFound
		)
	}
}

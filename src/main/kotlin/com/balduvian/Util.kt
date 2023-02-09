package com.balduvian

import com.google.gson.JsonElement
import com.google.gson.JsonObject
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*

object Util {
	fun JsonObject.getMaybe(field: String): JsonElement? {
		return if (this.has(field)) this.get(field) else null
	}

	suspend fun errorResponse(call: ApplicationCall, message: String, code: Int) {
		val json = JsonObject()
		json.addProperty("error", message)

		call.respondText(
			JsonUtil.senderGson.toJson(json),
			status = HttpStatusCode.fromValue(code)
		)
	}

	suspend fun badRequest(call: ApplicationCall, message: String) {
		val json = JsonObject()
		json.addProperty("error", message)

		call.respondText(
			JsonUtil.senderGson.toJson(json),
			status = HttpStatusCode.BadRequest
		)
	}

	suspend fun notFound(call: ApplicationCall, message: String) {
		val json = JsonObject()
		json.addProperty("error", message)

		call.respondText(
			JsonUtil.senderGson.toJson(json),
			status = HttpStatusCode.NotFound
		)
	}

	suspend fun ok(call: ApplicationCall, message: String) {
		val json = JsonObject()
		json.addProperty("message", message)

		call.respondText (
			JsonUtil.senderGson.toJson(json),
			status = HttpStatusCode.OK
		)
	}

	suspend fun okJson(call: ApplicationCall, json: JsonElement) {
		call.respondText (
			JsonUtil.senderGson.toJson(json),
			status = HttpStatusCode.OK
		)
	}

	suspend fun getImagePool(call: ApplicationCall, name: String?): Images? {
		val pool = if (name == null)
			null
		else
			ImagePool.values().find { imagePool -> imagePool.name.equals(name, true) }

		if (pool == null) {
			notFound(call, "Image pool of name $name not found")
			return null
		}
		return pool.images
	}
}

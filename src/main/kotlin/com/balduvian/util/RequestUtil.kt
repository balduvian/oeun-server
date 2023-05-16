package com.balduvian.util

import com.balduvian.images.ImagePool
import com.balduvian.images.Images
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*

suspend fun errorResponse(call: ApplicationCall, message: String, code: Int) {
	val json = JsonObject()
	json.addProperty("error", message)

	call.respondText(
		JsonUtil.webGson.toJson(json),
		status = HttpStatusCode.fromValue(code)
	)
}

suspend fun badRequest(call: ApplicationCall, message: String) {
	val json = JsonObject()
	json.addProperty("error", message)

	call.respondText(
		JsonUtil.webGson.toJson(json),
		status = HttpStatusCode.BadRequest
	)
}

suspend fun notFound(call: ApplicationCall, message: String) {
	val json = JsonObject()
	json.addProperty("error", message)

	call.respondText(
		JsonUtil.webGson.toJson(json),
		status = HttpStatusCode.NotFound
	)
}

suspend fun ok(call: ApplicationCall, message: String) {
	val json = JsonObject()
	json.addProperty("message", message)

	call.respondText (
		JsonUtil.webGson.toJson(json),
		status = HttpStatusCode.OK
	)
}

suspend fun okJson(call: ApplicationCall, json: JsonElement) {
	call.respondText (
		JsonUtil.webGson.toJson(json),
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

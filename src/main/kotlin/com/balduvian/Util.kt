package com.balduvian

import com.google.gson.GsonBuilder
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import java.io.File

object Util {
	val senderGson = GsonBuilder().create()
	val saverGson = GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create()
	val readerGson = saverGson

	fun JsonObject.getMaybe(field: String): JsonElement? {
		return if (this.has(field)) this.get(field) else null
	}

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

	suspend fun okJson(call: ApplicationCall, json: JsonElement) {
		call.respondText (
			senderGson.toJson(json),
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

fun main() {
	val directory = File("C:\\Users\\Emmet\\Programming\\lang\\java\\oeun-server\\run\\data\\cards")
	val numWords = directory.listFiles { file -> file.extension == "json" }.sumOf { file ->
		val obj = JsonParser.parseReader(file.reader()).asJsonObject
		val sentence = (obj.get("sentence") ?: return@sumOf 0).asString
		sentence.split(' ').size
	}

	println("Total words: $numWords")
}

package com.balduvian

import com.google.gson.GsonBuilder
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import java.io.File
import java.util.Date
import java.time.ZoneId
import java.time.ZonedDateTime

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

fun main() {
	//val directory = File("C:\\Users\\Emmet\\Programming\\lang\\java\\oeun-server\\run\\data\\cards")
	//val numWords = directory.listFiles { file -> file.extension == "json" }.sumOf { file ->
	//	val obj = JsonParser.parseReader(file.reader()).asJsonObject
	//	val sentence = (obj.get("sentence") ?: return@sumOf 0).asString
	//	sentence.split(' ').size
	//}
//
	//println("Total words: $numWords")

	val cardsDir = File("./run/data/cards")
	val files = cardsDir.listFiles { file -> file.nameWithoutExtension.startsWith("card_") }.toMutableList()
	//println(files[1].name)
	files.removeAt(0)
	files.removeAt(0)

	//val newNumbers = IntArray(files.size) { Random.nextInt() }
	//if (newNumbers.toSet().size != newNumbers.size) return println("random failed")

	val gson = GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create()

	//Aug 11, 2022, 12:44:14 PM
	data class Dated(val date: Date)

	val newContents = files.mapIndexed { i, file ->
		val date = gson.fromJson(file.reader(), Dated::class.java).date

		val zonedDate = ZonedDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault())

		val json = JsonParser.parseReader(file.reader()).asJsonObject

		json.remove("date")
		json.addProperty("date", zonedDate.toString())

		file.writeText(gson.toJson(json))
	}

	//newContents.forEachIndexed { i, json ->
	//	val file = File("./run/data/cards/card_${newNumbers[i]}.json")
	//	file.writeText(gson.toJson(json))
	//}
}
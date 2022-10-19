package com.balduvian.routes

import com.balduvian.*
import com.balduvian.Collection
import com.google.gson.JsonParser
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.settingsRouting() {
	route("/api/settings") {
		get {
			Util.okJson(call, Util.senderGson.toJsonTree(Settings.options))
		}
		patch {
			try {
				withContext(Dispatchers.IO) {
					val options = JsonParser.parseReader(call.receiveStream().reader()).asJsonObject

					fun realValue(value: String) = value.trim().ifEmpty { null }

					options.get("deckName")?.let { Settings.options.deckName = realValue(it.asString) }
					options.get("modelName")?.let { Settings.options.modelName = realValue(it.asString) }

					Settings.options.save()

					Util.ok(call, "changed")
				}
			} catch (ex: PrettyException) {
				Util.badRequest(call, ex.message)
			} catch (ex: Exception) {
				ex.printStackTrace()
				Util.badRequest(call, "Bad settings data")
			}
		}
	}
}
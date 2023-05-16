package com.balduvian.routes

import com.balduvian.Settings
import com.balduvian.util.*
import com.google.gson.JsonElement
import com.google.gson.JsonParser
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.settingsRouting() {
	route("/api/settings") {
		get {
			okJson(call, JsonUtil.webGson.toJsonTree(Settings.options))
		}
		patch {
			try {
				withContext(Dispatchers.IO) {
					val options = JsonParser.parseReader(call.receiveStream().reader()).asJsonObject

					fun realValue(value: JsonElement): String? {
						if (value.isJsonNull) return null
						return value.asString.trim().ifEmpty { null }
					}

					fun realValueInt(value: JsonElement) = if (value.isJsonNull) null else value.asInt

					options.get("deckName")?.let { Settings.options.deckName = realValue(it) }
					options.get("modelName")?.let { Settings.options.modelName = realValue(it) }
					options.get("extensionId")?.let { Settings.options.extensionId = realValue(it) }
					options.get("dayCutoffHour")?.let { Settings.options.dayCutoffHour = realValueInt(it) }

					Settings.options.save()

					ok(call, "changed")
				}
			} catch (ex: PrettyException) {
				badRequest(call, ex.message)
			} catch (ex: Exception) {
				ex.printStackTrace()
				badRequest(call, "Bad settings data")
			}
		}
	}
}

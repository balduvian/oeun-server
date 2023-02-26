package com.balduvian.routes

import com.balduvian.JsonUtil
import com.balduvian.PrettyException
import com.balduvian.Settings
import com.balduvian.Util
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
			Util.okJson(call, JsonUtil.senderGson.toJsonTree(Settings.options))
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
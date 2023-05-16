package com.balduvian.`object`

import com.balduvian.util.JsonUtil
import com.google.gson.JsonObject

class Badge(
	var id: String,
	var displayName: String,
	var picture: String,
) {
	fun serialize(): JsonObject {
		return JsonUtil.webGson.toJsonTree(this, Badge::class.java).asJsonObject
	}
}

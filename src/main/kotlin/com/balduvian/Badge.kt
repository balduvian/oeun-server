package com.balduvian

import com.google.gson.JsonObject

enum class Badge(val prettyName: String) {
	KO1K("KO1K"),
	MOMOLAND("Momoland"),
	NOTABLE("Notable word"),
	HANJA("Notable hanja"),
	LEGACY("Legacy");

	companion object {
		val serializedList: String

		init {
			val list = JsonObject()
			values().forEach { badge ->
				list.addProperty(badge.name, badge.prettyName)
			}
			serializedList = Util.senderGson.toJson(list)
		}
	}
}

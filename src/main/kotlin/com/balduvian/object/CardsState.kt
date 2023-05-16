package com.balduvian.`object`

import com.balduvian.util.JsonUtil
import com.google.gson.JsonObject

data class CollectionSize(val size: Int, val addedToday: Int, val ankiToday: Int, val editedToday: Int) {
    fun serialize() = JsonUtil.webGson.toJsonTree(this) as JsonObject
}

data class CardsState(val collectionSize: CollectionSize, val cards: ArrayList<Card>) {
    fun serialize() = JsonUtil.webGson.toJsonTree(this) as JsonObject
}
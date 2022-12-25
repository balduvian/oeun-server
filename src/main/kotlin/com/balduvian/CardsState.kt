package com.balduvian

import com.google.gson.JsonObject

data class CollectionSize(val size: Int, val addedToday: Int, val ankiToday: Int) {
    fun serialize() = JsonUtil.senderGson.toJsonTree(this) as JsonObject
}

data class CardsState(val collectionSize: CollectionSize, val cards: ArrayList<Card>) {
    fun serialize() = JsonUtil.senderGson.toJsonTree(this) as JsonObject
}
package com.balduvian

import com.google.gson.JsonArray

class Warnings(val messages: ArrayList<String>) {
    companion object {
        fun make(): Warnings {
            return Warnings(ArrayList())
        }

        fun makeSingle(message: String): Warnings {
            return Warnings(arrayListOf(message))
        }
    }

    fun add(message: String?) {
        messages.add(message ?: "Unknown error")
    }

    fun serialize(): JsonArray {
        return JsonUtil.senderGson.toJsonTree(messages) as JsonArray
    }
}
package com.balduvian

import com.google.gson.*
import java.lang.reflect.Type
import java.text.DateFormat
import java.time.ZonedDateTime

class ZonedDateTimeSerializer : JsonSerializer<ZonedDateTime> {
    override fun serialize(src: ZonedDateTime, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src.toString())
    }
}

class ZonedDateTimeDeserializer : JsonDeserializer<ZonedDateTime> {
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): ZonedDateTime {
        return ZonedDateTime.parse(json.asString)
    }
}

object JsonUtil {
    val senderGson = GsonBuilder()
        .registerTypeAdapter(ZonedDateTime::class.java, ZonedDateTimeSerializer())
        .registerTypeAdapter(ZonedDateTime::class.java, ZonedDateTimeDeserializer())
        .create()

    val saverGson = GsonBuilder()
        .registerTypeAdapter(ZonedDateTime::class.java, ZonedDateTimeSerializer())
        .registerTypeAdapter(ZonedDateTime::class.java, ZonedDateTimeDeserializer())
        .setPrettyPrinting()
        .disableHtmlEscaping()
        .create()

    val readerGson = saverGson
}

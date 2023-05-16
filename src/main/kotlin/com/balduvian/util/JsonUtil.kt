package com.balduvian.util

import com.balduvian.`object`.Card
import com.google.gson.*
import java.time.ZonedDateTime

fun ZonedDateTime.serialize() = JsonPrimitive(this.toString())

fun parseZonedDateTime(json: JsonElement): ZonedDateTime = ZonedDateTime.parse(json.asString)

object JsonUtil {
	val webGson: Gson
	val localGson: Gson

	init {
		val builder = GsonBuilder()
			.smartRegisterType(ZonedDateTime::serialize) { parseZonedDateTime(it) }
			.smartRegisterSerializeOnly(Card::serialize)

		webGson = builder.create()

		localGson = builder.setPrettyPrinting()
			.disableHtmlEscaping()
			.create()
	}
}

fun JsonObject.getMaybe(field: String): JsonElement? {
	return if (this.has(field)) this.get(field) else null
}

inline fun <reified Type> GsonBuilder.smartRegisterType(
	crossinline serialize: (Type) -> JsonElement,
	crossinline deserialize: (JsonElement) -> Type,
) : GsonBuilder {
	this.registerTypeAdapter(Type::class.java, object : JsonSerializer<Type> {
		override fun serialize(
			src: Type,
			typeOfSrc: java.lang.reflect.Type,
			context: JsonSerializationContext
		) = serialize(src)
	})

	this.registerTypeAdapter(Type::class.java, object : JsonDeserializer<Type> {
		override fun deserialize(
			json: JsonElement,
			typeOfT: java.lang.reflect.Type,
			context: JsonDeserializationContext
		) = deserialize(json)
	})

	return this
}

inline fun <reified Type> GsonBuilder.smartRegisterSerializeOnly(
	crossinline serialize: (Type) -> JsonElement,
) : GsonBuilder {
	this.registerTypeAdapter(Type::class.java, object : JsonSerializer<Type> {
		override fun serialize(
			src: Type,
			typeOfSrc: java.lang.reflect.Type,
			context: JsonSerializationContext
		) = serialize(src)
	})

	return this
}


package com.balduvian

import com.google.gson.JsonObject

enum class Part(val english: String, val korean: String) {
	NOUN("Noun", "명사"),
	NONE("Not a part of speech", "품사 없음"),
	ADVERB("Adverb", "부사"),
	DETERMINER("Determiner", "관형사"),
	INTERJECTION("Interjection", "감탄사"),
	PRONOUN("Pronoun", "대명사"),
	NUMBER("Number", "수사"),
	AFFIX("Affix", "접사"),
	POSTPOSITIONAL_PARTICLE("Postpositional particle", "조사"),
	VERB("Verb", "동사"),
	ADJECTIVE("Adjective", "형용사"),
	AUXILIARY_VERB("Auxiliary verb", "보조 동사"),
	BOUND_NOUN("Bound noun", "의존 명사"),
	WORD_ENDING("Word ending", "어미"),
	AUXILIARY_ADJECTIVE("Auxiliary adjective", "보조 형용사");

	companion object {
		val serializedList: String

		init {
			val list = JsonObject()
			for (part in values()) {
				val obj = JsonObject()
				obj.addProperty("english", part.english)
				obj.addProperty("korean", part.korean)
				list.add(part.name, obj)
			}
			serializedList = Util.senderGson.toJson(list)
		}
	}
}

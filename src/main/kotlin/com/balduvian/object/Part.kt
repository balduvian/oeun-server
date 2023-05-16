package com.balduvian.`object`

import com.google.gson.JsonObject

enum class Part(val english: String, val korean: String, val keybind: Char) {
	NOUN("Noun", "명사", 'n'),
	VERB("Verb", "동사", 'v'),
	ADJECTIVE("Adjective", "형용사", 'a'),
	ADVERB("Adverb", "부사", 'e'),
	BOUND_NOUN("Bound noun", "의존 명사", 'b'),
	DETERMINER("Determiner", "관형사", 'd'),
	NONE("Not a part of speech", "품사 없음", 'q'),
	INTERJECTION("Interjection", "감탄사", 'i'),
	PRONOUN("Pronoun", "대명사", 'p'),
	NUMBER("Number", "수사", 'u'),
	AFFIX("Affix", "접사", 'f'),
	POSTPOSITIONAL_PARTICLE("Postpositional particle", "조사", 'o'),
	AUXILIARY_VERB("Auxiliary verb", "보조 동사", 'l'),
	WORD_ENDING("Word ending", "어미", 'w'),
	AUXILIARY_ADJECTIVE("Auxiliary adjective", "보조 형용사", 'r'),
	GRAMMAR("Expression", "표현", 'x');

	companion object {
		val serializedList = JsonObject()

		init {
			for (part in values()) {
				val obj = JsonObject()
				obj.addProperty("english", part.english)
				obj.addProperty("korean", part.korean)
				obj.addProperty("keybind", part.keybind.toString())

				serializedList.add(part.name, obj)
			}
		}
	}
}

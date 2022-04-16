package com.balduvian

import com.balduvian.Directories.PATH_CARDS
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.stream.JsonWriter
import java.io.File
import java.util.concurrent.CompletableFuture
import kotlin.collections.ArrayList

object Collection {
	/* main data */
	val cards: ArrayList<Card> = ArrayList()

	data class Search(
		val prompt: String,
		val included: ArrayList<Int>,
	)
	val searchCache = ArrayList<Search>()

	fun loadAllCards() {
		val directory = File(PATH_CARDS)
		val files = directory.listFiles { _, name -> Card.isCardFile(name) }
			?: return

		val filesNumbers = files.map {
			val name = it.nameWithoutExtension
			it to name.substring(5 until name.length).toInt()
		} as ArrayList<Pair<File, Int>>

		/* start by having all cards inserted in sorted order */
		filesNumbers.sortBy { (_, num) -> num }

		cards.ensureCapacity(filesNumbers.size)
		for ((file, _) in filesNumbers) {
			try {
				cards.add(Card.deserialize(file.inputStream()))
			} catch (ex: Exception) {
				ex.printStackTrace()
			}
		}
	}

	private fun insertCard(card: Card) {
		val insertIndex = cards.binarySearch { it.id - card.id }
		if (insertIndex < 0) {
			cards.add(-insertIndex - 1, card)
		} else {
			throw Exception("Trying to add duplicate card")
		}
	}

	fun getCard(id: Int): Card? {
		val index = cards.binarySearch { it.id - id }
		return if (index < 0) {
			null
		} else {
			cards[index]
		}
	}

	/**
	 * @return the new card's assigned id
	 */
	fun addCard(newCard: Card): Int {
		val id = if (cards.isEmpty()) 0 else cards.last().id + 1
		newCard.id = id

		insertCard(newCard)

		CompletableFuture.runAsync { newCard.save(PATH_CARDS) }

		return id
	}

	fun editCard(editObject: JsonElement) {
		val obj = editObject.asJsonObject
		val id = obj.get("id")?.asInt ?: throw PrettyException("No card id to edit")

		val collectionCard = getCard(id) ?: throw PrettyException("No such card exists")

		try {
			collectionCard.permuteInto(obj)
			CompletableFuture.runAsync { collectionCard.save(PATH_CARDS) }

		} catch (ex: Exception) {
			throw PrettyException("Bad edit object")
		}
	}

	fun removeCard(id: Int) {
		val removeIndex = cards.binarySearch { it.id - id }
		if (removeIndex < 0) {
			throw Exception("Card does not exist")
		} else {
			cards.removeAt(removeIndex)
		}
	}

	/**
	 * a list of all cards without details
	 */
	fun serializeBrowseCards(): String {
		val array = JsonArray(cards.size)
		for (card in cards) {
			val obj = JsonObject()
			obj.addProperty("word", card.word)
			obj.addProperty("id", card.id)
			array.add(obj)
		}

		return Util.senderGson.toJson(array)
	}

	data class SearchResult(
		val word: String,
		val id: Int,
		val sortValue: Int,
	)

	/**
	 * @return null if the request was bad
	 */
	fun search(phrase: String): ArrayList<SearchResult> {
		if (phrase.isEmpty()) return ArrayList()

		/* potentially incomplete syllable */
		val lastSyllable = Syllable.decompose(phrase.last())

		/* characters to fully match */
		val completedPart = if (lastSyllable != null) {
			phrase.subSequence(0 until phrase.lastIndex)
		} else {
			phrase
		}

		val ret = ArrayList<SearchResult>()

		val matchFunction = if (completedPart.isEmpty() && lastSyllable != null) {
			::matchWordSyllable
		} else {
			::matchWordCompletedPlusSyllable
		}

		for (cardIndex in cards.indices) {
			val word = cards[cardIndex].word

			val (start, match) = matchFunction(completedPart, lastSyllable, word)
			if (match != Syllable.MATCH_NONE) {
				val sortValue = (if (match == Syllable.MATCH_EXACT) 10000 else 0) + start * 1000 + word.length
				val searchResult = SearchResult(word, cards[cardIndex].id, sortValue)

				/* place in descending order */
				val insertPosition = ret.binarySearch { it.sortValue - sortValue }
				if (insertPosition < 0) {
					ret.add(-insertPosition - 1, searchResult)
				} else {
					ret.add(insertPosition, searchResult)
				}
			}
		}

		return ret
	}

	fun serializeSearchResults(results: ArrayList<SearchResult>): String {
		val array = JsonArray(results.size)
		for (result in results) {
			val entry = JsonObject()
			entry.addProperty("word", result.word)
			entry.addProperty("id", result.id)
			array.add(entry)
		}
		return Util.senderGson.toJson(array)
	}

	private fun matchWordSyllable(_unused: CharSequence, syllable: Syllable?, word: String): Pair<Int, Int> {
		for (i in word.indices) {
			val result = matchSyllable(syllable!!, word, i)
			if (result != Syllable.MATCH_NONE) return i to result
		}

		return 0 to Syllable.MATCH_NONE
	}

	/**
	 * @return (start index, match type)
	 */
	private fun matchWordCompletedPlusSyllable(completed: CharSequence, syllable: Syllable?, word: String): Pair<Int, Int> {
		/* look to start matching the completed part in the word */
		var i = 0
		while (i <= word.length - completed.length) {
			val start = i
			if (word[i] == completed[0]) {
				var j = 1; ++i

				/* make sure the rest of the completed part is in the word */
				while (j < completed.length) {
					if (word[i] != completed[j]) break
					++j; ++i
				}

				/* sucessfully matched completed part */
				if (j == completed.length) {
					return if (syllable == null) {
						start to Syllable.MATCH_EXACT
					} else {
						start to matchSyllable(syllable, word, i)
					}
				}
			} else {
				++i
			}
		}

		return 0 to Syllable.MATCH_NONE
	}

	private fun matchSyllable(syllable: Syllable, word: String, index: Int): Int {
		if (index >= word.length) return Syllable.MATCH_NONE

		return syllable.subSyllableOf(
			Syllable.decompose(word[index]) ?: return Syllable.MATCH_NONE,
			if (index >= word.lastIndex) null else Syllable.decompose(word[index + 1])
		)
	}
}

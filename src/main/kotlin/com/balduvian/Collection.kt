package com.balduvian

import com.balduvian.Directories.PATH_CARDS
import com.balduvian.Directories.PATH_TRASH
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import java.io.File
import java.util.concurrent.CompletableFuture
import kotlin.collections.ArrayList

object Collection {
	val cards: ArrayList<Card> = ArrayList()
	init { Homonyms }

	val commands = arrayOf(
		Command("latest", "/api/collection/latest"),
		Command("random", "/api/collection/random"),
	)

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
			val card = try {
				Card.deserialize(file.inputStream())
			} catch (ex: Exception) {
				ex.printStackTrace()
				null
			}

			if (card != null) {
				cards.add(card)
				Homonyms.addCard(card)
			}
		}
	}

	/* ==== INTERFACE ==== */

	fun getCard(id: Int): Card? {
		val index = cards.binarySearch { it.id - id }
		return if (index < 0) {
			null
		} else {
			cards[index]
		}
	}

	fun addCard(newCard: Card): Homonyms.Homonym {
		val id = if (cards.isEmpty()) 0 else cards.last().id + 1
		newCard.id = id

		/* insert */
		val insertIndex = cards.binarySearch { it.id - id }
		val homonym = if (insertIndex < 0) {
			cards.add(-insertIndex - 1, newCard)
			Homonyms.addCard(newCard)
		} else {
			throw PrettyException("Trying to add duplicate card")
		}

		CompletableFuture.runAsync { newCard.save(PATH_CARDS) }

		return homonym
	}

	fun editCard(editObject: JsonElement) {
		val obj = editObject.asJsonObject
		val id = obj.get("id")?.asInt ?: throw PrettyException("No card id to edit")

		val collectionCard = getCard(id) ?: throw PrettyException("No such card exists")

		try {
			val oldWord = collectionCard.word
			collectionCard.permuteInto(obj)
			Homonyms.renameCard(collectionCard, oldWord)

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
			Homonyms.removeCard(cards[removeIndex])
			val card = cards.removeAt(removeIndex)

			CompletableFuture.runAsync {
				card.unsave(PATH_CARDS)
				card.save(PATH_TRASH, true)
			}
		}
	}

	/* ==== SEARCH ==== */

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

	data class PreSearchResult(
		val word: String,
		val sortValue: Int,
		val id: Int,
	)

	data class OutSearchResult(
		val word: String,
		val id: Int,
		val url: String,
	)

	/**
	 * @return null if the request was bad
	 */
	fun search(phrase: String, limit: Int): ArrayList<OutSearchResult> {
		if (phrase.isEmpty()) return ArrayList()

		if (phrase.startsWith('!')) {
			return commands.zip(commands.indices).mapNotNull { (command, i) ->
				if (command.commandName.startsWith(phrase.subSequence(1, phrase.length))) {
					OutSearchResult('!' + command.commandName, i, command.url)
				} else {
					null
				}
			} as ArrayList<OutSearchResult>
		}

		if (phrase.startsWith("#")) {
			val number = phrase.substring(1).toIntOrNull()
				?: cards.lastOrNull()?.id
				?: return ArrayList()

			var highest = cards.binarySearch { card -> card.id - number }
			if (highest < 0) highest = -highest - 1
			val lowest = (highest - limit + 1).coerceAtLeast(0)

			val ret = ArrayList<OutSearchResult>(limit)

			for (i in highest downTo lowest) {
				val card = cards[i]
				ret.add(OutSearchResult(
					card.word,
					card.id,
					"/api/collection/homonym/card/${card.id}"
				))
			}

			return ret
		}

		/* potentially incomplete syllable */
		val lastSyllable = Syllable.decompose(phrase.last())

		/* characters to fully match */
		val completedPart = if (lastSyllable != null) {
			phrase.subSequence(0 until phrase.lastIndex)
		} else {
			phrase
		}

		val ret = ArrayList<PreSearchResult>()

		val matchFunction = if (completedPart.isEmpty() && lastSyllable != null) {
			::matchWordSyllable
		} else {
			::matchWordCompletedPlusSyllable
		}

		for (homonym in Homonyms.HomonymListIterator()) {
			val word = homonym.word()

			val (start, match) = matchFunction(completedPart, lastSyllable, word)
			if (match != Syllable.MATCH_NONE) {
				val sortValue = (if (match == Syllable.MATCH_EXACT) 0 else 10000) + (if (start == 0) 0 else 1000) + word.length
				val searchResult = PreSearchResult(word, sortValue, homonym.id)

				val insertPosition = ret.binarySearch { it.sortValue - sortValue }
				if (insertPosition < 0) {
					ret.add(-insertPosition - 1, searchResult)
				} else {
					ret.add(insertPosition, searchResult)
				}
			}
		}

		return ret.take(limit).map { pre ->
			OutSearchResult(pre.word, pre.id, "/api/collection/homonym/${pre.id}")
		} as ArrayList<OutSearchResult>
	}

	fun serializeSearchResults(results: ArrayList<OutSearchResult>): String {
		val array = JsonArray(results.size)
		for (result in results) {
			val entry = JsonObject()

			entry.addProperty("word", result.word)
			entry.addProperty("id", result.id)
			entry.addProperty("url", result.url)

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

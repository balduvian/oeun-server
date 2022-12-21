package com.balduvian

import com.balduvian.Directories.PATH_CARDS
import com.balduvian.Directories.PATH_TRASH
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import java.io.File
import java.nio.channels.SeekableByteChannel
import java.time.ZonedDateTime
import java.util.concurrent.CompletableFuture
import kotlin.random.Random

object Collection {
	val cards: ArrayList<Card> = ArrayList()
	val cardsDateOrder: ArrayList<Card> = ArrayList()

	init { Homonyms }

	val commands = arrayOf(
		Command("latest", "/cards/latest"),
		Command("random", "/cards/random"),
		Command("settings", "/settings"),
	)

	fun loadAllCards() {
		val directory = File(PATH_CARDS.path)
		val files = directory.listFiles { _, name -> Card.isCardFile(name) } ?: return

		cards.ensureCapacity(files.size)
		cardsDateOrder.ensureCapacity(files.size)

		for (file in files) {
			try {
				Card.deserialize(file.inputStream())
			} catch (ex: Exception) {
				ex.printStackTrace()
				null
			}?.let { card ->
				cards.add(card)
				cardsDateOrder.add(card)
				Homonyms.addCard(card)
			}
		}

		cards.sortBy { it.id }
		cardsDateOrder.sortBy { it.date.toInstant() }
	}

	fun findDateCardIndex(date: ZonedDateTime): Int? {
		val instant = date.toInstant()
		val index = cardsDateOrder.binarySearch { it.date.toInstant().compareTo(instant) }
		return if (index < 0) null else index
	}

	/**
	 * @return id, insert index
	 */
	private fun findNewId(): Pair<Int, Int> {
		while (true) {
			val id = Random.nextInt()
			val index = cards.binarySearch { it.id - id }
			/* id doesn't exist yet */
			if (index < 0) return id to -index - 1
		}
	}

	private fun addCard(uploadCard: Card.UploadCard): Homonyms.Homonym {
		val (id, insertIndex) = findNewId()
		val card = Card.fromUpload(id, uploadCard)

		cards.add(insertIndex, card)
		cardsDateOrder.add(card)
		val homonym = Homonyms.addCard(card)

		CompletableFuture.runAsync { card.save(PATH_CARDS.path) }

		return homonym
	}

	private suspend fun editCard(id: Int, uploadCard: Card.UploadCard): Pair<Homonyms.Homonym, Warnings> {
		val collectionCard = getCard(id) ?: throw PrettyException("Card with id=${id} doesn't exist")

		val ankiData = collectionCard.anki
		val isInAnki = uploadCard.anki

		val oldWord = collectionCard.word
		collectionCard.permuteInto(uploadCard)
		val homonym = Homonyms.renameCard(collectionCard, oldWord) ?: throw PrettyException("Could not rename card")

		val warnings = Warnings.make()
		if (ankiData != null) try {
			if (isInAnki) {
				val (deckName, modelName) = Settings.options.getDeckModelName()
				ankiData.id = AnkiConnect.editCardInAnki(deckName, modelName, collectionCard)
			} else {
				AnkiConnect.deleteCardFromAnki(ankiData.id)
				collectionCard.anki = null
			}
		} catch (ex: Throwable) {
			warnings.add(ex.message)
		}

		CompletableFuture.runAsync { collectionCard.save(PATH_CARDS.path) }

		return homonym to warnings
	}

	/* ==== INTERFACE ==== */

	suspend fun putCard(uploadCard: Card.UploadCard): Pair<Homonyms.Homonym, Warnings> {
		return if (uploadCard.id == null)
			addCard(uploadCard) to Warnings.make()
		else
			editCard(uploadCard.id, uploadCard)
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
	 * @param ankiId set to null to remove from anki
	 */
	fun setCardAnki(card: Card, ankiId: Long?) {
		card.anki = ankiId?.let { Card.AnkiData(it, ZonedDateTime.now()) }
		CompletableFuture.runAsync { card.save(PATH_CARDS.path) }
	}

	suspend fun removeCard(id: Int): Warnings {
		val removeIndex = cards.binarySearch { it.id - id }
		if (removeIndex < 0) throw Exception("Card does not exist")

		Homonyms.removeCard(cards[removeIndex])
		val card = cards.removeAt(removeIndex)
		findDateCardIndex(card.date)?.let { cardsDateOrder.removeAt(it) }

		val warnings = Warnings.make()

		card.anki?.let { (ankiId) ->
			try {
				AnkiConnect.deleteCardFromAnki(ankiId)
			} catch (ex: Throwable) {
				warnings.add(ex.message)
			}
		}

		CompletableFuture.runAsync {
			card.unsave(PATH_CARDS.path)
			card.save(PATH_TRASH.path, true)
			//TODO move image to trash
		}

		return warnings
	}

	/* ==== SEARCH ==== */

	data class PreSearchResult(
		val word: String,
		val sortValue: Int,
		val homonymId: Int,
		val numbers: ArrayList<Int>,
	)

	data class OutSearchResult(
		val word: String,
		val numbers: ArrayList<Int>,
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
					OutSearchResult('!' + command.commandName, arrayListOf(i + 1), command.url)
				} else {
					null
				}
			} as ArrayList<OutSearchResult>
		}

		/* card number searching */
		if (phrase.startsWith("#")) {
			val searchIndex = phrase.substring(1).toIntOrNull()?.minus(1) ?: cardsDateOrder.lastIndex
			if (searchIndex == -1) return ArrayList()

			val high = searchIndex.coerceAtMost(cardsDateOrder.lastIndex)
			val low = (searchIndex - limit + 1).coerceAtLeast(0)

			val results = ArrayList<OutSearchResult>(limit)

			for (i in high downTo low) {
				val card = cardsDateOrder[i]
				results.add(OutSearchResult(
					card.word,
					arrayListOf(i + 1),
					"/cards/card/${card.id}"
				))
			}

			return results
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
				val searchResult = PreSearchResult(word, sortValue, homonym.id, homonym.cards.mapNotNull { card ->
					findDateCardIndex(card.date)?.plus(1)
				} as ArrayList<Int>)

				val insertPosition = ret.binarySearch { it.sortValue - sortValue }
				if (insertPosition < 0) {
					ret.add(-insertPosition - 1, searchResult)
				} else {
					ret.add(insertPosition, searchResult)
				}
			}
		}

		return ret.take(limit).map { pre ->
			OutSearchResult(pre.word, pre.numbers, "/cards/homonym/${pre.homonymId}")
		} as ArrayList<OutSearchResult>
	}

	fun serializeSearchResults(results: ArrayList<OutSearchResult>): JsonArray {
		val array = JsonArray(results.size)
		for (result in results) {
			val entry = JsonObject()

			val numbers = JsonArray(result.numbers.size)
			for (number in result.numbers) numbers.add(number)
			entry.add("numbers", numbers)

			entry.addProperty("word", result.word)
			entry.addProperty("url", result.url)

			array.add(entry)
		}
		return array
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

package com.balduvian

import com.balduvian.Directories.PATH_CARDS
import com.balduvian.Directories.PATH_TRASH
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import java.nio.file.Path
import java.time.LocalDate
import java.time.ZonedDateTime
import java.util.Base64
import java.util.concurrent.CompletableFuture
import kotlin.random.Random

object Collection {
	val cards: ArrayList<Card> = ArrayList()
	val cardsDateOrder: ArrayList<Card> = ArrayList()
	val addedToday = object : CardsToday() {
		override fun getDate(card: Card, today: LocalDate) = card.date
	}
	val ankiToday = object : CardsToday() {
		override fun getDate(card: Card, today: LocalDate) = card.anki?.added
	}
	val editedToday = object : CardsToday() {
		override fun getDate(card: Card, today: LocalDate) = if (card.date.toLocalDate() == today) null else card.edited
	}

	init { Homonyms }

	val commands = arrayOf(
		Command("latest", "/cards/latest"),
		Command("random", "/cards/random"),
		Command("settings", "/settings"),
	)

	fun loadAllCards() {
		val directory = PATH_CARDS.path.toFile()
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

		val now = ZonedDateTime.now()
		addedToday.load(cards, now)
		ankiToday.load(cards, now)
		editedToday.load(cards, now)
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
			val index = cards.binarySearch { it.id.compareTo(id) }
			/* id doesn't exist yet */
			if (index < 0) return id to -index - 1
		}
	}

	private fun isDataURL(pictureData: String): Boolean {
		return pictureData.startsWith("data:image/")
	}

	private fun handleCardsUploadedPicture(uploadPictureData: String?): String? {
		if (uploadPictureData == null || !isDataURL(uploadPictureData)) return uploadPictureData

		return try {
			val filename = Images.imageFilename()

			val pictureBytes = Base64.getDecoder().decode(uploadPictureData.substring(uploadPictureData.indexOf(',') + 1))
			ImagePool.CARDS.images.saveImage(filename, pictureBytes.inputStream())

			filename

		} catch (ex: Throwable) {
			throw PrettyException("Invalid picture data")
		}
	}

	private fun addCard(uploadCard: Card.UploadCard): Pair<Homonyms.Homonym, Warnings> {
		val warnings = Warnings.make()
		val (id, insertIndex) = findNewId()

		val pictureFilename = handleCardsUploadedPicture(uploadCard.picture)
		val card = Card.fromUpload(id, uploadCard, pictureFilename)

		cards.add(insertIndex, card)
		cardsDateOrder.add(card)
		val homonym = Homonyms.addCard(card)
		addedToday.onAddCard(card, card.date)

		CompletableFuture.runAsync { card.save(PATH_CARDS.path, card.filename()) }

		return homonym to warnings
	}

	private suspend fun editCardInAnki(collectionCard: Card, ankiData: Card.AnkiData) {
		val (deckName, modelName) = Settings.options.getDeckModelName()
		ankiData.id = AnkiConnect.editCardInAnki(deckName, modelName, collectionCard)
	}

	private suspend fun removeCardFromAnki(collectionCard: Card, ankiData: Card.AnkiData, now: ZonedDateTime) {
		AnkiConnect.deleteCardFromAnki(ankiData.id)
		ankiToday.onRemoveCard(collectionCard, now)
		collectionCard.anki = null
	}

	private fun wasCardChanged(collectionCard: Card, uploadCard: Card.UploadCard, pictureFilename: String?): Boolean {
		return collectionCard.word != uploadCard.word || collectionCard.part != uploadCard.part ||
			collectionCard.definition != uploadCard.definition ||
			collectionCard.sentence != uploadCard.sentence ||
			collectionCard.picture != pictureFilename ||
			collectionCard.badges != uploadCard.badges ||
			(collectionCard.anki != null) != uploadCard.anki
	}

	private suspend fun editCard(id: Int, uploadCard: Card.UploadCard): Pair<Homonyms.Homonym, Warnings> {
		val warnings = Warnings.make()

		val now = ZonedDateTime.now()
		val collectionCard = getCard(id) ?: throw PrettyException("Card with id=${id} doesn't exist")

		val oldAnkiData = collectionCard.anki
		val isInAnkiNow = uploadCard.anki

		val newPictureFilename = handleCardsUploadedPicture(uploadCard.picture)
		val wasChanged = wasCardChanged(collectionCard, uploadCard, newPictureFilename)

		val homonym = Homonyms.renameCard(collectionCard, newWord = uploadCard.word, oldWord = collectionCard.word)
			?: throw PrettyException("Could not rename card")

		if (wasChanged) {
			/* update picture */
			if (newPictureFilename != collectionCard.picture)
				collectionCard.picture?.let { ImagePool.CARDS.images.moveToTrash(Path.of(it)) }

			/* permute card */
			collectionCard.part = uploadCard.part
			collectionCard.definition = uploadCard.definition
			collectionCard.sentence = uploadCard.sentence
			collectionCard.picture = newPictureFilename
			collectionCard.badges = uploadCard.badges

			/* update card in anki */
			if (oldAnkiData != null) try {
				if (isInAnkiNow)
					editCardInAnki(collectionCard, oldAnkiData)
				else
					removeCardFromAnki(collectionCard, oldAnkiData, now)
			} catch (ex: Throwable) {
				warnings.add(ex.message)
			}

			editedToday.onAddCard(collectionCard, now)

			CompletableFuture.runAsync { collectionCard.save(PATH_CARDS.path, collectionCard.filename()) }
		}

		return homonym to warnings
	}

	/* ==== INTERFACE ==== */

	suspend fun putCard(uploadCard: Card.UploadCard): Pair<Homonyms.Homonym, Warnings> {
		return if (uploadCard.id == null)
			addCard(uploadCard)
		else
			editCard(uploadCard.id, uploadCard)
	}

	fun getCard(id: Int): Card? {
		val index = cards.binarySearch { it.id.compareTo(id) }
		return if (index < 0) {
			null
		} else {
			cards[index]
		}
	}

	fun getCollectionSize(): CollectionSize {
		val now = ZonedDateTime.now()
		return CollectionSize(cards.size, addedToday.get(now).size, ankiToday.get(now).size, editedToday.get(now).size)
	}

	/**
	 * @param ankiId set to null to remove from anki
	 */
	fun setCardAnki(card: Card, ankiId: Long?) {
		val now = ZonedDateTime.now()
		card.anki = ankiId?.let { Card.AnkiData(it, now) }
		ankiToday.onAddCard(card, now)
		CompletableFuture.runAsync { card.save(PATH_CARDS.path, card.filename()) }
	}

	suspend fun removeCard(id: Int): Warnings {
		val removeIndex = cards.binarySearch { it.id.compareTo(id) }
		if (removeIndex < 0) throw Exception("Card does not exist")

		Homonyms.removeCard(cards[removeIndex])
		val card = cards.removeAt(removeIndex)
		findDateCardIndex(card.date)?.let { cardsDateOrder.removeAt(it) }

		val now = ZonedDateTime.now()
		addedToday.onRemoveCard(card, now)
		ankiToday.onRemoveCard(card, now)
		editedToday.onRemoveCard(card, now)

		val warnings = Warnings.make()
		card.anki?.let { (ankiId) ->
			try {
				AnkiConnect.deleteCardFromAnki(ankiId)
			} catch (ex: Throwable) {
				warnings.add(ex.message)
			}
		}

		CompletableFuture.runAsync {
			card.delete(PATH_CARDS.path, card.filename())
			card.save(PATH_TRASH.path, Card.scrambledName())

			card.picture?.let { ImagePool.CARDS.images.moveToTrash(Path.of(it)) }
		}

		return warnings
	}

	/* ==== SEARCH ==== */

	data class PreSearchResult(
		val word: String,
		val sortValue: Int,
		val homonymId: Int
	)

	data class OutSearchResult(
		val word: String,
		val numbers: ArrayList<Int>,
		val url: String,
		val definitions: ArrayList<String>,
	)

	/**
	 * @return null if the request was bad
	 */
	fun search(phrase: String, limit: Int): ArrayList<OutSearchResult> {
		if (phrase.isEmpty()) return ArrayList()

		if (phrase.startsWith('!')) {
			return commands.zip(commands.indices).mapNotNull { (command, i) ->
				if (command.commandName.startsWith(phrase.subSequence(1, phrase.length))) {
					OutSearchResult('!' + command.commandName, arrayListOf(i + 1), command.url, ArrayList())
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
					"/cards/card/${card.id}",
					arrayListOf(card.definition)
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
				val searchResult = PreSearchResult(word, sortValue, homonym.id)

				val insertPosition = ret.binarySearch { it.sortValue.compareTo(sortValue) }
				if (insertPosition < 0) {
					ret.add(-insertPosition - 1, searchResult)
				} else {
					ret.add(insertPosition, searchResult)
				}
			}
		}
		
		return ret.take(limit).map { pre ->
			val homonym = Homonyms.getHomonym(pre.homonymId)

			OutSearchResult(
				pre.word,
				homonym?.cards?.mapNotNull { card -> findDateCardIndex(card.date)?.plus(1) } as ArrayList<Int>? ?: ArrayList(),
				"/cards/homonym/${pre.homonymId}",
				homonym?.cards?.map { card -> card.definition } as ArrayList<String>? ?: ArrayList()
			)
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

			val definitions = JsonArray(result.definitions.size)
			for (definition in result.definitions) definitions.add(definition)
			entry.add("definitions", definitions)

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

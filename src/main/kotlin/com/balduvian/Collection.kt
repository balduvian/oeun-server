package com.balduvian

import com.balduvian.Directories.PATH_CARDS
import com.balduvian.Directories.PATH_TRASH
import java.nio.file.Path
import java.time.LocalDate
import java.time.ZonedDateTime
import java.util.concurrent.Executors
import kotlin.random.Random

object Collection {
	private val saverPool = Executors.newFixedThreadPool(1)

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

	private fun addCard(uploadCard: Card.UploadCard): Pair<Homonyms.Homonym, Warnings> {
		val warnings = Warnings.make()
		val (id, insertIndex) = findNewId()

		val pictureFilename = ImagePool.CARDS.images.handleUploadedPicture(null, uploadCard.picture)
		val card = Card.fromUpload(id, uploadCard, pictureFilename)

		cards.add(insertIndex, card)
		cardsDateOrder.add(card)
		val homonym = Homonyms.addCard(card)
		addedToday.onAddCard(card, card.date)

		saverPool.execute { card.save(PATH_CARDS.path, card.filename()) }

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

		val newPictureFilename = ImagePool.CARDS.images.handleUploadedPicture(collectionCard.picture, uploadCard.picture)
		val wasChanged = wasCardChanged(collectionCard, uploadCard, newPictureFilename)

		val homonym = Homonyms.renameCard(collectionCard, newWord = uploadCard.word, oldWord = collectionCard.word)
			?: throw PrettyException("Could not rename card")

		if (wasChanged) {
			/* permute card */
			collectionCard.part = uploadCard.part
			collectionCard.definition = uploadCard.definition
			collectionCard.sentence = uploadCard.sentence
			collectionCard.picture = newPictureFilename
			collectionCard.badges = uploadCard.badges
			collectionCard.edited = now

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

			saverPool.execute { collectionCard.save(PATH_CARDS.path, collectionCard.filename()) }
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
		saverPool.execute { card.save(PATH_CARDS.path, card.filename()) }
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

		saverPool.execute {
			card.delete(PATH_CARDS.path, card.filename())
			card.save(PATH_TRASH.path, Card.scrambledName())

			card.picture?.let { ImagePool.CARDS.images.moveToTrash(Path.of(it)) }
		}

		return warnings
	}
}

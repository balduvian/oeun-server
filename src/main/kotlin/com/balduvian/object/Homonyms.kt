package com.balduvian.`object`

object Homonyms {
	data class Homonym(val id: Int, val cards: ArrayList<Card>) {
		fun word() = cards.first().word

		fun insertInto(card: Card) {
			val instant = card.date.toInstant()
			val insertIndex = cards.binarySearch { it.date.toInstant().compareTo(instant) }
			cards.add(if (insertIndex < 0) -insertIndex - 1 else insertIndex, card)
		}
	}

	private val homonymMap: HashMap<String, Homonym> = HashMap(2048)
	/* entries get deleted in-place, empty arraylists are left behind */
	private val homonymList: ArrayList<Homonym> = ArrayList(2048)

	class HomonymListIterator : Iterator<Homonym> {
		var index = 0

		override fun hasNext(): Boolean {
			while (index < homonymList.size && homonymList[index].cards.isEmpty()) {
				++index
			}
			return index < homonymList.size
		}

		override fun next(): Homonym {
			val ret = homonymList[index]
			++index
			return ret
		}
	}

	private fun nextId(): Int {
		return (homonymList.lastOrNull()?.id ?: -1) + 1
	}

	private fun indexOf(id: Int): Int {
		return homonymList.binarySearch { it.id.compareTo(id) }
	}

	fun addCard(card: Card): Homonym {
		val homonym = homonymMap.getOrPut(card.word) { Homonym(nextId(), ArrayList()) }

		/* new homonym */
		if (homonym.cards.isEmpty()) {
			val index = indexOf(homonym.id)
			homonymList.add(-index - 1, homonym)
		}

		/* insert into homonym sorted by date */
		homonym.insertInto(card)

		return homonym
	}

	/** @return if the removal was successful */
	fun removeCard(card: Card): Boolean {
		val homonym = homonymMap[card.word] ?: return false

		return internalRemoveCard(homonym, card.id, card.word)
	}

	private fun internalRemoveCard(homonym: Homonym, cardId: Int, word: String): Boolean {
		/* remove the card from the homonym */
		homonym.cards.removeIf { it.id == cardId }

		/* remove homonym as a whole if that was the last card */
		if (homonym.cards.isEmpty()) {
			homonymMap.remove(word)
			/* do not remove homonym from the list to prevent shifting */
		}

		return true
	}

	/** @return the new homonym for the card, if renamed or not, null if error */
	fun renameCard(card: Card, newWord: String, oldWord: String): Homonym? {
		val oldHomonym = getHomonym(oldWord) ?: return null
		if (newWord == oldWord) return oldHomonym

		card.word = newWord

		internalRemoveCard(oldHomonym, card.id, oldWord)
		return addCard(card)
	}

	private fun internalGetHomonym(homonymId: Int): Homonym? {
		val index = indexOf(homonymId)
		return if (index < 0) null else homonymList[index]
	}

	fun getHomonym(homonymId: Int): Homonym? {
		val homonym = internalGetHomonym(homonymId) ?: return null

		/* in case you queried a deleted homonym somehow */
		return if (homonym.cards.isEmpty()) null else homonym
	}

	fun getHomonym(word: String): Homonym? {
		return homonymMap[word]
	}
}

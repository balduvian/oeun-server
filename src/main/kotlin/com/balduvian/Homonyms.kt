package com.balduvian

object Homonyms {
	data class Homonym(val id: Int, val cards: ArrayList<Card>) {
		fun word() = cards.first().word

		fun serialize(): String {
			return Util.senderGson.toJson(this)
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
		return homonymList.binarySearch { it.id - id }
	}

	fun addCard(card: Card): Homonym {
		val homonym = homonymMap.getOrPut(card.word) { Homonym(nextId(), ArrayList()) }

		/* new homonym */
		if (homonym.cards.isEmpty()) {
			val index = indexOf(homonym.id)
			homonymList.add(-index - 1, homonym)
		}

		homonym.cards.add(card)

		return homonym
	}

	/** @return if the removal was successful */
	fun removeCard(card: Card): Boolean {
		val homonym = homonymMap[card.word] ?: return false

		return internalRemoveCard(homonym, card.id, card.word)
	}

	private fun internalRemoveCard(homonym: Homonym, id: Int, word: String): Boolean {
		/* remove the exact card from the homonym */
		homonym.cards.removeIf { it.id == id }

		/* remove homonym as a whole */
		if (homonym.cards.isEmpty()) {
			homonymMap.remove(word)
			/* do not remove homonym from the list to prevent shifting */
		}

		return true
	}

	/** @return if the renaming was successful */
	fun renameCard(card: Card, oldWord: String): Boolean {
		if (card.word == oldWord) return false

		val homonym = internalGetHomonym(card.id) ?: return false

		internalRemoveCard(homonym, card.id, oldWord)

		addCard(card)

		return true
	}

	private fun internalGetHomonym(id: Int): Homonym? {
		val index = indexOf(id)
		if (index < 0) return null
		return homonymList[index]
	}

	fun getHomonym(id: Int): Homonym? {
		val homonym = internalGetHomonym(id) ?: return null

		/* in case you queried a deleted homonym somehow */
		return if (homonym.cards.isEmpty()) null else homonym
	}

	fun getHomonym(word: String): Homonym? {
		return homonymMap[word]
	}
}

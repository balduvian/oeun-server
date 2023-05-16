package com.balduvian.search

import com.balduvian.Collection
import com.balduvian.`object`.Homonyms
import com.google.gson.JsonArray
import com.google.gson.JsonObject

object Search {
    val commands = arrayOf(
        Command("latest", "/cards/latest"),
        Command("random", "/cards/random"),
        Command("settings", "/settings"),
        Command("badges", "/badges"),
    )

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
            val searchIndex = phrase.substring(1).toIntOrNull()?.minus(1) ?: Collection.cardsDateOrder.lastIndex
            if (searchIndex == -1) return ArrayList()

            val high = searchIndex.coerceAtMost(Collection.cardsDateOrder.lastIndex)
            val low = (searchIndex - limit + 1).coerceAtLeast(0)

            val results = ArrayList<OutSearchResult>(limit)

            for (i in high downTo low) {
                val card = Collection.cardsDateOrder[i]
                results.add(
                    OutSearchResult(
                    card.word,
                    arrayListOf(i + 1),
                    "/cards/card/${card.id}",
                    arrayListOf(card.definition)
                )
                )
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
            Search::matchWordSyllable
        } else {
            Search::matchWordCompletedPlusSyllable
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
                homonym?.cards?.mapNotNull { card -> Collection.findDateCardIndex(card.date)?.plus(1) } as ArrayList<Int>? ?: ArrayList(),
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
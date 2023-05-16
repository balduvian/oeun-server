package com.balduvian.util

class SuperPattern(matches: List<String>) {
	data class Match(val match: String, val index: Int)

	data class Result(val foundIndex: Int, val range: IntRange)

	private val indexedMatches = Array(matches.size) { index -> Match(matches[index], index) }

	init { indexedMatches.sortBy { it.match.length } }

	fun match(string: String, startIndex: Int): Result? {
		if (startIndex >= string.length) return null

		val currentIndices = IntArray(indexedMatches.size)

		for (stringIndex in startIndex until string.length) {
			val char = string[stringIndex]

			for (i in indexedMatches.indices) {
				val match = indexedMatches[i]

				if (char == match.match[currentIndices[i]]) {
					if (++currentIndices[i] == match.match.length) {
						return Result(match.index, (stringIndex - match.match.length + 1)..stringIndex)
					}
				} else {
					currentIndices[i] = 0
				}
			}
		}

		return null
	}
}

package com.balduvian.util

import com.google.gson.JsonArray
import com.google.gson.JsonObject

object Highlighter {
	enum class Idol(val color: Int) {
		나연(0x5bc2e7),
		정연(0xc5d97a),
		모모(0xff8da1),
		사나(0x987dd4),
		지효(0xffc56e),
		미나(0x6dcdb8),
		다현(0xffffff),
		채영(0xee2737),
		쯔위(0x005eb8),
		혜빈(0xa1258e),
		제인(0xe67a9f),
		연우(0x404040),
		태하(0x047501),
		주이(0xf2e694),
		데이지(0xe87110),
		아인(0x89f5f3),
		나윤(0xeb0c0c),
		낸시(0x590816),
		닝닝(0xc22506),
		카리나(0x6b0ecf),
		지젤(0x0da305),
		윈터(0x1c3c6b),
		류진(0xf2d046),
		예지(0xa40fb8),
		리아(0x45c9f5),
		유나(0x55ed5a),
		채령(0x9c2a35),
	}

	enum class HighlightType {
		NONE,
		TARGET,
		NAME,
		IDOL,
	}

	enum class TokenType(val plainText: String, val highlightType: HighlightType) {
		PLAIN("", HighlightType.NONE),
		STAR("**", HighlightType.TARGET),
		DASH("__", HighlightType.NAME),
	}

	data class Token(val tokenType: TokenType, val string: String)
	data class Highlight(val string: String, val highlightType: HighlightType, val special: Int) {
		companion object {
			fun create(string: String, highlightType: HighlightType) = Highlight(string, highlightType, 0)
			fun createIdol(string: String, idolIndex: Int) = Highlight(string, HighlightType.IDOL, idolIndex)
		}

		fun toColor() = String.format("#%06x", Idol.values()[special].color)

		fun serialize(): JsonObject {
			val obj = JsonObject()

			obj.addProperty("string", string)
			obj.addProperty("bold", highlightType == HighlightType.TARGET)
			obj.addProperty("italic", highlightType == HighlightType.NAME)
			obj.addProperty("color", if (highlightType == HighlightType.IDOL) toColor() else null)


			return obj
		}
	}

	fun multiSerialize(list: List<Highlight>): JsonArray {
		val array = JsonArray()

		for (highlight in list) {
			array.add(highlight.serialize())
		}

		return array
	}

	private val tokensPattern = SuperPattern(arrayListOf("**", "__"))

	private val idolsPattern = SuperPattern(Idol.values().map { it.name })

	private fun firstRoundHighlights(string: String): ArrayList<Highlight> {
		val tokens = ArrayList<Token>()

		var lastIndex = 0
		do {
			val matched = tokensPattern.match(string, lastIndex)

			if (matched == null) {
				tokens.add(Token(TokenType.PLAIN, string.substring(lastIndex)))
				break
			} else {
				if (matched.range.first > lastIndex) {
					tokens.add(Token(TokenType.PLAIN, string.substring(lastIndex, matched.range.first)))
				}

				tokens.add(if (matched.foundIndex == 0) Token(TokenType.STAR, "**") else Token(TokenType.DASH, "__"))
				lastIndex = matched.range.last + 1
			}
		} while(true)

		val highlights = ArrayList<Highlight>()
		val tokenStack = ArrayList<Token>()

		for (token in tokens) {
			if (tokenStack.isEmpty()) {
				if (token.tokenType === TokenType.PLAIN) {
					highlights.add(Highlight.create(token.string, HighlightType.NONE))
				} else {
					tokenStack.add(token)
				}
			} else if (tokenStack.size == 1) {
				if (token.tokenType === TokenType.PLAIN) {
					tokenStack.add(token)
				} else {
					highlights.add(Highlight.create(tokenStack[0].string, HighlightType.NONE))
					highlights.add(Highlight.create(token.string, HighlightType.NONE))
					tokenStack.clear()
				}
			} else {
				if (token.tokenType === tokenStack[0].tokenType) {
					highlights.add(Highlight.create(tokenStack[1].string, tokenStack[0].tokenType.highlightType))
					tokenStack.clear()
				} else {
					highlights.add(Highlight.create(tokenStack[0].string, HighlightType.NONE))
					highlights.add(Highlight.create(tokenStack[1].string, HighlightType.NONE))
					tokenStack.clear()
					tokenStack.add(token)
				}
			}
		}

		for (remainingToken in tokenStack) {
			highlights.add(Highlight.create(remainingToken.string, HighlightType.NONE))
		}

		return highlights
	}

	private fun kpopHighlightString(string: String): ArrayList<Highlight> {
		val stringParts = ArrayList<Highlight>()
		var lastIndex = 0

		do {
			val matched = idolsPattern.match(string, lastIndex) ?: break

			if (matched.range.first > lastIndex) {
				stringParts.add(Highlight.create(string.substring(lastIndex, matched.range.first), HighlightType.NONE))
			}

			stringParts.add(Highlight.createIdol(string.substring(matched.range), matched.foundIndex))
			lastIndex = matched.range.last + 1
		} while (true)

		if (lastIndex < string.length) {
			stringParts.add(Highlight.create(string.substring(lastIndex), HighlightType.NONE))
		}

		return stringParts
	}

	fun highlightString(string: String): ArrayList<Highlight> {
		val highlights = ArrayList<Highlight>()

		for (highlight in firstRoundHighlights(string)) {
			if (highlight.highlightType == HighlightType.NONE) {
				kpopHighlightString(highlight.string).forEach { highlights.add(it) }
			} else {
				highlights.add(highlight)
			}
		}

		return highlights
	}
}

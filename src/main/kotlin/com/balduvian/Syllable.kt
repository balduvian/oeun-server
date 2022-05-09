package com.balduvian

@Suppress("NonAsciiCharacters")
class Syllable(
	val initial: Int,
	val vowel: Int,
	val final0: Int,
	val final1: Int,
) {
	/**
	 * @return match codes 0-2
	 */
	fun subSyllableOf(other: Syllable, next: Syllable?): Int {
		if (exact(other)) return MATCH_EXACT
		if (initial != other.initial) return MATCH_NONE

		/* syllable is only the inital? */
		if (vowel == 0) return MATCH_PART
		if (vowel != other.vowel) return MATCH_NONE

		/* syllable is only the inital + vowel? */
		if (final0 == 0) return MATCH_PART

		/* one final to match */
		return if (final1 == 0) {
			/* matched 1/2 finals */
			if (final0 == other.final0) return MATCH_PART

			/* can we try to match the initial of the next syllable? */
			if (other.final0 == 0 && final0 == next?.initial) MATCH_PART else MATCH_NONE

		/* two finals to match */
		} else {
			/* if other has a second final, you had to have matched it */
			/* match initial of next syllable */
			if (other.final1 == 0 && final1 == next?.initial) MATCH_PART else MATCH_NONE
		}
	}

	fun exact(other: Syllable): Boolean {
		return initial == other.initial &&
			vowel == other.vowel &&
			final0 == other.final0 &&
			final1 == other.final1
	}

	companion object {
		const val MATCH_NONE = 0
		const val MATCH_EXACT = 1
		const val MATCH_PART = 2

		/* standard consonant ids */
		const val ㄱ = 1
		const val ㄲ = 2
		const val ㄴ = 3
		const val ㄷ = 4
		const val ㄸ = 5
		const val ㄹ = 6
		const val ㅁ = 7
		const val ㅂ = 8
		const val ㅃ = 9
		const val ㅅ = 10
		const val ㅆ = 11
		const val ㅇ = 12
		const val ㅈ = 13
		const val ㅉ = 14
		const val ㅊ = 15
		const val ㅋ = 16
		const val ㅌ = 17
		const val ㅍ = 18
		const val ㅎ = 19

		fun decompose(syllable: Char): Syllable? {
			return when (syllable.code) {
				in 0x3131..0x314E -> Syllable(
					singleToStandard[syllable.code - 0x3131] ?: return null,
					0, 0, 0
				)
				in 0xAC00..0xD7A3 -> {
					val (final0, final1) = finalToStandard[(syllable.code - 0xAC00) % 28]

					Syllable(
						(syllable.code - 0xAC00) / 588 + 1,
						/* allow for no vowel with the +1 */
						((syllable.code - 0xAC00) / 28) % 21 + 1,
						final0,
						final1,
					)
				}
				else -> null
			}
		}

		private val finalToStandard = arrayOf(
			0 to 0 /*    */,
			ㄱ to 0 /* ㄱ */,
			ㄲ to 0 /* ㄲ */,
			ㄱ to ㅅ /* ㄳ */,
			ㄴ to 0 /* ㄴ */,
			ㄴ to ㅈ /* ㄵ */,
			ㄴ to ㅎ /* ㄶ */,
			ㄷ to 0 /* ㄷ */,
			ㄹ to 0 /* ㄹ */,
			ㄹ to ㄱ /* ㄺ */,
			ㄹ to ㅁ /* ㄻ */,
			ㄹ to ㅂ /* ㄼ */,
			ㄹ to ㅅ /* ㄽ */,
			ㄹ to ㅌ /* ㄾ */,
			ㄹ to ㅍ /* ㄿ */,
			ㄹ to ㅎ /* ㅀ */,
			ㅁ to 0 /* ㅁ */,
			ㅂ to 0 /* ㅂ */,
			ㅂ to ㅅ /* ㅄ */,
			ㅅ to 0 /* ㅅ */,
			ㅆ to 0 /* ㅆ */,
			ㅇ to 0 /* ㅇ */,
			ㅈ to 0 /* ㅈ */,
			ㅊ to 0 /* ㅊ */,
			ㅋ to 0 /* ㅋ */,
			ㅌ to 0 /* ㅌ */,
			ㅍ to 0 /* ㅍ */,
			ㅎ to 0 /* ㅎ */,
		)

		private val singleToStandard = arrayOf(
			ㄱ,
			ㄲ,
			null,
			ㄴ,
			null,
			null,
			ㄷ,
			ㄸ,
			ㄹ,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			ㅁ,
			ㅂ,
			ㅃ,
			null,
			ㅅ,
			ㅆ,
			ㅇ,
			ㅈ,
			ㅉ,
			ㅊ,
			ㅋ,
			ㅌ,
			ㅍ,
			ㅎ,
		)
	}
}

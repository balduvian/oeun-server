package com.balduvian.search

@Suppress("NonAsciiCharacters")
class Syllable(
	val initial: Int,
	val vowel0: Int,
	val vowel1: Int,
	val final0: Int,
	val final1: Int,
) {
	fun subSyllableOf(superSyllable: Syllable, next: Syllable?): Int {
		/* mismatched initial consonant */
		if (initial != superSyllable.initial) return MATCH_NONE

		/* both are just a letter */
		if (vowel0 == 0 && superSyllable.vowel0 == 0) return MATCH_EXACT

		/* haven't typed the vowel yet */
		if (vowel0 == 0) return MATCH_PART

		/* wrong vowel */
		if (vowel0 != superSyllable.vowel0) return MATCH_NONE

		/* just didn't put in the combo vowel yet */
		if (final0 == 0 && vowel1 == 0 && superSyllable.vowel1 != 0) return MATCH_PART

		/* combo vowel is bad */
		if (vowel1 != superSyllable.vowel1) return MATCH_NONE

		if (superSyllable.final0 == 0) {
			/* both have no final */
			if (final0 == 0) return MATCH_EXACT

			/* can't match forward if you typed two final syllables */
			if (final1 != 0) return MATCH_NONE

			/* final consonant moves over to next syllable */
			if (final0 == next?.initial) return MATCH_PART

			/* syllable goes too far and is unrelated in the final consonant */
			return MATCH_NONE
		} else {
			/* haven't typed the final yet */
			if (final0 == 0) return MATCH_PART

			/* completely different final consonant */
			if (final0 != superSyllable.final0) return MATCH_NONE

			if (superSyllable.final1 == 0) {
				/* overflow the extra second final consonant */
				if (final1 != 0) {
					/* it has one extra but it can move to the */
					if (next?.initial == final1) return MATCH_PART

					/* just typed a second consonant which is too much */
					return MATCH_NONE
				}

				/* it is just the same single final consonant */
				return MATCH_EXACT

			} else {
				/* just hasn't typed the second final consonant yet */
				if (final1 == 0) return MATCH_PART

				/* wrong second final consonant  */
				if (final1 != superSyllable.final1) return MATCH_NONE

				/* bothe have same final second consonant */
				return MATCH_EXACT
			}
		}
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

		/* standard vowel ids */
		const val ㅏ = 1
		const val ㅐ = 2
		const val ㅑ = 3
		const val ㅒ = 4
		const val ㅓ = 5
		const val ㅔ = 6
		const val ㅕ = 7
		const val ㅖ = 8
		const val ㅗ = 9
		const val ㅛ = 10
		const val ㅜ = 11
		const val ㅠ = 12
		const val ㅡ = 13
		const val ㅣ = 14

		fun decompose(syllable: Char): Syllable? {
			return when (syllable.code) {
				in 0x3131..0x314E -> Syllable(
					singleToStandard[syllable.code - 0x3131] ?: return null,
					0, 0, 0, 0
				)
				in 0xAC00..0xD7A3 -> {
					val (vowel0, vowel1) = vowelToStandard[((syllable.code - 0xAC00) / 28) % 21]
					val (final0, final1) = finalToStandard[(syllable.code - 0xAC00) % 28]

					Syllable(
						(syllable.code - 0xAC00) / 588 + 1,
						vowel0,
						vowel1,
						final0,
						final1,
					)
				}
				else -> null
			}
		}

		private val vowelToStandard = arrayOf(
			ㅏ to 0 /* ㅏ */,
			ㅐ to 0 /* ㅐ */,
			ㅑ to 0 /* ㅑ */,
			ㅒ to 0 /* ㅒ */,
			ㅓ to 0 /* ㅓ */,
			ㅔ to 0 /* ㅔ */,
			ㅕ to 0 /* ㅕ */,
			ㅖ to 0 /* ㅖ */,
			ㅗ to 0 /* ㅗ */,
			ㅗ to ㅏ /* ㅘ */,
			ㅗ to ㅐ /* ㅙ */,
			ㅗ to ㅣ /* ㅚ */,
			ㅛ to 0 /* ㅛ */,
			ㅜ to 0 /* ㅜ */,
			ㅜ to ㅓ /* ㅝ */,
			ㅜ to ㅔ /* ㅞ */,
			ㅜ to ㅣ /* ㅟ */,
			ㅠ to 0 /* ㅠ */,
			ㅡ to 0 /* ㅡ */,
			ㅡ to ㅣ /* ㅢ */,
			ㅣ to 0 /* ㅣ */,
		)

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

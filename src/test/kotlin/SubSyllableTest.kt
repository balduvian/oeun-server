import com.balduvian.search.Syllable

fun main() {
    fun test(first: Char, second: Char, next: Char?, correct: Int) {
        val syllable0 = Syllable.decompose(first)!!
        val syllable1 = Syllable.decompose(second)!!
        val syllable2 = next?.let { Syllable.decompose(it)!! }

        val result = syllable0.subSyllableOf(syllable1, syllable2)


        if (result == correct) {
            println("test passed")
        } else {
            println("test with ${first} and ${second} failed! Got ${result}, should be ${correct}")
        }
    }

    test('가', '하', null, Syllable.MATCH_NONE)
    test('ㅌ', 'ㅍ', null, Syllable.MATCH_NONE)

    test('ㄹ', 'ㄹ', null, Syllable.MATCH_EXACT)
    test('ㅆ', 'ㅆ', null, Syllable.MATCH_EXACT)

    test('ㄹ', '리', null, Syllable.MATCH_PART)
    test('ㅆ', '쒸', null, Syllable.MATCH_PART)

    test('지', '주', null, Syllable.MATCH_NONE)
    test('투', '태', null, Syllable.MATCH_NONE)

    test('외', '오', null, Syllable.MATCH_NONE)
    test('우', '의', null, Syllable.MATCH_NONE)

    test('파', '파', null, Syllable.MATCH_EXACT)
    test('틔', '틔', null, Syllable.MATCH_EXACT)

    test('튼', '트', '니', Syllable.MATCH_PART)
    test('샃', '사', 'ㅊ', Syllable.MATCH_PART)

    test('팃', '티', '너', Syllable.MATCH_NONE)
    test('쑨', '쑤', 'ㅋ', Syllable.MATCH_NONE)
    test('킾', '킺', null, Syllable.MATCH_NONE)
    test('쁩', '쁨', null, Syllable.MATCH_NONE)

    test('는', '늪', null, Syllable.MATCH_NONE)
    test('붑', '붐', null, Syllable.MATCH_NONE)

    test('뭆', '뭅', '스', Syllable.MATCH_PART)
    test('큷', '클', 'ㅂ', Syllable.MATCH_PART)

    test('잉', '잉', null, Syllable.MATCH_EXACT)
    test('맘', '맘', null, Syllable.MATCH_EXACT)

    test('슉', '슋', null, Syllable.MATCH_PART)
    test('를', '릀', null, Syllable.MATCH_PART)

    test('닔', '닓', null, Syllable.MATCH_NONE)
    test('맖', '맔', null, Syllable.MATCH_NONE)

    test('핊', '핊', null, Syllable.MATCH_EXACT)
    test('믅', '믅', null, Syllable.MATCH_EXACT)

    test('믅', '므', '닞', Syllable.MATCH_NONE)

    test('ㅇ', 'ㅇ', null, Syllable.MATCH_EXACT)
    test('ㅇ', '오', null, Syllable.MATCH_PART)
    test('ㅇ', '외', null, Syllable.MATCH_PART)
    test('ㅇ', '올', null, Syllable.MATCH_PART)
    test('ㅇ', '욀', null, Syllable.MATCH_PART)
    test('ㅇ', '옰', null, Syllable.MATCH_PART)
    test('ㅇ', '욄', null, Syllable.MATCH_PART)

    test('오', 'ㅇ', null, Syllable.MATCH_NONE)
    test('오', '오', null, Syllable.MATCH_EXACT)
    test('오', '외', null, Syllable.MATCH_PART)
    test('오', '올', null, Syllable.MATCH_PART)
    test('오', '욀', null, Syllable.MATCH_PART)
    test('오', '옰', null, Syllable.MATCH_PART)
    test('오', '욄', null, Syllable.MATCH_PART)

    test('외', 'ㅇ', null, Syllable.MATCH_NONE)
    test('외', '오', null, Syllable.MATCH_NONE)
    test('외', '외', null, Syllable.MATCH_EXACT)
    test('외', '올', null, Syllable.MATCH_NONE)
    test('외', '욀', null, Syllable.MATCH_PART)
    test('외', '옰', null, Syllable.MATCH_NONE)
    test('외', '욄', null, Syllable.MATCH_PART)

    test('올', 'ㅇ', null, Syllable.MATCH_NONE)
    test('올', '오', null, Syllable.MATCH_NONE)
    test('올', '외', null, Syllable.MATCH_NONE)
    test('올', '올', null, Syllable.MATCH_EXACT)
    test('올', '욀', null, Syllable.MATCH_NONE)
    test('올', '옰', null, Syllable.MATCH_PART)
    test('올', '욄', null, Syllable.MATCH_NONE)

    test('욀', 'ㅇ', null, Syllable.MATCH_NONE)
    test('욀', '오', null, Syllable.MATCH_NONE)
    test('욀', '외', null, Syllable.MATCH_NONE)
    test('욀', '올', null, Syllable.MATCH_NONE)
    test('욀', '욀', null, Syllable.MATCH_EXACT)
    test('욀', '옰', null, Syllable.MATCH_NONE)
    test('욀', '욄', null, Syllable.MATCH_PART)

    test('옰', 'ㅇ', null, Syllable.MATCH_NONE)
    test('옰', '오', null, Syllable.MATCH_NONE)
    test('옰', '외', null, Syllable.MATCH_NONE)
    test('옰', '올', null, Syllable.MATCH_NONE)
    test('옰', '욀', null, Syllable.MATCH_NONE)
    test('옰', '옰', null, Syllable.MATCH_EXACT)
    test('옰', '욄', null, Syllable.MATCH_NONE)

    test('욄', 'ㅇ', null, Syllable.MATCH_NONE)
    test('욄', '오', null, Syllable.MATCH_NONE)
    test('욄', '외', null, Syllable.MATCH_NONE)
    test('욄', '올', null, Syllable.MATCH_NONE)
    test('욄', '욀', null, Syllable.MATCH_NONE)
    test('욄', '옰', null, Syllable.MATCH_NONE)
    test('욄', '욄', null, Syllable.MATCH_EXACT)

    test('올', 'ㅇ', 'ㄹ', Syllable.MATCH_NONE)
    test('올', '오', 'ㄹ', Syllable.MATCH_PART)
    test('올', '외', 'ㄹ', Syllable.MATCH_NONE)
    test('올', '올', 'ㄹ', Syllable.MATCH_EXACT)
    test('올', '욀', 'ㄹ', Syllable.MATCH_NONE)
    test('올', '옰', 'ㄹ', Syllable.MATCH_PART)
    test('올', '욄', 'ㄹ', Syllable.MATCH_NONE)

    test('옰', 'ㅇ', 'ㅅ', Syllable.MATCH_NONE)
    test('옰', '오', 'ㅅ', Syllable.MATCH_NONE)
    test('옰', '외', 'ㅅ', Syllable.MATCH_NONE)
    test('옰', '올', 'ㅅ', Syllable.MATCH_PART)
    test('옰', '욀', 'ㅅ', Syllable.MATCH_NONE)
    test('옰', '옰', 'ㅅ', Syllable.MATCH_EXACT)
    test('옰', '욄', 'ㅅ', Syllable.MATCH_NONE)
}
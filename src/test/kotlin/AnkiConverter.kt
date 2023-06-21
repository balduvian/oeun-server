import com.balduvian.`object`.Card
import AnkiConverter.loadAnkiFile
import AnkiConverter.parseAnkiFile
import com.balduvian.`object`.Part
import java.io.File
import java.nio.charset.Charset
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.nio.file.Path

object AnkiConverter {
	fun loadAnkiFile(path: String): CharArray {
		val file = File(path)
		val reader = file.reader(Charset.forName("UTF-8"))
		val charArray = CharArray(file.length().toInt())
		reader.read(charArray)
		return charArray
	}

	data class ParseContext(var along: Int, val data: CharArray) {
		fun over(): Boolean {
			return along >= data.size
		}
	}

	private fun goUntilMatch(parseContext: ParseContext, match: (char: Char) -> Boolean) {
		val data = parseContext.data
		var i = parseContext.along

		while (i < data.size) {
			if (match(data[i])) {
				break
			} else {
				++i
			}
		}

		parseContext.along = i
	}

	fun parseString(parseContext: ParseContext): String {
		goUntilMatch(parseContext) { it == '"' || it == '\'' }
		if (parseContext.over()) throw Exception("unexpected end of file")

		val data = parseContext.data
		var i = parseContext.along

		val quote = data[i++]
		val builder = StringBuilder()

		while (i < data.size) {
			if (data[i] == quote) {
				++i
				break
			} else if (data[i] == '\\') {
				if (data[++i] == quote) {
					builder.append(quote)
				} else {
					builder.append('\\')
					builder.append(data[i])
				}
			} else {
				builder.append(data[i])
			}
			++i
		}

		parseContext.along = i
		return builder.toString()
	}

	fun parseLong(parseContext: ParseContext): Long {
		goUntilMatch(parseContext) { it.code in '0'.code..'9'.code }
		if (parseContext.over()) throw Exception("unexpected end of file")

		val data = parseContext.data
		var i = parseContext.along

		val builder = StringBuilder()

		while (i < data.size) {
			if (data[i] in '0'..'9') {
				builder.append(data[i])
			} else {
				break
			}
			++i
		}

		parseContext.along = i
		return builder.toString().toLong()
	}

	/**
	 * @return end of file
	 */
	fun parseObjectStart(parseContext: ParseContext): Boolean {
		goUntilMatch(parseContext) { it == '(' }
		return parseContext.over()
	}

	fun parseAnkiFile(data: CharArray) {
		val context = ParseContext(0, data)

		var id = 0

		while (true) {
			if (parseObjectStart(context)) break

			val timestamp = parseLong(context)
			val sentence = parseString(context)
			val word = parseString(context)
			val partStr = parseString(context)
			val definition = parseString(context)
			val image = parseString(context)

			val part = try {
				Part.valueOf(partStr.uppercase().replace(' ', '_'))
			} catch (ex: Exception) {
				null
			}


			val date = ZonedDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault())

			val card = Card(
				id++,
				word,
				part,
				definition,
				sentence.ifEmpty { null },
				image.ifEmpty { null },
				date,
				date,
				arrayListOf("legacy"),
				null,
			)

			card.save(Path.of("C:\\Users\\Emmet\\Programming\\lang\\java\\skybranch\\run\\data\\cards\\"), card.filename())
		}
	}
}

fun main() {
	val data = loadAnkiFile("C:\\Users\\Emmet\\Programming\\data\\test\\Sentence Mining.txt")
	parseAnkiFile(data)
}

import com.balduvian.AnkiConnect
import com.balduvian.Card
import com.balduvian.Part
import com.balduvian.Util.getMaybe
import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.io.File
import java.time.ZonedDateTime

suspend fun main() {
    val cardsDir = File("./run/data/cards")
    val files = cardsDir.listFiles { file -> file.nameWithoutExtension.startsWith("card_") }!!

    val gson = GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create()

    fun findNoteParamsWord(
        deckName: String,
        modelName: String,
        word: String,
    ): JsonObject {
        val params = JsonObject()
        params.addProperty("query", "\"deck:${deckName}\" \"note:${modelName}\" \"Target:${word}\"")
        return params
    }

    val zonedDate = ZonedDateTime.now()

    val newContents = files.map { file ->
        val json = JsonParser.parseReader(file.reader()).asJsonObject

        val inAnki = json.getMaybe("inAnki")?.asBoolean ?: false
        json.remove("inAnki")

        if (inAnki) {
            val (_, result) = AnkiConnect.jsonPostRequest(
                AnkiConnect.createRequestObj(
                    "findNotes",
                    findNoteParamsWord("Sentence Mining", "SME", json.get("word").asString)
                )
            )

            val results = result.asJsonArray
            if (results.isEmpty) {
                println("card ${json.get("id").asInt} doesn't exist in anki anymore")

            } else {
                println("card ${json.get("id").asInt} has anki id ${results[0]}")

                val cardObject = Card(
                    json.get("id").asInt,
                    json.get("word").asString,
                    json.getMaybe("part")?.asString?.let { Part.valueOf(it) },
                    json.get("definition").asString,
                    json.getMaybe("sentence")?.asString,
                    json.getMaybe("picture")?.asString,
                    ZonedDateTime.parse(json.get("date").asString),
                    ZonedDateTime.parse(json.get("date").asString),
                    ArrayList(),
                    null,
                )

                AnkiConnect.jsonPostRequest(
                    AnkiConnect.createRequestObj(
                        "updateNoteFields",
                        AnkiConnect.updateNoteFieldsParams(cardObject, results[0].asLong)
                    )
                )

                val ankiStruct = JsonObject()
                ankiStruct.addProperty("id", results[0].asLong)
                ankiStruct.addProperty("added", zonedDate.toString())

                json.add("anki", ankiStruct)

                file.writeText(gson.toJson(json))
            }
        }
    }
}

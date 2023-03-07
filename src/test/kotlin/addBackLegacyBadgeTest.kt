import com.balduvian.JsonUtil
import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import com.google.gson.JsonPrimitive
import com.google.gson.stream.JsonWriter
import java.time.ZonedDateTime
import kotlin.io.path.Path
import kotlin.system.exitProcess

fun main() {
    val directory = Path("C:\\Users\\Emmet\\Programming\\lang\\java\\oeun-server\\run\\data\\cards").toFile()

    val json = JsonUtil.saverGson

    val beforeDate = ZonedDateTime.parse("2022-04-11T19:02:52-07:00[America/Los_Angeles]")

    directory.listFiles()?.forEach { file ->
        if (!file.nameWithoutExtension.startsWith("card_") || file.extension != "json") return@forEach

        val cardObject = JsonParser.parseReader(file.reader()).asJsonObject

        val date = cardObject.get("date")?.asString?.let { ZonedDateTime.parse(it) } ?: return@forEach

        if (date < beforeDate) {
            val badges = cardObject.get("badges")?.asJsonArray ?: return@forEach
            if (!badges.contains(JsonPrimitive("LEGACY"))) {
                badges.add("LEGACY")

                file.writeText(json.toJson(cardObject))
                println("GOT ${file.name}")
            }
        }
    }
}
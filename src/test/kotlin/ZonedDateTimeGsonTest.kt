import com.google.gson.*
import java.lang.reflect.Type
import java.text.DateFormat
import java.time.ZonedDateTime

fun main() {
    val d = ZonedDateTime.now()
    val gson = GsonBuilder().registerTypeAdapter(ZonedDateTime::class.java, object : JsonSerializer<ZonedDateTime> {
        override fun serialize(src: ZonedDateTime, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
            return JsonPrimitive(src.toString())
        }
    }).registerTypeAdapter(ZonedDateTime::class.java, object : JsonDeserializer<ZonedDateTime> {
        override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): ZonedDateTime {
            return ZonedDateTime.parse(json.asString)
        }
    }).setDateFormat(DateFormat.TIMEZONE_FIELD).create()

    val jsonString = gson.toJson(d)

    println(jsonString)

    val recovered = gson.fromJson(jsonString.reader(), ZonedDateTime::class.java)

    println(recovered)
}

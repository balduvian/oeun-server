import com.google.gson.GsonBuilder
import com.google.gson.JsonObject

fun main() {
    //fun encodeChar(char: Char): String {
    //    return when (char) {
    //        '\\' -> "\\\\"
    //        '\"' -> "\\\""
    //        else -> {
    //            val chars = CharArray(1) { char }
    //            String(chars)
    //        }
    //    }
    //}
//
    //val str = "{ \"a\": \"${(0..255).joinToString("") {
    //    val str = encodeChar(it.toChar())
    //   // println("$str | ${str.length}")
    //    str
    //}}\" }"

    //val json = JsonParser.parseReader(str.reader())
    //println(json.asJsonObject.get("a").asString)

    val gson = GsonBuilder().create()

    val allStr = String(CharArray(256) { it.toChar() })
    val jObj = JsonObject()
    jObj.addProperty("a", allStr)

    println(gson.toJson(jObj))
}
package com.balduvian


import java.io.File

class Options(
	val port: Int
) {
	companion object {
		val DEFAULT_PORT = 35432

		fun loadOptionsFile(path: String): Options {
			val file = File(path)

			return if (file.exists()) {
				Util.readerGson.fromJson(File(path).reader(), Options::class.java)
			} else {
				val defaultOptions = Options(DEFAULT_PORT)

				println("No options.json found, creating one")

				val writer = file.writer()
				writer.write(Util.saverGson.toJson(defaultOptions))
				writer.close()

				defaultOptions
			}
		}
	}
}

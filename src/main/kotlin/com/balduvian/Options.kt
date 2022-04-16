package com.balduvian

import com.google.gson.Gson
import java.io.File

class Options(
	val port: Int
) {
	companion object {
		fun loadOptionsFile(path: String): Options {
			val gson = Gson().newBuilder().create()
			return gson.fromJson(File(path).reader(), Options::class.java)
		}
	}
}

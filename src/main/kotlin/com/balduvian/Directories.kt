package com.balduvian

import java.io.File

enum class Directories(val path: String) {
	PATH_DATA("./data/"),
	PATH_CARDS("./data/cards/"),
	PATH_IMAGES("./data/images/"),
	PATH_TRASH("./data/trash/"),
	PATH_BADGES("./data/badges/");

	companion object {
		fun setup() {
			values().forEach { directory ->
				val file = File(directory.path)
				if (!file.exists()) file.mkdir()
			}
		}
	}
}

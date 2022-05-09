package com.balduvian

import java.io.File

object Directories {
	const val PATH_DATA = "./data/"
	const val PATH_CARDS = "./data/cards/"
	const val PATH_IMAGES = "./data/images/"
	const val PATH_TRASH = "./data/trash/"

	fun setup() {
		arrayOf(PATH_DATA, PATH_CARDS, PATH_IMAGES).forEach { path ->
			val file = File(path)
			if (!file.exists()) file.mkdir()
		}
	}
}

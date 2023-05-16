package com.balduvian

import java.nio.file.Path

enum class Directories(val path: Path) {
	PATH_DATA(Path.of("./data/")),
	PATH_CARDS(Path.of("./data/cards/")),
	PATH_IMAGES(Path.of("./data/images/")),
	PATH_TRASH(Path.of("./data/trash/")),
	PATH_BADGES(Path.of("./data/badges/"));

	companion object {
		init {
			values().forEach { directory ->
				val file = directory.path.toFile()
				if (!file.exists()) file.mkdir()
			}
		}
	}
}

package com.balduvian

enum class ImagePool(val images: Images) {
	CARDS(Images(Directories.PATH_IMAGES.path, 256)),
	BADGES(Images(Directories.PATH_IMAGES.path, 256)),
}
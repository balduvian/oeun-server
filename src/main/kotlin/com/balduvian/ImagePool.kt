package com.balduvian

enum class ImagePool(val images: Images) {
	CARDS(Images(Directories.PATH_IMAGES.path, Directories.PATH_TRASH.path, 512)),
	BADGES(Images(Directories.PATH_IMAGES.path, Directories.PATH_TRASH.path, 512)),
}
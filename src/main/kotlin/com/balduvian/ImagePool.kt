package com.balduvian

enum class ImagePool(val images: Images) {
	CARDS(Images(Directories.PATH_IMAGES.path, Directories.PATH_TRASH.path, 512, Images.Format.JPG, 608, 342)),
	BADGES(Images(Directories.PATH_BADGES.path, Directories.PATH_TRASH.path, 512, Images.Format.PNG, 256, 256)),
}

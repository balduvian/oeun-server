package com.balduvian

import com.balduvian.Directories.PATH_IMAGES
import java.awt.image.BufferedImage
import java.io.File
import java.io.InputStream
import javax.imageio.ImageIO

object Images {
	data class CachedImage(val name: String, val data: ByteArray)

	const val CACHE_SIZE = 128
	val imageCache = ArrayList<CachedImage>(CACHE_SIZE)

	private fun getCachedImage(name: String): ByteArray? {
		for (i in imageCache.lastIndex downTo 0) {
			val cachedImage = imageCache[i]
			if (cachedImage.name == name) {
				/* bring this image to the front of the cache */
				if (i != imageCache.lastIndex) {
					imageCache.removeAt(i)
					imageCache.add(cachedImage)
				}

				return cachedImage.data
			}
		}

		return null
	}

	private fun makeOpaqueImage(inputStream: InputStream): BufferedImage {
		val image = ImageIO.read(inputStream)

		if (image.transparency == BufferedImage.OPAQUE) return image

		/* reduce transparency */
		val width = image.width
		val height = image.height

		val pixelsCopy = IntArray(width * height)
		image.getRGB(0, 0, width, height, pixelsCopy, 0, width)

		val opqueImage = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
		opqueImage.setRGB(0, 0, width, height, pixelsCopy, 0, width)

		return opqueImage
	}

	fun saveImage(name: String, inputStream: InputStream) {
		ImageIO.write(makeOpaqueImage(inputStream), "JPEG", File(PATH_IMAGES + name))
	}

	fun getImage(name: String): ByteArray? {
		val cached = getCachedImage(name)
		if (cached != null) return cached

		val file = File(PATH_IMAGES + name)
		if (!file.exists()) return null
		val newBytes = file.readBytes()

		if (imageCache.size == CACHE_SIZE) {
			imageCache.removeAt(0)
		}
		imageCache.add(CachedImage(name, newBytes))

		return newBytes
	}

	fun deleteUnused(): Int {
		var count = 0
		val allUsed = Collection.cards.mapNotNull { card -> card.picture }

		val allFiles = File(PATH_IMAGES).listFiles() ?: throw Exception()
		for (file in allFiles) {
			if (!allUsed.contains(file.name)) {
				++count
				file.delete()
			}
		}

		return count
	}
}

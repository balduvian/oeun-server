package com.balduvian

import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.File
import java.io.InputStream
import java.time.Instant
import javax.imageio.ImageIO

class Images(val dirName: String, val cacheSize: Int) {
	data class CachedImage(val name: String, val data: ByteArray)

	val imageCache = ArrayList<CachedImage>(cacheSize)

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

	private fun cropImage(inputStream: InputStream, toWidth: Int, toHeight: Int): BufferedImage {
		val inputImage = ImageIO.read(inputStream)
		val newImage = BufferedImage(toWidth, toHeight, BufferedImage.TYPE_INT_RGB)

		if (inputImage.width == toWidth && inputImage.height == toHeight) {
			val pixelsCopy = IntArray(toWidth * toHeight)
			inputImage.getRGB(0, 0, toWidth, toHeight, pixelsCopy, 0, toWidth)
			newImage.setRGB(0, 0, toWidth, toHeight, pixelsCopy, 0, toWidth)

		} else {
			val idealRatio = toWidth.toFloat() / toHeight.toFloat()
			val imageRatio = inputImage.width.toFloat() / inputImage.height.toFloat()

			val viewWidth: Int
			val viewHeight: Int
			val offX: Int
			val offY: Int

			if (imageRatio > idealRatio) {
				viewHeight = inputImage.height
				viewWidth = (idealRatio * viewHeight).toInt()
				offY = 0
				offX = (inputImage.width - viewWidth) / 2
			} else {
				viewWidth = inputImage.width
				viewHeight = ((1.0f / idealRatio) * viewWidth).toInt()
				offX = 0
				offY = (inputImage.height - viewHeight) / 2
			}

			val graphics = newImage.createGraphics()
			graphics.setRenderingHint(
				RenderingHints.KEY_INTERPOLATION,
				RenderingHints.VALUE_INTERPOLATION_BILINEAR
			)
			graphics.drawImage(
				inputImage,
				0, 0,
				toWidth, toHeight,
				offX, offY,
				offX + viewWidth, offY + viewHeight,
				null
			)
			graphics.dispose()
		}

		return newImage
	}

	fun saveImage(name: String, inputStream: InputStream) {
		//TODO smart write to memory and add to cache immediately
		ImageIO.write(cropImage(inputStream, 608, 342), "JPEG", File(dirName + name))
	}

	fun getImage(name: String): ByteArray? {
		val cached = getCachedImage(name)
		if (cached != null) return cached

		val file = File(dirName + name)
		if (!file.exists()) return null
		val newBytes = file.readBytes()

		addToCache(CachedImage(name, newBytes))

		return newBytes
	}

	private fun addToCache(image: CachedImage) {
		if (imageCache.size == cacheSize) {
			imageCache.removeAt(0)
		}
		imageCache.add(image)
	}

	fun deleteUnused(): Int {
		var count = 0
		val allUsed = Collection.cards.mapNotNull { card -> card.picture }

		val allFiles = File(dirName).listFiles() ?: throw Exception()
		for (file in allFiles) {
			if (!allUsed.contains(file.name)) {
				++count
				file.delete()
			}
		}

		return count
	}

	companion object {
		fun imageFilename(): String {
			return "paste-${Instant.now().toEpochMilli()}.jpg"
		}
	}
}

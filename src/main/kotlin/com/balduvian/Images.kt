package com.balduvian

import io.ktor.util.*
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.InputStream
import java.nio.file.Path
import java.time.Instant
import java.util.*
import javax.imageio.ImageIO
import kotlin.collections.ArrayList
import kotlin.io.path.nameWithoutExtension

class Images(
	val directory: Path,
	val trash: Path,
	val cacheSize: Int,
	val format: Format,
	val width: Int,
	val height: Int,
) {
	enum class Format(val javaId: String, val extension: String) {
		JPG("JPEG", "jpg"),
		PNG("PNG", "png");
	}

	data class CachedImage(val name: String, val data: ByteArray)

	private val imageCache = ArrayList<CachedImage>(cacheSize)

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
		val newImage = BufferedImage(toWidth, toHeight, BufferedImage.TYPE_INT_ARGB)

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

	private fun isDataURL(pictureData: String): Boolean {
		return pictureData.startsWith("data:image/")
	}

	private fun getUploadFilename(uploadPicture: String?): String? {
		if (uploadPicture == null || !isDataURL(uploadPicture)) return uploadPicture

		val filename = imageFilename()

		val pictureBytes = Base64.getDecoder().decode(uploadPicture.substring(uploadPicture.indexOf(',') + 1))
		saveImage(filename, pictureBytes.inputStream())

		return filename
	}

	fun handleUploadedPicture(oldPicture: String?, uploadPicture: String?): String? {
		val newFilename = getUploadFilename(uploadPicture)

		if (oldPicture != null && oldPicture != newFilename) {
			moveToTrash(Path.of(oldPicture))
		}

		return newFilename
	}

	private fun saveImage(name: String, inputStream: InputStream) {
		//TODO smart write to memory and add to cache immediately
		ImageIO.write(cropImage(inputStream, width, height), format.javaId, directory.resolve(name).toFile())
	}

	fun getImage(name: String): ByteArray? {
		val cached = getCachedImage(name)
		if (cached != null) return cached

		val file = directory.resolve(name).toFile()
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

	private fun mangleFilename(filename: Path): Path {
		return Path.of("${filename.nameWithoutExtension}_${UUID.randomUUID()}.${filename.extension}")
	}

	fun moveToTrash(filename: Path) {
		val file = directory.resolve(filename).toFile()
		val trashFile = trash.resolve(mangleFilename(filename)).toFile()

		/* remove image from cache */
		val searchName = filename.toString()
		val cacheIndex = imageCache.indexOfFirst { it.name == searchName }
		if (cacheIndex != -1) imageCache.removeAt(cacheIndex)

		try {
			val sourceStream = file.inputStream().channel
			val destStream = trashFile.outputStream().channel

			destStream.transferFrom(sourceStream, 0, sourceStream.size())

			sourceStream.close()
			destStream.close()

			file.delete()
		} catch (ex: Throwable) {
			println("couldn't delete image $filename")
		}
	}

	fun deleteUnused(): Int {
		var count = 0
		val allUsed = Collection.cards.mapNotNull { card -> card.picture }

		val allFiles = directory.toFile().listFiles() ?: throw Exception()
		for (file in allFiles) {
			if (!allUsed.contains(file.name)) {
				++count
				moveToTrash(file.toPath().fileName)
			}
		}

		return count
	}

	private fun imageFilename(): String {
		return "${Instant.now().toEpochMilli()}.${format.extension}"
	}
}

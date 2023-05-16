package com.balduvian

import com.balduvian.images.ImagePool
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Duration
import java.time.Instant

object Background {
	suspend fun start() {
		while (true) {
			withContext(Dispatchers.IO) {
				Thread.sleep(Duration.ofSeconds(10).toMillis())
			}

			ImagePool.CARDS.images.cache.update(Instant.now())
		}
	}
}
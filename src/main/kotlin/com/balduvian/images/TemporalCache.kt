package com.balduvian.images;

import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit

interface CacheObject {
	var time: Instant
	val handle: String
}

class TemporalCache<C : CacheObject>(private val staleTime: Duration) {
	private val cache = ArrayDeque<C>()
	private val lock = Any()

	fun add(cacheObject: C) {
		synchronized(lock) {
			cache.addFirst(cacheObject)
		}
	}

	fun get(handle: String, now: Instant): C? {
		synchronized(lock) {
			val foundIndex = cache.indexOfFirst { it.handle == handle }

			if (foundIndex == -1) return null

			val cacheObject = if (foundIndex == 0) {
				cache.first()
			} else {
				val temp = cache.removeAt(foundIndex)
				cache.addFirst(temp)
				temp
			}

			cacheObject.time = now

			return cacheObject
		}
	}

	fun remove(handle: String) {
		synchronized(lock) {
			val foundIndex = cache.indexOfFirst { it.handle == handle }
			if (foundIndex != -1) cache.removeAt(foundIndex)
		}
	}

	fun update(now: Instant) {
		synchronized(lock) {
			while (cache.isNotEmpty()) {
				val test = cache.last()

				if (test.time.until(now, ChronoUnit.SECONDS) > staleTime.seconds) {
					cache.removeLast()
				} else {
					return
				}
			}
		}
	}
}

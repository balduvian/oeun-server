package com.balduvian.routes

import com.balduvian.Badges
import com.balduvian.`object`.Badge
import com.balduvian.util.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.badgesRouting() {
	route("/api/badges") {
		get {
			okJson(call, JsonUtil.webGson.toJsonTree(Badges.badgesList))
		}
		put("{oldId?}") {
			val oldId = call.parameters["oldId"]?.uppercase()

			try {
				withContext(Dispatchers.IO) {
					val uploadBadge = JsonUtil.webGson.fromJson(call.receiveStream().reader(), Badge::class.java)
					val collectionBadge = Badges.addOrReplace(oldId, uploadBadge)

					okJson(call, collectionBadge.serialize())
				}
			} catch (ex: Exception) {
				ex.printStackTrace()
				badRequest(call, "Bad badge data")
			}
		}
		delete("{id?}") {
			val id = call.parameters["id"]?.uppercase()
				?: return@delete badRequest(call, "Need an id to delete")

			if (Badges.remove(id))
				ok(call, "deleted")
			else
				notFound(call, "No badge with id \"$id\" exists")
		}
	}
}

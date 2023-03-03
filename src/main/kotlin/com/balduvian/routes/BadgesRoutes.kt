package com.balduvian.routes

import com.balduvian.Badge
import com.balduvian.Badges
import com.balduvian.JsonUtil
import com.balduvian.Util
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.badgesRouting() {
	route("/api/badges") {
		get {
			Util.okJson(call, JsonUtil.senderGson.toJsonTree(Badges.badgesList))
		}
		put("{oldId?}") {
			val oldId = call.parameters["oldId"]?.uppercase()

			try {
				withContext(Dispatchers.IO) {
					val uploadBadge = JsonUtil.senderGson.fromJson(call.receiveStream().reader(), Badge::class.java)
					val collectionBadge = Badges.addOrReplace(oldId, uploadBadge)

					Util.okJson(call, collectionBadge.serialize())
				}
			} catch (ex: Exception) {
				ex.printStackTrace()
				Util.badRequest(call, "Bad badge data")
			}
		}
		delete("{id?}") {
			val id = call.parameters["id"]?.uppercase()
				?: return@delete Util.badRequest(call, "Need an id to delete")

			if (Badges.remove(id))
				Util.ok(call, "deleted")
			else
				Util.notFound(call, "No badge with id \"$id\" exists")
		}
	}
}
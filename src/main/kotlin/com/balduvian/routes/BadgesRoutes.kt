package com.balduvian.routes

import com.balduvian.Badge
import com.balduvian.Badges
import com.balduvian.Util
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.badgesRouting() {
	route("/api/badges") {
		get {
			Util.okJson(call, Util.senderGson.toJson(Badges.badgesList))
		}
		patch("{oldId?}") {
			val oldId = call.parameters["oldId"]?.lowercase()

			try {
				withContext(Dispatchers.IO) {
					val badge = Util.senderGson.fromJson(call.receiveStream().reader(), Badge::class.java)
					Badges.addOrReplace(oldId, badge)
					Util.ok(call, "patched")
				}
			} catch (ex: Exception) {
				ex.printStackTrace()
				Util.badRequest(call, "Bad badge data")
			}
		}
		delete("{id?}") {
			val id = call.parameters["id"]?.lowercase()
				?: return@delete Util.badRequest(call, "Need an id to delete")

			if (Badges.remove(id))
				Util.ok(call, "deleted")
			else
				Util.notFound(call, "No badge with id \"$id\" exists")
		}
	}
}
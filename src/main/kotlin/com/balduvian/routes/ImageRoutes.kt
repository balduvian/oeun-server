package com.balduvian.routes

import com.balduvian.Util.badRequest
import com.balduvian.Util.errorResponse
import com.balduvian.Util.getImagePool
import com.balduvian.Util.notFound
import com.balduvian.Util.ok
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.imageRouting() {
	route("/api/images/{pool?}") {
		get("{name?}") {
			val pool = getImagePool(call, call.parameters["pool"]) ?: return@get
			val name = call.parameters["name"] ?: return@get badRequest(call, "Missing name")
			val image = pool.getImage(name) ?: return@get notFound(call, "image not found")

			call.respondBytes(image)
		}
		post {
			errorResponse(call, "Route shut down", 501)
		}
		delete("unused") {
			withContext(Dispatchers.IO) {
				val pool = getImagePool(call, call.parameters["pool"]) ?: return@withContext
				ok(call, pool.deleteUnused().toString())
			}
		}
	}
}

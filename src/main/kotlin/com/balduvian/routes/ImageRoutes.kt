package com.balduvian.routes

import com.balduvian.Util.badRequest
import com.balduvian.Util.getImagePool
import com.balduvian.Util.notFound
import com.balduvian.Util.ok
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.imageRouting() {
	route("/api/images/{pool?}") {
		get("{name?}") {
			val r = call.request.uri
			val pool = getImagePool(call, call.parameters["pool"]) ?: return@get
			val name = call.parameters["name"] ?: return@get badRequest(call, "Missing name")
			val image = pool.getImage(name) ?: return@get notFound(call, "image not found")

			call.respondBytes(image)
		}
		post("{name?}") {
			val pool = getImagePool(call, call.parameters["pool"]) ?: return@post
			val name = call.parameters["name"] ?: return@post badRequest(call, "No name provided")

			withContext(Dispatchers.IO) {
				pool.saveImage(name, call.receiveStream())
				ok(call, "saved")
			}
		}
		delete("unused") {
			withContext(Dispatchers.IO) {
				val pool = getImagePool(call, call.parameters["pool"]) ?: return@withContext
				ok(call, pool.deleteUnused().toString())
			}
		}
	}
}

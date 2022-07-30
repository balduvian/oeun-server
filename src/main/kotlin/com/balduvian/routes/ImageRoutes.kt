package com.balduvian.routes

import com.balduvian.Images
import com.balduvian.Util.badRequest
import com.balduvian.Util.getImagePool
import com.balduvian.Util.notFound
import com.balduvian.Util.ok
import com.balduvian.Util.okJson
import com.google.gson.JsonPrimitive
import io.ktor.server.application.*
import io.ktor.server.request.*
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
			val pool = getImagePool(call, call.parameters["pool"]) ?: return@post
			val filename = Images.imageFilename()

			withContext(Dispatchers.IO) {
				pool.saveImage(filename, call.receiveStream())
				okJson(call, JsonPrimitive(filename))
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

package com.balduvian.routes

import com.balduvian.Images
import com.balduvian.Util.badRequest
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

fun Route.imageRouting() {
	route("/images") {
		get("{name?}") {
			val name = call.parameters["name"] ?: return@get badRequest(call, "Missing name")
			val image = Images.getImage(name) ?: return@get badRequest(call, "image not found")

			call.respondBytes(image)
		}
		post("{name?}") {
			val name = call.parameters["name"] ?: return@post badRequest(call, "No name provided")
			withContext(Dispatchers.IO) {
				Images.saveImage(name, call.receiveStream())
				call.respondText("saved")
			}
		}
		delete("unused") {
			withContext(Dispatchers.IO) {
				val count = Images.deleteUnused()
				call.respond(count.toString())
			}
		}
	}
}

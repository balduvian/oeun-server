package com.balduvian.routes

import com.balduvian.Badge
import com.balduvian.Part
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.supplementalRouting() {
	route("/api/parts") {
		get {
			call.respond(Part.serializedList)
		}
	}
	route("/api/badges") {
		get {
			call.respond(Badge.serializedList)
		}
	}
}

package com.balduvian.special

import com.balduvian.Badge
import com.balduvian.Part
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.supplementalRouting() {
	route("/parts") {
		get {
			call.respond(Part.serializedList)
		}
	}
	route("/badges") {
		get {
			call.respond(Badge.serializedList)
		}
	}
}

package com.balduvian.routes

import com.balduvian.`object`.Part
import com.balduvian.util.okJson
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Route.supplementalRouting() {
	route("/api/parts") {
		get {
			okJson(call, Part.serializedList)
		}
	}
}

package com.balduvian

import com.balduvian.routes.collectionRouting
import com.balduvian.routes.imageRouting
import com.balduvian.special.supplementalRouting
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun main() {
	val options = Options.loadOptionsFile("./options.json")

	Tray.initTray()

	Directories.setup()
	Collection.loadAllCards()

	embeddedServer(Netty, options.port) {
		routing {
			collectionRouting()
			imageRouting()
			supplementalRouting()
		}
	}.start(wait = true)
}

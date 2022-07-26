package com.balduvian

import com.balduvian.routes.badgesRouting
import com.balduvian.routes.collectionRouting
import com.balduvian.routes.imageRouting
import com.balduvian.routes.supplementalRouting
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.routing.*
import java.io.File

fun main() {
	val options = Options.loadOptionsFile("./options.json")

	Tray.initTray()

	Directories.setup()
	Collection.loadAllCards()
	Badges.loadBadges()

	embeddedServer(Netty, options.port) {
		routing {
			static("/") {
				staticRootFolder = File("page")
				file("", "index.html")
				file("cards", "index.html")
				file("new", "index.html")
				file("cards/{...}", "index.html")
				file("new/{...}", "index.html")
				files(".")
			}
			collectionRouting()
			imageRouting()
			badgesRouting()
			supplementalRouting()
		}
	}.start(wait = true)
}

package com.balduvian

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

	embeddedServer(Netty, options.port) {
		routing {
			static("/") {
				staticRootFolder = File("page")
				file("", "edit.html")
				file("edit", "edit.html")
				file("new", "new.html")
				files(".")
			}
			collectionRouting()
			imageRouting()
			supplementalRouting()
		}
	}.start(wait = true)
}

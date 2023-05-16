package com.balduvian

import com.balduvian.routes.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.routing.*
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.File

@OptIn(DelicateCoroutinesApi::class)
suspend fun main() {
	Tray.initTray()

	Directories
	Collection.loadAllCards()
	Badges.loadBadges()

	GlobalScope.launch { Background.start() }

	embeddedServer(Netty, Settings.options.port) {
		routing {
			static("/") {
				staticRootFolder = File("page")
				file("", "index.html")
				file("cards", "index.html")
				file("edit", "index.html")
				file("settings", "index.html")
				file("badges", "index.html")
				file("cards/{...}", "index.html")
				file("edit/{...}", "index.html")
				file("settings/{...}", "index.html")
				file("badges/{...}", "index.html")
				files(".")
			}
			collectionRouting()
			imageRouting()
			badgesRouting()
			supplementalRouting()
			ankiRouting()
			settingsRouting()
		}
	}.start(wait = true)
}

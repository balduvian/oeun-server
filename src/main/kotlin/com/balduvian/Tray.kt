package com.balduvian

import java.awt.*
import java.awt.image.BufferedImage
import javax.imageio.ImageIO
import kotlin.system.exitProcess

object Tray {
	fun loadLogo(path: String, tray: SystemTray): Image {
		val stream = Tray::class.java.getResourceAsStream(path)

		val base = ImageIO.read(stream)
		val size = tray.trayIconSize

		val width = size.width
		val height = size.height

		return base.getScaledInstance(width, height, BufferedImage.SCALE_FAST)
	}

	fun initTray() {
		if (SystemTray.isSupported()) {
			val tray = SystemTray.getSystemTray()

			val image = loadLogo("/oeun-logo.png", tray)

			val popup = PopupMenu()
			val item = MenuItem("Exit")
			item.addActionListener {
				exitProcess(0)
			}
			popup.add(item)

			val icon = TrayIcon(image, "Oeun", popup)
			tray.add(icon)
		}
	}
}

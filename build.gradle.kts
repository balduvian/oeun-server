plugins {
    application
    id("com.github.johnrengelman.shadow") version "7.1.2"
    id("org.jetbrains.kotlin.jvm") version "1.8.0"
}

group = "com.balduvian"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
    maven {
        url = uri("https://maven.pkg.jetbrains.space/public/p/ktor/eap")
    }
}

dependencies {
    implementation("io.ktor:ktor-server-core:2.3.1")
    implementation("io.ktor:ktor-server-netty:2.3.1")
    implementation("io.ktor:ktor-client-core:2.0.0")
    implementation("io.ktor:ktor-client-cio:2.0.0")
    implementation("ch.qos.logback:logback-classic:1.4.6")
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.1")
}

application {
    mainClass.set("com.balduvian.MainKt")
}

kotlin {
    jvmToolchain(17)
}

tasks.withType<JavaExec> {
    workingDir = File("./run")
}

tasks.withType<Jar> {
    enabled = false;
}

tasks.shadowJar {
    archiveFileName.set("oeun server.jar")
    manifest.attributes["Main-Class"] = "com.balduvian.MainKt"
}

tasks.build {
    dependsOn(tasks.shadowJar)
}

tasks.register("copyProductionJar", Copy::class.java) {
    destinationDir = File("./run")

    with(copySpec {
        from("./build/libs")
        include("oeun server.jar")
    })

    dependsOn(tasks.shadowJar)
}

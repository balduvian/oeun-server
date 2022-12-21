package com.balduvian

class PrettyException(override val message: String) : Exception(message)

open class RequestException(override val message: String, val code: Int) : Exception(message)

class BadRequestException(message: String) : RequestException(message, 400)

class NotFoundException(message: String) : RequestException(message, 404)

package com.balduvian

import java.time.LocalDate
import java.time.ZonedDateTime

abstract class CardsToday {
    var storedDate: LocalDate? = null
    val list = ArrayList<Card>()

    abstract fun getDate(card: Card): ZonedDateTime?

    fun load(cards: ArrayList<Card>, now: ZonedDateTime) {
        val date = now.toLocalDate()

        storedDate = date
        list.addAll(cards.filter { card -> getDate(card)?.toLocalDate()?.equals(date) ?: false })
    }

    fun onAddCard(card: Card, now: ZonedDateTime) {
        val date = now.toLocalDate()

        if (!date.equals(storedDate)) {
            list.clear()
            storedDate = date
        }

        if (getDate(card)?.toLocalDate()?.isEqual(date) == true) {
            list.add(card)
        }
    }

    fun onRemoveCard(card: Card, now: ZonedDateTime) {
        val date = now.toLocalDate()

        if (!date.equals(storedDate)) {
            list.clear()
            storedDate = date
        } else if (getDate(card)?.toLocalDate()?.isEqual(date) == true) {
            list.remove(card)
        }
    }

    fun get(now: ZonedDateTime): ArrayList<Card> {
        val date = now.toLocalDate()

        if (!date.equals(storedDate)) {
            list.clear()
            storedDate = date
        }

        return list
    }
}
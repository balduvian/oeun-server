package com.balduvian

import java.time.LocalDate
import java.time.ZonedDateTime

abstract class CardsToday {
    var storedDate: LocalDate? = null
    val list = ArrayList<Card>()

    abstract fun getDate(card: Card, today: LocalDate): ZonedDateTime?

    private fun getDay(card: Card, today: LocalDate) = getDate(card, today)?.let { toEffectiveDay(it) }

    companion object {
        private fun toEffectiveDay(now: ZonedDateTime): LocalDate {
            val date = now.toLocalDate()

            return if (now.hour < Settings.options.getDayCutoffHour()) {
                date.minusDays(1)
            } else {
                date
            }
        }
    }

    fun load(cards: ArrayList<Card>, now: ZonedDateTime) {
        val date = toEffectiveDay(now)

        storedDate = date
        list.addAll(cards.filter { card -> getDay(card, date)?.equals(date) ?: false })
    }

    fun onAddCard(card: Card, now: ZonedDateTime) {
        val date = toEffectiveDay(now)

        if (date != storedDate) {
            list.clear()
            storedDate = date
        }

        if (!list.contains(card) && getDay(card, date)?.equals(date) == true) {
            list.add(card)
        }
    }

    fun onRemoveCard(card: Card, now: ZonedDateTime) {
        val date = toEffectiveDay(now)

        if (date != storedDate) {
            list.clear()
            storedDate = date
        } else if (getDay(card, date)?.equals(date) == true) {
            list.remove(card)
        }
    }

    fun get(now: ZonedDateTime): ArrayList<Card> {
        val date = toEffectiveDay(now)

        if (date != storedDate) {
            list.clear()
            storedDate = date
        }

        return list
    }
}
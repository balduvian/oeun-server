collection = mw.col
cardIds = collection.find_cards('"deck:Sentence Mining"')

finals = []

for cardId in cardIds:
    card = collection.get_card(cardId)
    note = collection.get_note(card.nid)

    sentence = note.values()[0].replace('<font color="#0000ff">', '**').replace('</font>', '**')
    image = note.values()[4].replace('<img src="', '').replace('">', '')

    finals.append((card.id, sentence, note.values()[1], note.values()[2], note.values()[3], image))

print(str(finals).replace("\n", ""))
pp('o')
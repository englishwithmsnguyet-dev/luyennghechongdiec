with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Q7
bad_q7 = 'transcriptEN: "And finally, on a lighter note. When college lecturer, Chris Pearse, told Jamie his pet bloodhound to fetch his slippers, he expected the dog to go upstairs for the new pair he had got for Christmas. In fact, the dog disappeared for two hours. The legendary nose of the bloodhound had led it four miles across town to the Council tip where Jamie retrieved his master\'s old slippers, which had been thrown away and brought them home. <span class=\'highlight-answer\'>Mr Pearse said, "I didn\'t expect it, but I can\'t complain when he\'s only done exactly what I asked..."</span>"I didn\'t expect it, but I can\'t complain when he\'s only done exactly what I asked...\"",'
good_q7 = 'transcriptEN: "And finally, on a lighter note. When college lecturer, Chris Pearse, told Jamie his pet bloodhound to fetch his slippers, he expected the dog to go upstairs for the new pair he had got for Christmas. In fact, the dog disappeared for two hours. The legendary nose of the bloodhound had led it four miles across town to the Council tip where Jamie retrieved his master\'s old slippers, which had been thrown away and brought them home. <span class=\'highlight-answer\'>Mr Pearse said, \\"I didn\'t expect it, but I can\'t complain when he\'s only done exactly what I asked...\\"</span>",'

# Fix Q8
bad_q8 = 'transcriptEN: ""We are sorry to announce that both the 9.15 from Crewe and the 10:30 to London Euston have been cancelled due to staff shortages. Passengers for Birmingham International and Oxford should cross the bridge to platform four where a relief train will shortly arrive. Passengers for Reeding can also take this train but must change at Oxford. <span class=\'highlight-answer\'>Passengers for London and Heathrow airport should go immediately to the booking hall on platform one where a coach has been arranged.</span>"We are sorry to announce that both the 9.15 from Crewe and the 10:30 to London Euston have been cancelled due to staff shortages. Passengers for Birmingham International and Oxford should cross the bridge to platform four where a relief train will shortly arrive. Passengers for Reeding can also take this train but must change at Oxford. Passengers for London and Heathrow airport should go immediately to the booking hall on platform one where a coach has been arranged.",'
good_q8 = 'transcriptEN: "We are sorry to announce that both the 9.15 from Crewe and the 10:30 to London Euston have been cancelled due to staff shortages. Passengers for Birmingham International and Oxford should cross the bridge to platform four where a relief train will shortly arrive. Passengers for Reeding can also take this train but must change at Oxford. <span class=\'highlight-answer\'>Passengers for London and Heathrow airport should go immediately to the booking hall on platform one where a coach has been arranged.</span>",'

if bad_q7 in content:
    content = content.replace(bad_q7, good_q7)
    print("Fixed Q7")
else:
    print("Could not match exact bad_q7")

if bad_q8 in content:
    content = content.replace(bad_q8, good_q8)
    print("Fixed Q8")
else:
    print("Could not match exact bad_q8")

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(content)

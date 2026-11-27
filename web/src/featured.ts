/**
 * Festivals and national moments offered in the pickers.
 *
 * `match` is the event name in data/events.csv. `date` pins one occurrence
 * (otherwise the latest confirmed one is shown first).
 *
 * `notice` is what the data shows and `why` explains it. Tokens in `notice`
 * are filled from the data so the text stays true when the data is refreshed:
 *   {m:atm}  median difference for that rail across every year of the event
 *   {l:atm}  difference on the occurrence being shown
 */
export type Featured = { match: string; title: string; blurb: string; date?: string; notice: string; why: string };

export const FESTIVALS: Featured[] = [
  {
    match: "Dhanteras", title: "Dhanteras", blurb: "The day to buy gold, utensils and new things.",
    notice: "Cash is king. ATM withdrawals jump {m:atm} and village cash {m:micro_atm} in a typical year, well ahead of UPI ({m:upi}). Businesses settle up too: NEFT transfers rise {m:neft}.",
    why: "Dhanteras is the most auspicious day of the year to buy gold, silver and utensils. Jewellers and small traders still like cash, families draw it out for Diwali gifts, and firms clear their dues before the Diwali break.",
  },
  {
    match: "Diwali", title: "Diwali", blurb: "Lakshmi Puja. Shops close early, highways empty.",
    notice: "The roads empty: FASTag tolls fall {m:netc}. Cash still rises ({m:atm}) and UPI edges up ({m:upi}), while NEFT ({m:neft}) and cheques ({m:cts}) almost stop.",
    why: "Lakshmi Puja is a day at home. Few people travel and banks are shut, but the last sweets, flowers and diyas still have to be bought, in cash or by phone.",
  },
  {
    match: "Govardhan Puja (day after Diwali)", title: "The day after Diwali", blurb: "Visits, gifts and a lie-in.",
    notice: "Everything goes quiet: UPI {m:upi}, debit cards {m:debit_card}, FASTag {m:netc}.",
    why: "The shopping was done on Dhanteras. The day after Diwali is for family visits and, in Gujarat, the New Year, so shops and offices stay shut.",
  },
  {
    match: "Holi", title: "Holi", blurb: "The morning India puts its phone in a plastic bag.",
    notice: "The quietest festival in the data. UPI falls {m:upi}, ATM cash {m:atm}, FASTag {m:netc} and village cash {m:micro_atm}.",
    why: "Holi is played in the street in the morning. Phones and wallets stay indoors, shops open late and the roads empty. It is one of the few days when even UPI takes a clear dip.",
  },
  {
    match: "Eid al-Fitr", title: "Eid al-Fitr", blurb: "The end of Ramzan.",
    notice: "A gentle dip: UPI {m:upi}, debit cards {m:debit_card}, ATM cash {m:atm}.",
    why: "Most Eid shopping happens in the last days of Ramzan. The day itself is for prayers, family and food at home, and banks are closed.",
  },
  {
    match: "Raksha Bandhan", title: "Raksha Bandhan", blurb: "Brothers, sisters and gifts.",
    notice: "A cash festival: ATM withdrawals rise {m:atm} while UPI barely moves ({m:upi}).",
    why: "Brothers traditionally give their sisters a gift, very often crisp notes in an envelope. That is one gift people still prefer to hand over in cash.",
  },
  {
    match: "Janmashtami", title: "Janmashtami", blurb: "Krishna's birthday.",
    notice: "Barely a blip across India: UPI {m:upi}, ATM cash {m:atm}.",
    why: "It is a holiday in some states and a working day in others, and the celebration happens at midnight, at home and in temples. Nationally the effect averages out.",
  },
  {
    match: "Ganesh Chaturthi", title: "Ganesh Chaturthi", blurb: "Ten days of pandals begin.",
    notice: "UPI holds steady ({m:upi}) while cards fall {m:debit_card} and NEFT {m:neft}.",
    why: "Banks close in Maharashtra, Karnataka, Goa and other states, so the banking side slows. People keep paying for flowers, sweets and idols by phone.",
  },
  {
    match: "Dussehra", title: "Dussehra", blurb: "Navratri ends and effigies burn.",
    notice: "The bank-holiday signature: cheques {m:cts}, NEFT {m:neft}, debit cards {m:debit_card}, while UPI dips only {m:upi}.",
    why: "Dussehra closes banks across most of India. The gap between the bars shows how far UPI has freed everyday payments from bank opening hours.",
  },
  {
    match: "Christmas", title: "Christmas", blurb: "A day off for banks, a day out for families.",
    notice: "Banks rest (NEFT {m:neft}) but people don't: UPI is {m:upi} and FASTag {m:netc}.",
    why: "Christmas is a national bank holiday in the middle of the winter break, so offices close while malls, restaurants and highways stay busy.",
  },
  {
    match: "New Year's Eve", title: "New Year's Eve", blurb: "The busiest night out of the year.",
    notice: "One of the few days when nearly everything rises together: UPI {m:upi}, ATM cash {m:atm}, credit cards {m:credit_card}, village cash {m:micro_atm}.",
    why: "Parties, dinners and travel, and it is a normal working day for banks, so nothing holds the numbers back.",
  },
  {
    match: "Makar Sankranti", title: "Makar Sankranti", blurb: "Kites and the harvest.",
    notice: "Almost no national effect: UPI {m:upi}, ATM cash {m:atm}.",
    why: "It goes by many names (Pongal, Lohri, Bihu, Uttarayan) and falls on slightly different days in different states, so the effect spreads thin across India.",
  },
];

export const MOMENTS: Featured[] = [
  {
    match: "T20 World Cup final (India win)", title: "T20 World Cup final, 2024", date: "2024-06-29", blurb: "India beat South Africa in Barbados.",
    notice: "Spending went up, not down: UPI {l:upi}, debit cards {l:debit_card}, credit cards {l:credit_card}.",
    why: "The final started at 8 pm IST on a Saturday. Watch parties, food orders and celebrations added to the day rather than stopping it. Winning helps.",
  },
  {
    match: "Cricket World Cup final (India v Australia)", title: "World Cup final, 2023", date: "2023-11-19", blurb: "A Sunday in Ahmedabad.",
    notice: "UPI stayed flat ({l:upi}) while card spending fell ({l:debit_card} debit, {l:credit_card} credit).",
    why: "A whole Sunday afternoon in front of the TV, ending in defeat to Australia. There was nothing to go out and celebrate.",
  },
  {
    match: "Champions Trophy final (India win)", title: "Champions Trophy final, 2025", date: "2025-03-09", blurb: "India beat New Zealand in Dubai.",
    notice: "Barely a ripple: UPI {l:upi}, ATM cash {l:atm}.",
    why: "A Sunday afternoon final that India won. Cricket fills the screens, but people pay for their lives either way.",
  },
  {
    match: "India v Pakistan, Champions Trophy", title: "India v Pakistan, 2025", date: "2025-02-23", blurb: "The fixture that stops a country.",
    notice: "Except it doesn't stop payments: UPI {l:upi}, ATM cash {l:atm}.",
    why: "The most-watched match in cricket, on a Sunday. UPI is now so woven into daily life that even this barely dents it.",
  },
  {
    match: "IPL final", title: "IPL final", blurb: "Two months of cricket, one evening.",
    notice: "Nothing happens: UPI {m:upi} and ATM cash {m:atm} in a typical final.",
    why: "The final is played in the evening, after most of the day's spending is done. One match doesn't change what a country buys.",
  },
  {
    match: "Union Budget", title: "Budget day", blurb: "The Finance Minister speaks.",
    notice: "Households carry on as normal: UPI {m:upi}, ATM cash {m:atm}.",
    why: "The Budget moves stock markets and headlines, not shopping baskets. Its effects reach people's wallets months later.",
  },
  {
    match: "Lok Sabha results day", title: "Election results, 2024", date: "2024-06-04", blurb: "Counting day.",
    notice: "Everything dipped a little: UPI {l:upi}, ATM cash {l:atm}, FASTag {l:netc}, debit cards {l:debit_card}.",
    why: "A Tuesday spent watching the count. Fewer trips and fewer errands, with the whole country waiting for the same number.",
  },
  {
    match: "Independence Day", title: "Independence Day", blurb: "Flags, kites and a day off.",
    notice: "UPI barely notices ({m:upi}), but NEFT falls {m:neft} and FASTag rises {m:netc}.",
    why: "A national bank holiday that often makes a long weekend. Offices close, so bank transfers stop; families hit the road, so tolls rise.",
  },
  {
    match: "Republic Day", title: "Republic Day", blurb: "The parade and a day off.",
    notice: "The same holiday pattern: NEFT {m:neft}, debit cards {m:debit_card}, FASTag {m:netc}, UPI only {m:upi}.",
    why: "Like every national holiday, the banking system rests and people don't.",
  },
  {
    match: "Gandhi Jayanti", title: "Gandhi Jayanti", blurb: "A dry day and a bank holiday.",
    notice: "NEFT falls {m:neft} and debit cards {m:debit_card}; UPI hardly moves ({m:upi}).",
    why: "A bank holiday in the run-up to the festive season. Shops stay open, so phone payments carry on.",
  },
];

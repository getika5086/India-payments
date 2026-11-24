/**
 * Featured event cards. `match` is the event name in data/events.csv; `date`
 * pins one occurrence (otherwise the latest confirmed one is shown, and
 * other years appear underneath). Owner-approved list goes here.
 */
export type Featured = { match: string; title: string; blurb: string; date?: string };

export const FESTIVALS: Featured[] = [
  { match: "Dhanteras", title: "Dhanteras", blurb: "The day to buy gold, utensils and new things. India still reaches for cash." },
  { match: "Diwali", title: "Diwali", blurb: "Lakshmi Puja. Shops close early, highways empty, families stay home." },
  { match: "Govardhan Puja (day after Diwali)", title: "The day after Diwali", blurb: "Visits, gifts and the long road back." },
  { match: "Holi", title: "Holi", blurb: "The morning India puts its phone in a plastic bag." },
  { match: "Eid al-Fitr", title: "Eid al-Fitr", blurb: "The end of Ramzan: new clothes, sweets and family." },
  { match: "Raksha Bandhan", title: "Raksha Bandhan", blurb: "Brothers, sisters, gifts and a lot of travel." },
  { match: "Janmashtami", title: "Janmashtami", blurb: "Krishna's birthday: fasting by day, celebration at midnight." },
  { match: "Ganesh Chaturthi", title: "Ganesh Chaturthi", blurb: "Ten days of pandals, idols and processions begin." },
  { match: "Dussehra", title: "Dussehra", blurb: "Navratri ends, effigies burn, and the festive season shifts up a gear." },
  { match: "Christmas", title: "Christmas", blurb: "A holiday for banks; a party for malls." },
  { match: "New Year's Eve", title: "New Year's Eve", blurb: "The busiest night out of the year." },
  { match: "Makar Sankranti", title: "Makar Sankranti", blurb: "Kites, harvest and the first big festival of the year." },
];

export const MOMENTS: Featured[] = [
  { match: "T20 World Cup final (India win)", title: "T20 World Cup final, 2024", blurb: "India beat South Africa in Barbados. Late night in India, and a country glued to one screen.", date: "2024-06-29" },
  { match: "Cricket World Cup final (India v Australia)", title: "World Cup final, 2023", blurb: "A Sunday in Ahmedabad that ended in heartbreak.", date: "2023-11-19" },
  { match: "Champions Trophy final (India win)", title: "Champions Trophy final, 2025", blurb: "India beat New Zealand in Dubai on a Sunday afternoon.", date: "2025-03-09" },
  { match: "India v Pakistan, Champions Trophy", title: "India v Pakistan", blurb: "The fixture that stops a country.", date: "2025-02-23" },
  { match: "IPL final", title: "IPL final", blurb: "Two months of cricket come down to one evening." },
  { match: "Union Budget", title: "Budget day", blurb: "The Finance Minister speaks; markets and households listen." },
  { match: "Lok Sabha results day", title: "General election results, 2024", blurb: "Counting day: 640 million votes, one morning.", date: "2024-06-04" },
  { match: "Independence Day", title: "Independence Day", blurb: "A national holiday: flags, kites and a long weekend for many." },
  { match: "Republic Day", title: "Republic Day", blurb: "The parade on Kartavya Path, and a day off for banks." },
  { match: "Gandhi Jayanti", title: "Gandhi Jayanti", blurb: "A dry day and a bank holiday." },
];

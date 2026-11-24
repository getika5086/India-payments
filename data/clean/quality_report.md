# Data quality report

Source: RBI, Payment Systems - Daily Data Publication (workbook PSDDP04062020.xlsx), with the India Data Portal copy as a fallback.
Days in RBI workbook: 2366; cells filled from the fallback: 0; days in final data: 2366.
Date range: 01 Jun 2020 to 22 Nov 2026.

## Missing days

None. Every calendar day in the range has a row.

## Coverage by rail (share of days with data)

| Rail | First day | Last day | Days with data |
| --- | --- | --- | --- |
| aeps | 01 Jun 2020 | 22 Nov 2026 | 2366 |
| atm | 01 Jun 2020 | 22 Nov 2026 | 2366 |
| bbps | 01 Jun 2020 | 22 Nov 2026 | 2366 |
| credit_card | 01 Nov 2020 | 22 Nov 2026 | 2213 |
| cts | 01 Jun 2020 | 21 Nov 2026 | 1862 |
| debit_card | 01 Nov 2020 | 22 Nov 2026 | 2213 |
| imps | 01 Jun 2020 | 22 Nov 2026 | 2366 |
| micro_atm | 01 Jun 2020 | 22 Nov 2026 | 2366 |
| nach_credit | 01 Jun 2020 | 22 Nov 2026 | 2271 |
| nach_debit | 01 Jun 2020 | 22 Nov 2026 | 2268 |
| neft | 01 Jun 2020 | 22 Nov 2026 | 2366 |
| netc | 01 Jun 2020 | 22 Nov 2026 | 2366 |
| rtgs | 01 Jun 2020 | 22 Nov 2026 | 2322 |
| upi | 01 Jun 2020 | 22 Nov 2026 | 2366 |

## Notes

- The last month (November 2026) is partial: data runs to 22 November.
- Volumes are in lakh transactions (1 lakh = 100,000); values in crore rupees (1 crore = 10 million).
- Cheques (CTS), NACH and RTGS have no data on bank holidays and Sundays when those systems do not settle; this is normal, not a gap.
- Card data: a single combined column until 2021, then separate shop (PoS) and online columns, which are added together here.
- The RBI workbook and the India Data Portal copy agree within 0.2% on 1,888 shared days for every rail except bill payments (BBPS), where 25 days differ by more than 1% (up to 11%), probably later RBI revisions. RBI's workbook is used.
- From August 2025 RBI reports FASTag trips made with the new annual pass on a separate line; they are not in the NETC volume used here, so NETC may step down from that point.
- RBI notes NETC figures cover FASTags linked to all instruments, so they differ from the monthly bulletin.

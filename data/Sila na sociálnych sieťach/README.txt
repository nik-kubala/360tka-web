================================================================================
README — Sila na sociálnych sieťach
================================================================================

Tento balík obsahuje manuálne zozbierané facebookové dáta zo sekcie
"Sila na sociálnych sieťach" v portfóliu. Dataset zachytáva 61 príspevkov
štyroch politikov v období od 1. marca 2026 do 5. marca 2026.

JSON obsahuje príspevky zoskupené podľa politika. XLSX obsahuje rovnaké
dáta v tabuľkovej podobe (jeden riadok = jeden príspevok).


OBSAH BALÍKA
────────────────────────────────────────────────────────────────────────────────

  facebook_prispevky_2026-03-01_2026-03-05.json    hlavný výstupný súbor (JSON)
  facebook_prispevky_2026-03-01_2026-03-05.xlsx    rovnaké dáta vo formáte Excel
  README.txt                                       tento súbor


POPIS STĹPCOV
────────────────────────────────────────────────────────────────────────────────

V XLSX (jeden riadok = jeden príspevok):

  Meno         celé meno politika
  Skratka      skrátené meno používané v grafoch
  Poradie      poradie príspevku v analyzovanom období
  Typ          reels | post | event
  Likes        počet lajkov
  Komentáre    počet komentárov
  Zdieľania    počet zdieľaní; pri udalosti 0
  Videnia      počet videní; pri klasickom poste a udalosti 0
  Interakcie   súčet Likes + Komentáre + Zdieľania

V JSON (príspevky sú zoskupené pod profilmi):

  profiles[].label        meno politika
  profiles[].shortLabel   skrátené meno používané v grafoch
  profiles[].posts[]      pole príspevkov s kľúčmi: likes, comments,
                          shares, views, type


METODICKÁ POZNÁMKA
────────────────────────────────────────────────────────────────────────────────

Typ príspevku:

  reels   príspevok s počtom videní
  event   udalosť — bez zdieľaní aj videní
  post    klasický príspevok — so zdieľaniami, bez videní

Všetky číselné hodnoty sú celé čísla.


ZHRNUTIE
────────────────────────────────────────────────────────────────────────────────

  Počet politikov: 4
  Počet príspevkov: 61
  Platforma: Facebook
  Obdobie zberu: 2026-03-01 až 2026-03-05

================================================================================

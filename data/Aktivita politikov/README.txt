================================================================================
README — Aktivita poslancov Národnej rady SR
================================================================================

Tento balík obsahuje dáta o legislatívnej aktivite poslancov Národnej rady
Slovenskej republiky. Pre každého poslanca je zaznamenaný počet návrhov
zákonov, pozmeňujúcich návrhov a vystúpení v rozprave.

Dáta pochádzajú z webstránky Národnej rady SR (nrsr.sk) a portálu
polidata.sk. Dáta sú voľne k dispozícii — môžeš ich použiť, upraviť
a šíriť bez obmedzení.


OBSAH BALÍKA
────────────────────────────────────────────────────────────────────────────────

  nrsr_aktivita_poslancov.json    hlavný výstupný súbor (JSON)
  nrsr_aktivita_poslancov.xlsx    rovnaké dáta vo formáte Excel
  README.txt                      tento súbor


POPIS STĹPCOV
────────────────────────────────────────────────────────────────────────────────

  meno                    meno a titul poslanca
  strana                  poslanecký klub / strana
  aktivny_mandat          true = poslanec má aktívny mandát, false = mandát zanikol
  navrhy_zakonov          počet podaných návrhov zákonov
  pozmenujuce_navrhy      počet podaných pozmeňujúcich návrhov
  vystupenia_v_rozprave   počet vystúpení v parlamentnej rozprave

Všetky číselné hodnoty sú celé čísla.
Záznamy sú zoradené zostupne podľa celkovej aktivity.


ZDROJE
────────────────────────────────────────────────────────────────────────────────

  Národná rada SR     https://www.nrsr.sk
  Polidata            https://polidata.sk

================================================================================

================================================================================
README — Voľby do NRSR 2023 a nezamestnanosť po okresoch SR
================================================================================

Tento balík obsahuje spracované dáta o výsledkoch parlamentných volieb 2023
a miere nezamestnanosti v jednotlivých okresoch Slovenska. Dáta boli zlúčené
za účelom porovnania volebných výsledkov vybraných strán s disponibilnou mierou
nezamestnanosti (PDU) na úrovni okresu.

Dáta sú voľne k dispozícii — môžeš ich použiť, upraviť a šíriť bez obmedzení.


OBSAH BALÍKA
────────────────────────────────────────────────────────────────────────────────

  volby_nrsr2023_nezamestnanost_sep2023.json    hlavný výstupný súbor (JSON)
  volby_nrsr2023_nezamestnanost_sep2023.xlsx    rovnaké dáta vo formáte Excel
  ZDROJ_susr_volby_nrsr2023.xlsx                zdrojový súbor volieb (ŠÚ SR)
  ZDROJ_upsvr_nezamestnanost_sep2023.xlsx       zdrojový súbor nezam. (ÚPSVaR)
  README.txt                                    tento súbor


POPIS STĹPCOV VÝSTUPNÉHO SÚBORU
────────────────────────────────────────────────────────────────────────────────

  okres          názov okresu (79 okresov SR, bez zahraničia)
  nezam_pct      disponibilná miera nezamestnanosti v % (PDU), september 2023
  SMER           % platných hlasov pre SMER – sociálna demokracia
  PS             % platných hlasov pre Progresívne Slovensko
  HLAS           % platných hlasov pre HLAS – sociálna demokracia
  OLaNO          % platných hlasov pre OĽANO A PRIATELIA (celá koalícia)
  KDH            % platných hlasov pre Kresťanskodemokratické hnutie
  SaS            % platných hlasov pre Sloboda a Solidarita
  SNS            % platných hlasov pre Slovenskú národnú stranu
  REPUBLIKA      % platných hlasov pre REPUBLIKA
  SZÖVETSÉG      % platných hlasov pre SZÖVETSÉG / ALIANCIA

Všetky číselné hodnoty sú zaokrúhlené na 2 desatinné miesta.
Záznamy sú zoradené abecedne podľa názvu okresu.


================================================================================
METODIKA SPRACOVANIA
================================================================================


1. VSTUPNÉ SÚBORY
─────────────────

A) ZDROJ_susr_volby_nrsr2023.xlsx
   Sheet:           NRSR2023_SK_tab03d
   Pôvod:           Štatistický úrad SR – výsledky volieb do Národnej rady SR 2023
   Formát:          Dlhý formát (jeden riadok = jeden okres × jedna strana)
   Header:          Riadok 2 v súbore (header=1 pri načítaní, potom iloc[0] ako názvy)
   Celkový počet riadkov (bez hlavičky): 1998
   Počet unikátnych strán: 25
   Počet unikátnych okresov: 80 (vrátane "cudzina")

B) ZDROJ_upsvr_nezamestnanost_sep2023.xlsx
   Sheet:           Tab2
   Pôvod:           ÚPSVaR – Mesačná štatistika o počte a štruktúre uchádzačov o zamestnanie
   Obdobie:         September 2023 (dátum v bunke: 2023-09-01)
   Použité stĺpce:  stĺpec 0 = poradie, stĺpec 1 = názov územia, stĺpec 2 = PDU (%)
   Dáta začínajú:   Riadok 8 (index) — prvých 7 riadkov sú hlavičky a popis
   Metrika:         "Ku koncu sledovaného mesiaca v %" = disponibilná miera nezamestnanosti (PDU)


2. VÝBER STRÁN Z VOLEBNÉHO SÚBORU
──────────────────────────────────

Skratka   Presný názov strany v súbore
────────  ────────────────────────────────────────────────────────────────────────────────────────
SMER      SMER - sociálna demokracia
PS        Progresívne Slovensko
HLAS      HLAS - sociálna demokracia
OLaNO     OĽANO A PRIATELIA: OBYČAJNÍ ĽUDIA (OĽANO), NEZÁVISLÍ KANDIDÁTI (NEKA), NOVA,
          SLOBODNÍ A ZODPOVEDNÍ, PAČIVALE ROMA, MAGYAR SZÍVEK a Kresťanská únia a ZA ĽUDÍ
KDH       Kresťanskodemokratické hnutie
SaS       Sloboda a Solidarita
SNS       Slovenská národná strana
REPUBLIKA REPUBLIKA
SZÖVETSÉG SZÖVETSÉG - Magyarok. Nemzetiségek. Regiók. | ALIANCIA - Maďari. Národnosti. Regióny

Použitý stĺpec: "Podiel platných hlasov v %" (nie absolútny počet hlasov)


3. FILTROVANIE NEZAMESTNANOSTI
───────────────────────────────

Z Tab2 boli ponechané IBA riadky, kde stĺpec "poradie" obsahuje číslo (1–79).
Vyradené boli agregátne riadky bez čísla v stĺpci poradie:

  - Prešovský kraj
  - Banskobystrický kraj
  - Košický kraj
  - Žilinský kraj
  - Trenčiansky kraj
  - Nitriansky kraj
  - Trnavský kraj
  - Bratislavský kraj
  - Slovensko (celonárodný priemer)

Výsledok: 79 okresov.


4. ZLÚČENIE (MERGE)
────────────────────

Kľúč:  názov okresu (case-insensitive, po strip() bielych znakov)
Typ:   inner join (oba súbory musia obsahovať rovnaký okres)

Z volebného súboru bol vyradený 1 záznam bez zhody v nezamestnanosti:
  - "cudzina" (hlasy zo zahraničia — v ÚPSVaR dátach logicky neexistuje)

Výsledok po merge: 79 okresov × 10 premenných.


5. KONTROLNÉ ŠTATISTIKY
─────────────────────────

Nezamestnanosť (PDU, september 2023):
  Min:    2,05 % — Nitra
  Max:    9,92 % — Kežmarok
  Priemer: 4,25 %

Volebné výsledky — podiel platných hlasov (%):
  Strana     Min      Max      Priemer
  ─────────  ───────  ───────  ────────
  SMER        6,10 %  38,92 %   23,91 %
  PS          5,31 %  61,70 %   16,11 %
  HLAS        2,46 %  24,17 %   15,67 %
  OLaNO       3,81 %  26,80 %    9,08 %
  KDH         0,90 %  30,35 %    7,16 %
  SNS         1,35 %  11,07 %    5,99 %
  SaS         2,31 %  15,14 %    5,70 %
  REPUBLIKA   1,64 %   7,49 %    5,01 %
  SZÖVETSÉG   0,00 %  48,78 %    3,65 %


6. VÝSTUPNÝ SÚBOR
──────────────────

Súbor:   volby_nrsr2023_nezamestnanost_sep2023.json
Štruktúra:
  {
    "meta": { popis zdrojov, stĺpcov, rok volieb, mesiac nezamestnanosti },
    "data": [ { "okres": "...", "nezam_pct": X.XX, "SMER": X.XX, ... }, ... ]
  }

Záznamy sú zoradené abecedne podľa názvu okresu.
Všetky číselné hodnoty sú zaokrúhlené na 2 desatinné miesta.

================================================================================

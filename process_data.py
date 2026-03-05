"""
Spracovanie dát: volebné výsledky + nezamestnanosť po okresoch
Výstup: JSON pole objektov pripravených na priame vloženie do Chart.js scatter plotu

Použitie:
    pip install pandas
    python process_data.py --volby volby_okresy.csv --nezam nezamestnanost_okresy.csv [--strana "SMER - SD (%)"]
"""

import argparse
import json
import sys

import pandas as pd


def load_and_merge(path_volby: str, path_nezam: str, strana_col: str) -> pd.DataFrame:
    volby = pd.read_csv(path_volby)
    nezam = pd.read_csv(path_nezam)

    # Normalizuj názvy stĺpcov — odstráň medzery na okrajoch
    volby.columns = volby.columns.str.strip()
    nezam.columns = nezam.columns.str.strip()

    required_volby = {"Okres", strana_col}
    required_nezam = {"Okres", "Miera nezamestnanosti (%)"}

    missing = (required_volby - set(volby.columns)) | (required_nezam - set(nezam.columns))
    if missing:
        print(f"Chyba: chýbajúce stĺpce: {missing}", file=sys.stderr)
        sys.exit(1)

    merged = pd.merge(
        volby[["Okres", strana_col]],
        nezam[["Okres", "Miera nezamestnanosti (%)"]],
        on="Okres",
        how="inner",
    )

    merged = merged.rename(columns={
        strana_col: "volby_pct",
        "Miera nezamestnanosti (%)": "nezam_pct",
    })

    # Vypusť riadky s chýbajúcimi hodnotami
    merged = merged.dropna(subset=["volby_pct", "nezam_pct"])

    return merged


def to_chartjs_data(df: pd.DataFrame) -> list[dict]:
    """
    Vráti pole objektov vo formáte, ktorý Chart.js scatter plot priamo konzumuje:
    [{ "label": "Okres XY", "x": 12.4, "y": 38.1 }, ...]
    """
    return [
        {
            "label": row["Okres"],
            "x": round(float(row["nezam_pct"]), 2),
            "y": round(float(row["volby_pct"]), 2),
        }
        for _, row in df.iterrows()
    ]


def main():
    parser = argparse.ArgumentParser(description="Merge volebné + nezamestnanosť dáta")
    parser.add_argument("--volby", required=True, help="CSV s volebnými výsledkami")
    parser.add_argument("--nezam", required=True, help="CSV s mierou nezamestnanosti")
    parser.add_argument(
        "--strana",
        default="SMER - SD (%)",
        help='Názov stĺpca so stranou (default: "SMER - SD (%)")',
    )
    parser.add_argument("--out", default=None, help="Výstupný .json súbor (default: stdout)")
    args = parser.parse_args()

    df = load_and_merge(args.volby, args.nezam, args.strana)
    data = to_chartjs_data(df)

    output = json.dumps(data, ensure_ascii=False, indent=2)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Zapísané do {args.out} ({len(data)} okresov).")
    else:
        print("// Vygenerované cez process_data.py — vlož priamo do app.js")
        print(f"const SCATTER_DATA = {output};")


if __name__ == "__main__":
    main()

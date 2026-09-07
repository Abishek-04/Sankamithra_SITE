#!/usr/bin/env python3
"""
Build data/products.json from the 2026 Sivakasi price list.

Every row is transcribed exactly as printed — S.No, item name, box contents,
price, the unit that price applies to, and the case/container quantity.
Images are Cloudinary public IDs; `None` means no photograph exists yet and
the card falls back to a branded placeholder.
"""
import json, re, unicodedata

SPECIALS = "Sankamithra Specials"
MAGICS   = "Sankamithra Magics"
ONESOUND = "One Sound Crackers"
CHAKKAR  = "Ground Chakkars"
POTS     = "Flower Pots"
ATOM     = "Atom Bombs"
BIJILI   = "Bijili Crackers"
TWINKLE  = "Twinkling Stars"
PENCIL   = "Pencils"
REPEAT   = "Repeating Shots"
AERIAL   = "Aerial Shots"

SP = "sankamithra/sankamithraspecials/"
MG = "sankamithra/magics/"
OS_ = "sankamithra/onesound/"
GC = "sankamithra/groundchakkars/"
FP = "sankamithra/flowerpots/"
AB = "sankamithra/atombombs/"
BJ = "sankamithra/bijili/"
TS = "sankamithra/twinklingstars/"
PC = "sankamithra/pencils/"
RS = "sankamithra/repeatingshots/"
OT = "sankamithra/other/"

def imgs(base, n):
    """Cloudinary folders store numbered variants: base/1 … base/n."""
    return [f"{base}{i}" for i in range(1, n + 1)]

# sno, name, contents, price, per, case, images
ROWS = [
 # ---------------------------------------------------- Sankamithra Specials
 ("S101", 'Lucky Money (3 Pcs)',                        "3 Pcs",  140, "1 Box",  "60 Boxes",  imgs(SP+"luckymoney/", 3)),
 ("S102", 'Sound Party (3 Pcs)',                        "3 Pcs",  130, "1 Box",  "60 Boxes",  imgs(SP+"soundparty/", 3)),
 ("S103", 'Oola Vedi (25 Pcs)',                         "25 Pcs", 135, "1 Box",  "60 Boxes",  imgs(SP+"oolavedi/", 3)),
 ("S104", 'Popcorn Pencil (5 Pcs)',                     "5 Pcs",  170, "1 Box",  "50 Boxes",  imgs(SP+"popcorn/", 4)),
 ("S105", 'Water Falls Pencil (5 Pcs)',                 "5 Pcs",  170, "1 Box",  "50 Boxes",  imgs(SP+"waterfalls/", 4)),
 ("S106", 'Hunter 007 (5 Pcs)',                         "5 Pcs",  170, "1 Box",  "50 Boxes",  imgs(SP+"hunter/", 3)),
 ("S107", 'Kalashinkov (2 Pcs)',                        "2 Pcs",  170, "1 Box",  "50 Boxes",  imgs(SP+"kalashinkov-/", 3)),
 ("S108", 'Red & Green, Crackling, Golden Peacock',     "1 Pce",  150, "1 Box",  "60 Boxes",  imgs(SP+"peacockgolden-red-green/", 3)),
 ("S109", 'Kids Star Wars (2 Pcs)',                     "2 Pcs",  150, "1 Box",  "60 Boxes",  imgs(SP+"starwars/", 4)),
 ("S110", '6" Aqua Queen',                              "1 Pce",  170, "1 Pce",  "60 Pcs",    imgs(SP+"aquaqueen/", 1)),
 ("S111", '6" Monster T N 67',                          "1 Pce",  170, "1 Pce",  "60 Pcs",    imgs(SP+"monster/", 1)),
 ("S112", '6" Rolex 100 (Rx100)',                       "1 Pce",  170, "1 Pce",  "60 Pcs",    imgs(SP+"rolex/", 1)),
 ("S113", 'Mowgli (5 Pcs)',                             "5 Pcs",   80, "1 Box",  "100 Boxes", []),
 ("S114", 'Mankatha (5 Pcs)',                           "5 Pcs",  170, "1 Box",  "50 Boxes",  imgs(SP+"mankaths/", 1)),
 ("S115", 'Super Singer (5 Pcs)',                       "5 Pcs",  115, "1 Box",  "100 Boxes", imgs(SP+"supersinger/", 1)),
 ("S116", 'Badaa Peacock',                              "1 Pce",  255, "1 Box",  "30 Boxes",  imgs(SP+"badaapeacock/", 1)),
 ("S117", '100" W-Power (3 Pcs)',                       "3 Pcs",  110, "1 Box",  "100 Boxes", imgs(SP+"100wpower/", 1)),
 ("S118", 'The Leader (3 Pcs)',                         "3 Pcs",  160, "1 Box",  "80 Boxes",  imgs(SP+"theleader/", 1)),
 ("S119", 'Jigarthanda (3 Pcs)',                        "3 Pcs",  150, "1 Box",  "100 Boxes", imgs(SP+"jigarthanda/", 3)),
 # ------------------------------------------------------ Sankamithra Magics
 ("S151", 'Thunder Coconut Cracklig (3 Pcs)',           "3 Pcs",  240, "1 Box",  "60 Boxes",  ["sankamithra/designs/thundercoconut"]),
 ("S152", 'Fire & Feather (5 Pcs)',                     "5 Pcs",   85, "1 Box",  "120 Boxes", [MG+"fireandfeather"]),
 ("S153", 'Nebula (5 Pcs)',                             "5 Pcs",   80, "1 Box",  "120 Boxes", [MG+"nebula"]),
 ("S154", 'Golden Sparrow (5 Pcs)',                     "5 Pcs",   80, "1 Box",  "120 Boxes", [MG+"goldensparrow"]),
 ("S155", 'Dragon Slay (5 Pcs) (Multicolor)',           "5 Pcs",  120, "1 Box",  "84 Boxes",  [MG+"dragonslay"]),
 ("S156", 'McLaren (3 Pcs)',                            "3 Pcs",  180, "1 Box",  "60 Boxes",  []),
 ("S157", 'Formula 1 (3 Pcs Tin Box) (Multicolor)',     "3 Pcs",  190, "1 Box",  "60 Boxes",  []),
 ("S158", 'Penta Race (5 Pcs) (Multicolor)',            "5 Pcs",  130, "1 Box",  "90 Boxes",  []),
 ("S159", 'Rapid Burst (5 Pcs) (Multicolor)',           "5 Pcs",  150, "1 Box",  "90 Boxes",  []),
 # ---------------------------------------------------- One Sound Crackers
 ("S201", '2 3/4" Kuruvi Crackers',                     "",      7300, "1000 Pkt", "1600 Pkts", imgs(OS_+"kuruvi/", 1)),
 ("S202", '3 1/2" Flash Crackers',                      "",      7200, "750 Pkt",  "750 Pkts",  imgs(OS_+"flash/", 1)),
 ("S203", '3 1/2" Chhoto Beam Crackers',                "",      7200, "750 Pkt",  "750 Pkts",  imgs(OS_+"chhotabheem/", 1)),
 ("S204", '3 1/2" Lakshmi Crackers',                    "",      7200, "750 Pkt",  "750 Pkts",  imgs(OS_+"lakshmi/", 1)),
 ("S205", '4" Ant-Man Crackers',                        "",      7200, "500 Pkt",  "500 Pkts",  imgs(OS_+"antman/", 1)),
 ("S206", '4" Dora Crackers',                           "",      7200, "500 Pkt",  "500 Pkts",  imgs(OS_+"dora/", 1)),
 ("S207", '4" Zippy Crackers',                          "",      7200, "500 Pkt",  "500 Pkts",  imgs(OS_+"zippy/", 1)),
 ("S208", '4" Dead Pool Deluxe (8 Ply)',                "",      7450, "450 Pkt",  "500 Pkts",  imgs(OS_+"deadpool/", 1)),
 ("S209", '4" Lakshmi Deluxe (8 Ply)',                  "",      7450, "450 Pkt",  "450 Pkts",  imgs(OS_+"lakshmideluxe/", 1)),
 ("S210", '4" Little Singam Deluxe (8 Ply)',            "",      7450, "450 Pkt",  "450 Pkts",  imgs(OS_+"littlesingam/", 1)),
 ("S211", '4" Gold Ben10 Deluxe (10 Ply)',              "",      7380, "300 Pkt",  "300 Pkts",  imgs(OS_+"goldben10/", 1)),
 ("S212", '4" Thanos Mega Deluxe (12 Ply)',             "",      7380, "300 Pkt",  "300 Pkts",  imgs(OS_+"thanosmegadeluxe/", 1)),
 ("S213", '4" Shiva Mega Deluxe (12 Ply)',              "",      7380, "300 Pkt",  "300 Pkts",  imgs(OS_+"shivamegadeluxe/", 1)),
 ("S214", '4" Lion Mega Deluxe (12 Ply)',               "",      7380, "300 Pkt",  "300 Pkts",  imgs(OS_+"lionmegadeluxe/", 1)),
 # -------------------------------------------------------- Ground Chakkars
 ("S301", 'Ground Chakkar Big (25 Pcs)',                "25 Pcs", 255, "unit", "55 Units", imgs(GC+"groundchakkarbig25/", 4)),
 ("S302", 'Ground Chakkar Big (10 Pcs)',                "10 Pcs", 280, "unit", "45 Units", imgs(GC+"groundchakkarbig10/", 4)),
 ("S303", 'Ground Chakkar Asoka',                       "10 Pcs", 390, "unit", "25 Units", imgs(GC+"groundchakkarasoka/", 4)),
 ("S304", 'Ground Chakkar Special',                     "10 Pcs", 525, "unit", "19 Units", imgs(GC+"groundchakkarspecial/", 4)),
 ("S305", 'Ground Chakkar Deluxe',                      "10 Pcs", 935, "unit", "12 Units", imgs(GC+"groundchakkardeluxe/", 4)),
 ("S306", 'Ground Chakkar Orbit Spinner',               "10 Pcs",1030, "unit", "12 Units", imgs(GC+"groundchakkarorbitspinner/", 1)),
 # ------------------------------------------------------------ Flower Pots
 ("S351", 'Flower Pots Small',                          "10 Pcs", 400, "unit",  "36 Units", imgs(FP+"flowerpotssmall/", 4)),
 ("S352", 'Flower Pots Big',                            "10 Pcs", 500, "unit",  "20 Units", imgs(FP+"flowerpotsbig/", 4)),
 ("S353", 'Flower Pots Special',                        "10 Pcs", 650, "unit",  "18 Units", imgs(FP+"flowerpotsspecial/", 4)),
 ("S354", 'Flower Pots Asoka',                          "10 Pcs", 880, "unit",  "10 Units", imgs(FP+"flowerpotsasoka/", 4)),
 ("S355", 'Flower Pots Colour Koti',                    "10 Pcs",1480, "unit",  "6 Units",  imgs(FP+"flowerpotscolourkoti/", 4)),
 ("S356", 'Flower Pots Deluxe',                         "5 Pcs",  130, "1 Box", "54 Boxes", imgs(FP+"flowerpotsdeluxe/", 4)),
 ("S357", 'Colour Koti Deluxe',                         "10 Pcs", 250, "1 Box", "45 Boxes", []),
 ("S358", 'Flower Pots Super Deluxe',                   "2 Pcs",   95, "1 Box", "90 Boxes", []),
 ("S359", 'Rome Pots (Colour)',                         "10 Pcs", 210, "1 Box", "40 Boxes", []),
 # ------------------------------------------------------------- Atom Bombs
 ("S401", 'Hydro Bomb',                                 "10 Pcs", 640, "Unit",  "30 Units",  [OT+"Hydrobomb"]),
 ("S402", 'King Bomb',                                  "10 Pcs", 770, "Unit",  "20 Units",  [OT+"42"]),
 ("S403", 'Classic Bomb',                               "10 Pcs", 900, "Unit",  "15 Units",  [OT+"43"]),
 ("S404", 'Bullet Bomb',                                "10 Pcs", 172, "Unit",  "50 Units",  imgs(AB+"bulletbomb/", 1)),
 ("S405", 'Mega Bullet Bomb',                           "10 Pcs", 260, "Unit",  "30 Units",  imgs(AB+"megabulletbomb/", 1)),
 ("S407", 'Magic Pops (Chit Put)',                      "10 Pcs", 265, "Unit",  "40 Units",  []),
 ("S406", 'Flower Bomb',                                "5 Pcs",   50, "1 Box", "200 Boxes", [AB+"flowerbomb"]),
 # ---------------------------------------------------------- Bijili Crackers
 ("S501", 'Red Bijili Griviar Bag (100 Pcs)',           "",     24, "1 Bag",    "300 Bags",  imgs(BJ+"redbijiligriviar/", 4)),
 ("S502", 'Stripped Bijili Griviar Bag (100 Pcs)',      "",     26, "1 Bag",    "300 Bags",  imgs(BJ+"strippedbijiligriviar/", 2)),
 ("S503", 'Red Bijili Griviar Bag (50 Pcs)',            "",     12, "1 Bag",    "600 Bags",  imgs(BJ+"redbijiligriviar/", 4)),
 ("S504", 'Stripped Bijili Griviar Bag (50 Pcs)',       "",     14, "1 Bag",    "300 Bags",  imgs(BJ+"strippedbijiligriviar/", 2)),
 ("S505", 'Red Bijili (1000 Pkts)',                     "",  12000, "1000 Pkt", "1000 Pkts", imgs(BJ+"redbijili/", 4)),
 ("S506", 'Thunder Shower I',                           "",    240, "1 Box",    "36 Boxes",  []),
 ("S507", 'Thunder Shower II',                          "",    480, "1 Box",    "20 Boxes",  []),
 ("S508", 'Thunder Shower V',                           "",   1200, "1 Box",    "7 Boxes",   []),
 ("S509", 'Thunder Shower X',                           "",   2400, "1 Box",    "4 Boxes",   []),
 # -------------------------------------------------------- Twinkling Stars
 ("S551", '1 1/2" Twinkling Star',                      "10 Pcs", 200, "Unit", "40 Units", imgs(TS+"twinklingstar112/", 1)),
 ("S552", '4" Twinkling Star',                          "10 Pcs", 500, "Unit", "16 Units", imgs(TS+"twinklingstar4/", 1)),
 # ----------------------------------------------------------------- Pencils
 ("S561", '7" Pencil',                                  "10 Pcs", 190, "Unit", "50 Units", imgs(PC+"7pencil/", 1)),
 ("S562", '10" Pencil',                                 "10 Pcs", 490, "Unit", "30 Units", imgs(PC+"10pencil/", 1)),
 # -------------------------------------------------- Repeating Shots (net)
 ("S601", '12 Shots - Vector (Multi Colour)',           "1 Pce",  130, "1 Box", "36 Boxes", []),
 ("S602", '15 Shots - Arrival (Multi Colour)',          "1 Pce",  170, "1 Box", "30 Boxes", imgs(RS+"arrival15/", 1)),
 ("S603", '30 Shots - C R 7 (Multi Colour)',            "1 Pce",  300, "1 Box", "18 Boxes", imgs(RS+"cr730/", 1)),
 ("S604", '60 Shots - Gravity (Multi Colour)',          "1 Pce",  600, "1 Box", "9 Boxes",  imgs(RS+"gravity60/", 1)),
 ("S605", '120 Shots - Gemini (Multi Colour)',          "1 Pce", 1200, "1 Box", "6 Boxes",  imgs(RS+"gemini120/", 1)),
 ("S606", '240 Shots - Infinity (Multi Colour)',        "1 Pce", 2400, "1 Box", "4 Boxes",  []),
 # ------------------------------------------------------------ Aerial Shots
 ("S651", '3 Piece Fancy (6 Varieties)',                "3 Pcs",  215, "1 Box", "36 Boxes", [OT+"110"]),
 ("S652", '2" Fancy (6 Varieties)',                     "1 Pce",   90, "1 Box", "80 Boxes", [OT+"109"]),
 ("S653", '2 1/2" Fancy (6 Varieties)',                 "1 Pce",  115, "1 Box", "66 Boxes", [OT+"108"]),
 ("S654", '3 1/2" Fancy (6 Varieties)',                 "1 Pce",  215, "1 Box", "36 Boxes", [OT+"112"]),
 ("S655", '3 1/2" Fancy (Nayagara Falls)',              "1 Pce",  230, "1 Box", "36 Boxes", [OT+"discovery"]),
 ("S656", '4" Fancy Double Ball',                       "1 Pce",  380, "1 Box", "30 Boxes", [OT+"113"]),
 ("S657", '12 Shot - Crackling Sky War',                "1 Pce",  145, "1 Box", "48 Boxes", []),
 ("S658", '12 Shot - Colour Rider',                     "1 Pce",  145, "1 Box", "48 Boxes", [OT+"12colourrider"]),
]

CATEGORY_OF = [
    ("S1", SPECIALS, 1), ("S15", MAGICS, 2), ("S2", ONESOUND, 3), ("S3", CHAKKAR, 4),
    ("S35", POTS, 5), ("S4", ATOM, 6), ("S5", BIJILI, 7), ("S55", TWINKLE, 8),
    ("S56", PENCIL, 9), ("S6", REPEAT, 10), ("S65", AERIAL, 11),
]

def category(sno):
    # longest prefix wins: S15x → Magics before S1xx → Specials
    best = max((c for c in CATEGORY_OF if sno.startswith(c[0])), key=lambda c: len(c[0]))
    return best[1], best[2]

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "item"

def norm_per(per):
    """The sheet writes the same unit as both 'unit' and 'Unit'."""
    return "Unit" if per.strip().lower() == "unit" else per.strip()

def unit_note(contents, per, case):
    """Human sentence describing how the item is sold."""
    per = norm_per(per)
    single = per[2:] if per.startswith("1 ") else per      # "1 Box" -> "Box"
    head = f"{contents} per {single.lower()}" if contents else f"Quoted per {per}"
    return f"{head} · {case} per case"

out = []
seen = set()
for sno, name, contents, price, per, case, images in ROWS:
    assert sno not in seen, f"duplicate {sno}"
    seen.add(sno)
    cat, order = category(sno)
    out.append({
        "sno": sno,
        "slug": slugify(name),
        "name": name,
        "category": cat,
        "categoryOrder": order,
        "contents": contents,
        "price": price,
        "per": norm_per(per),
        "case": case,
        "unitNote": unit_note(contents, per, case),
        "images": images,
    })

out.sort(key=lambda p: (p["categoryOrder"], p["sno"]))
json.dump(out, open("data/products.json", "w"), indent=1, ensure_ascii=False)

cats = {}
for p in out: cats.setdefault(p["category"], []).append(p)
missing = [p for p in out if not p["images"]]
print(f"{len(out)} products, {len(cats)} categories, {len(missing)} without a photo")
for c, v in sorted(cats.items(), key=lambda kv: kv[1][0]["categoryOrder"]):
    print(f"  {len(v):>3}  {c}")
print("\nno photo yet:")
for p in missing: print(f"  {p['sno']}  {p['name']}")

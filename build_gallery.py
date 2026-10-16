#!/usr/bin/env python3
"""
build_gallery.py — turn the images/ folder into the website's photo library
==========================================================================

Run this every time you add, remove or rename photos:

    python3 build_gallery.py

HOW IT WORKS
------------
images/ is your source folder. One subfolder per genre:

    images/
      Architecture/
        Tower Bridge.jpg
      Landscape/
        Alta Badia (1).jpg

Each subfolder becomes a tab on the site. The script then:
  * writes web-optimised copies to  photos/<genre>/<name>.jpg
  * writes small grid thumbnails to photos/<genre>/thumb/<name>.jpg
  * writes photos.js, the list of photos the site reads

Captions come from filenames, with numbering removed
("Alta Badia (3).jpg" -> "Alta Badia").

Only photos/ and photos.js are published; images/ stays on your computer.
Uses macOS's built-in `sips` tool, so no installs are needed.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(HERE, "images")
OUT_DIR = os.path.join(HERE, "photos")
DATA_FILE = os.path.join(HERE, "photos.js")
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff"}

# ---------------------------------------------------------------------------
# EDIT ME: site settings
# ---------------------------------------------------------------------------

# Tab order. Folders not listed here are added after these, alphabetically.
GENRE_ORDER = ["Landscape", "Architecture", "Street View", "Nature"]

# Optional nicer tab names for folders ("Street View" folder -> "Street" tab).
GENRE_LABELS = {"Street View": "Street"}

# One-line intro shown at the top of each genre's page.
GENRE_BLURBS = {
    "Landscape": "Coastlines, mountains and skylines from the road.",
    "Architecture": "Bridges, palaces and the shapes cities are made of.",
    "Street View": "Everyday moments in the streets of the places I've been.",
    "Nature": "Wildlife, flowers and the small things worth stopping for.",
}

# Photos used in the full-screen slideshow on the home page ("Folder/File.jpg").
# Wide (landscape-orientation) photos work best.
HERO = [
    "Landscape/Cappadocia Hot Air Balloons (1).jpg",
    "Architecture/Tower Bridge.jpg",
    "Landscape/Nevis Coast (1).jpg",
    "Landscape/Vietri Sul Mare (1).jpg",
    "Landscape/Croatia Coast (1).jpg",
    "Landscape/Alta Badia (1).jpg",
]

# Cover photo for each genre's card on the home page (default: first photo).
COVERS = {
    "Landscape": "Cappadocia Hot Air Balloons (2).jpg",
    "Architecture": "Eiffel Tower Dusk.jpg",
    "Street View": "Istanbul Street View (2).jpg",
    "Nature": "Blue Morpho Butterfly (2).jpg",
}

FULL_SIZE = 2048     # longest edge of the lightbox image, px
THUMB_SIZE = 900     # longest edge of the grid thumbnail, px
FULL_QUALITY = 82
THUMB_QUALITY = 72

# ---------------------------------------------------------------------------


def nfc(s):
    return unicodedata.normalize("NFC", s)


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def title(filename):
    name = os.path.splitext(nfc(filename))[0]
    name = re.sub(r"\s*\(\d+\)\s*$", "", name.strip())   # drop " (2)"
    return re.sub(r"[_]+", " ", name).strip()


def sips(src, dest, size, quality):
    subprocess.run(
        ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(quality),
         "-Z", str(size), src, "--out", dest],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def dimensions(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                         check=True, capture_output=True, text=True).stdout
    w = int(re.search(r"pixelWidth: (\d+)", out).group(1))
    h = int(re.search(r"pixelHeight: (\d+)", out).group(1))
    return w, h


def fresh(src, dest):
    return os.path.exists(dest) and os.path.getmtime(dest) >= os.path.getmtime(src)


def main():
    if shutil.which("sips") is None:
        sys.exit("This script needs macOS (it uses the built-in `sips` tool).")
    if not os.path.isdir(IMAGES_DIR):
        sys.exit("No 'images' folder found. Create images/<Genre>/ and add photos.")

    folders = [nfc(d) for d in os.listdir(IMAGES_DIR)
               if os.path.isdir(os.path.join(IMAGES_DIR, d)) and not d.startswith(".")]
    real_name = {nfc(d): d for d in os.listdir(IMAGES_DIR)}
    order = [g for g in GENRE_ORDER if g in folders] + sorted(set(folders) - set(GENRE_ORDER))

    genres, photos, written, hero_keys = [], [], set(), {}
    for folder in order:
        label = GENRE_LABELS.get(folder, folder)
        gslug = slug(label)
        src_dir = os.path.join(IMAGES_DIR, real_name[folder])
        files = sorted((f for f in os.listdir(src_dir)
                        if os.path.splitext(f)[1].lower() in IMG_EXT),
                       key=lambda f: nfc(f).lower())
        if not files:
            continue
        os.makedirs(os.path.join(OUT_DIR, gslug, "thumb"), exist_ok=True)

        cover = None
        used = set()
        for f in files:
            src = os.path.join(src_dir, f)
            base = slug(os.path.splitext(f)[0]) or "photo"
            name, n = base, 2
            while name in used:
                name, n = f"{base}-{n}", n + 1
            used.add(name)

            full_rel = f"photos/{gslug}/{name}.jpg"
            thumb_rel = f"photos/{gslug}/thumb/{name}.jpg"
            full, thumb = os.path.join(HERE, full_rel), os.path.join(HERE, thumb_rel)
            if not fresh(src, full):
                # Already a web-sized JPEG? Copy it untouched (re-encoding only adds bytes).
                if (os.path.splitext(f)[1].lower() in {".jpg", ".jpeg"}
                        and max(dimensions(src)) <= FULL_SIZE):
                    shutil.copy2(src, full)
                else:
                    sips(src, full, FULL_SIZE, FULL_QUALITY)
            if not fresh(src, thumb):
                sips(src, thumb, THUMB_SIZE, THUMB_QUALITY)
            written.update({full, thumb})

            w, h = dimensions(full)
            key = f"{folder}/{nfc(f)}"
            photo = {"genre": gslug, "title": title(f), "src": full_rel,
                     "thumb": thumb_rel, "w": w, "h": h}
            photos.append(photo)
            hero_keys[key] = full_rel
            if cover is None or nfc(f) == nfc(COVERS.get(folder, "")):
                cover = thumb_rel

        genres.append({"slug": gslug, "label": label, "blurb": GENRE_BLURBS.get(folder, ""),
                       "cover": cover, "count": len(files)})

    # Remove outputs for photos that were deleted or renamed in images/
    for root, _dirs, files in os.walk(OUT_DIR):
        for f in files:
            p = os.path.join(root, f)
            if p not in written:
                os.remove(p)
    for root, dirs, _files in os.walk(OUT_DIR, topdown=False):
        for d in dirs:
            p = os.path.join(root, d)
            if not os.listdir(p):
                os.rmdir(p)

    # Hero slideshow keeps the order given in HERO
    hero = [hero_keys[nfc(k)] for k in HERO if nfc(k) in hero_keys]
    for k in HERO:
        if nfc(k) not in hero_keys:
            print(f"Warning: hero photo not found: {k}")
    data = {"hero": hero, "genres": genres, "photos": photos}
    with open(DATA_FILE, "w", encoding="utf-8") as fh:
        fh.write("// Generated by build_gallery.py. Do not edit by hand.\n")
        fh.write("window.GALLERY = ")
        json.dump(data, fh, ensure_ascii=False, indent=1)
        fh.write(";\n")

    print(f"Built {len(photos)} photos across {len(genres)} genres: "
          + ", ".join(f"{g['label']} ({g['count']})" for g in genres))


if __name__ == "__main__":
    main()

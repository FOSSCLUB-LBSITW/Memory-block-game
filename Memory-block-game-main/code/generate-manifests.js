/**
 * generate-manifests.js
 * ---------------------
 * Run this script once whenever you add a new anime theme folder
 * (or add/remove images from an existing one).
 *
 * Usage:
 *   node generate-manifests.js
 *
 * It scans every subfolder inside `images/` and writes a `manifest.json`
 * containing the filenames of all image files found there.
 * The game's script.js fetches these manifests at runtime — no manual
 * path listing needed in themes.json.
 */

const fs   = require("fs");
const path = require("path");

const IMAGE_EXTS  = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const IMAGES_ROOT = path.join(__dirname, "images");

const themeDirs = fs.readdirSync(IMAGES_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

if (themeDirs.length === 0) {
    console.log("No theme folders found inside images/.");
    process.exit(0);
}

themeDirs.forEach(dir => {
    const folderPath = path.join(IMAGES_ROOT, dir);

    const images = fs.readdirSync(folderPath)
        .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
        // Natural sort so img2 comes before img10
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    const manifestPath = path.join(folderPath, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(images, null, 2));
    console.log(`✅  ${dir}/manifest.json — ${images.length} image(s)`);
});

console.log("\nDone. Refresh the game page to pick up changes.");

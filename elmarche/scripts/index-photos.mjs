// Builds the photo list of every product from the photos placed in scripts/seed/photos.
// Run from the elmarche folder:  npm run seed:index
// It writes three things in scripts/seed/photos:
//   CHECKLIST.html  what to download and how to name it
//   manifest.json   which photos each product uses (read by the seed script)
//   review.html     what each product will show

import { copyFile, mkdir, open, readdir, stat, writeFile } from "node:fs/promises";
import { PRODUCTS } from "./seed-catalog.mjs";
import { GROUPS } from "./seed-groups.mjs";
import { OWN_PHOTOS } from "./seed-queries.mjs";

const IMAGES_DIR = new URL("../../scripts/seed/images/", import.meta.url);
const PHOTOS_DIR = new URL("../../scripts/seed/photos/", import.meta.url);
const MAX_BYTES = 4.5 * 1024 * 1024;
const MAX_PER_GROUP = 8;
const DEFAULT_WANT = 2;
const IGNORED = new Set(["manifest.json", "review.html", "CHECKLIST.html"]);

const issues = [];

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

async function isJpeg(url) {
  let handle;
  try {
    handle = await open(url, "r");
    const buffer = Buffer.alloc(3);
    const { bytesRead } = await handle.read(buffer, 0, 3, 0);
    return bytesRead === 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  } catch {
    return false;
  } finally {
    await handle?.close();
  }
}

async function checkJpeg(dir, name, label, required = false) {
  const url = new URL(name, dir);
  let size;
  try {
    size = (await stat(url)).size;
  } catch {
    if (required) issues.push(`Missing ${label}${name}`);
    return false;
  }
  if (size > MAX_BYTES) {
    issues.push(`${label}${name}: ${(size / 1048576).toFixed(1)} MB is too big (maximum 4.5 MB)`);
    return false;
  }
  if (!(await isJpeg(url))) {
    issues.push(`${label}${name}: not a real JPEG (save it as JPG, do not just rename it)`);
    return false;
  }
  return true;
}

function checkGroups() {
  const problems = [];
  const titles = new Set(PRODUCTS.map((product) => product.title));
  const groupOf = new Map();

  for (const [key, group] of Object.entries(GROUPS)) {
    for (const title of group.products) {
      if (!titles.has(title)) problems.push(`Group "${key}": unknown product "${title}"`);
      else if (groupOf.has(title)) problems.push(`"${title}" is in two groups: ${groupOf.get(title)} and ${key}`);
      else groupOf.set(title, key);
    }
  }
  for (const title of Object.keys(OWN_PHOTOS)) {
    if (groupOf.has(title)) problems.push(`"${title}" has its own photo and is also in group ${groupOf.get(title)}`);
  }
  for (const product of PRODUCTS) {
    if (!OWN_PHOTOS[product.title] && !groupOf.has(product.title)) {
      problems.push(`Product without a group: "${product.title}"`);
    }
  }
  return { problems, groupOf };
}

function checklistHtml(rows) {
  const done = rows.filter((row) => row.have >= 1).length;
  const cards = rows
    .map((row) => {
      const q = encodeURIComponent(row.search);
      const names = Array.from({ length: row.want }, (_, i) => `${row.key}-${i + 1}.jpg`).join(", ");
      const status = row.have === 0 ? "todo" : row.have >= row.want ? "done" : "part";
      return `<section class="${status}">
<h3>${escapeHtml(row.key)} <small>${row.have}/${row.want} photos</small></h3>
<p><b>Search:</b> ${escapeHtml(row.search)}<br>
<a href="https://www.pexels.com/search/${q}/" target="_blank">Pexels</a> ·
<a href="https://unsplash.com/s/photos/${encodeURIComponent(row.search.replace(/\s+/g, "-"))}" target="_blank">Unsplash</a> ·
<a href="https://pixabay.com/images/search/${q}/" target="_blank">Pixabay</a></p>
<p><b>Save as:</b> ${escapeHtml(names)}</p>
<p><b>Products:</b> ${row.products.map(escapeHtml).join(" · ")}</p>
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Photo checklist</title>
<style>
body{font-family:system-ui,sans-serif;margin:16px;background:#f9f6f0}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:12px}
section{background:#fff;border:2px solid #ddd;border-radius:12px;padding:10px 14px}
section.todo{border-color:#d96b43}section.part{border-color:#e0b020}section.done{border-color:#1a4d2e}
h3{margin:0 0 6px}small{color:#666;font-weight:normal}p{margin:6px 0;font-size:14px}
</style>
<h1>Photo checklist: ${done} of ${rows.length} groups have at least one photo</h1>
<p>Save every photo as a JPG, under 4.5 MB, in <code>scripts/seed/photos</code>, then run <code>npm run seed:index</code> again.
Orange = no photo yet, yellow = fewer than wanted (1 is enough), green = done.
Choose photos that clearly show the product, without people's faces and without big logos.</p>
<main>
${cards}
</main></html>`;
}

function reviewHtml(manifest) {
  const cards = PRODUCTS.map((product) => {
    const entry = manifest[product.slug];
    const images = (entry?.files ?? []).map((file) => `<img src="${escapeHtml(file)}" alt="">`).join("");
    const source = entry ? ` - ${escapeHtml(entry.source)}` : "";
    return `<section><h3>${escapeHtml(product.title)}</h3><p>${escapeHtml(product.category.slug)}${source}</p><div>${images || "<em>No photo yet</em>"}</div></section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="fr"><meta charset="utf-8"><title>Seed photos</title>
<style>
body{font-family:system-ui,sans-serif;margin:16px;background:#f9f6f0}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
section{background:#fff;border:1px solid #ddd;border-radius:12px;padding:10px}
h3{margin:0 0 4px;font-size:15px}p{margin:0 0 8px;color:#666;font-size:12px}
div{display:flex;gap:6px}img{width:48%;aspect-ratio:4/3;object-fit:cover;border-radius:8px}
</style>
<h1>Seed photos (${PRODUCTS.length} products)</h1>
<main>
${cards}
</main></html>`;
}

async function main() {
  await mkdir(PHOTOS_DIR, { recursive: true });

  const { problems, groupOf } = checkGroups();
  if (problems.length > 0) {
    console.error("Cannot continue:");
    for (const problem of problems.slice(0, 30)) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const manifest = {};

  // 1. Products that use the team's own photos
  for (const product of PRODUCTS) {
    const names = OWN_PHOTOS[product.title];
    if (!names) continue;
    const files = [];
    for (const [i, name] of names.entries()) {
      if (!(await checkJpeg(IMAGES_DIR, name, "scripts/seed/images/", true))) continue;
      const file = `${product.slug}-${i + 1}.jpg`;
      await copyFile(new URL(name, IMAGES_DIR), new URL(file, PHOTOS_DIR));
      files.push(file);
    }
    if (files.length === names.length) manifest[product.slug] = { title: product.title, source: "team", files };
  }

  // 2. Group photos, and photos named after one specific product
  const present = new Set(await readdir(PHOTOS_DIR));
  const groupFiles = {};
  for (const [key] of Object.entries(GROUPS)) {
    const files = [];
    for (let n = 1; n <= MAX_PER_GROUP; n += 1) {
      const name = `${key}-${n}.jpg`;
      if (present.has(name) && (await checkJpeg(PHOTOS_DIR, name, "scripts/seed/photos/"))) files.push(name);
    }
    groupFiles[key] = files;
  }

  const withoutPhotos = [];
  for (const product of PRODUCTS) {
    if (OWN_PHOTOS[product.title]) {
      if (!manifest[product.slug]) withoutPhotos.push(product.title);
      continue;
    }

    const specific = [];
    for (const n of [1, 2]) {
      const name = `${product.slug}-${n}.jpg`;
      if (present.has(name) && (await checkJpeg(PHOTOS_DIR, name, "scripts/seed/photos/"))) specific.push(name);
    }
    if (specific.length > 0) {
      manifest[product.slug] = { title: product.title, source: "product photo", files: specific };
      continue;
    }

    const key = groupOf.get(product.title);
    const list = groupFiles[key];
    if (list.length === 0) {
      withoutPhotos.push(product.title);
      continue;
    }
    const position = GROUPS[key].products.indexOf(product.title);
    const files = list.length === 1 ? [list[0]] : [list[position % list.length], list[(position + 1) % list.length]];
    manifest[product.slug] = { title: product.title, source: `group ${key}`, files };
  }

  // 3. Files that do not match any expected name
  const expected = new Set();
  for (const key of Object.keys(GROUPS)) for (let n = 1; n <= MAX_PER_GROUP; n += 1) expected.add(`${key}-${n}.jpg`);
  for (const product of PRODUCTS) for (const n of [1, 2]) expected.add(`${product.slug}-${n}.jpg`);
  const unknown = [...present].filter(
    (name) => !IGNORED.has(name) && !expected.has(name) && /\.(jpe?g|png|webp|gif|avif)$/i.test(name),
  );

  // 4. Write the three files
  const rows = Object.entries(GROUPS).map(([key, group]) => ({
    key,
    search: group.search,
    want: group.want ?? DEFAULT_WANT,
    have: groupFiles[key].length,
    products: group.products,
  }));
  await writeFile(new URL("manifest.json", PHOTOS_DIR), JSON.stringify(manifest, null, 2));
  await writeFile(new URL("CHECKLIST.html", PHOTOS_DIR), checklistHtml(rows));
  await writeFile(new URL("review.html", PHOTOS_DIR), reviewHtml(manifest));

  // 5. Summary
  const emptyGroups = rows.filter((row) => row.have === 0).map((row) => row.key);
  const wantedLeft = rows.reduce((sum, row) => sum + Math.max(0, row.want - row.have), 0);
  console.log(`Groups with at least one photo: ${rows.length - emptyGroups.length} of ${rows.length}`);
  console.log(`Products with photos: ${Object.keys(manifest).length} of ${PRODUCTS.length}`);
  console.log(`Photos still wanted to reach the full wish list: ${wantedLeft}`);
  if (emptyGroups.length > 0) {
    console.log(`\nGroups with no photo yet (${emptyGroups.length}):\n  ${emptyGroups.join(", ")}`);
  }
  if (withoutPhotos.length > 0 && withoutPhotos.length <= 10) {
    console.log(`\nProducts still without photo:\n  - ${withoutPhotos.join("\n  - ")}`);
  }
  if (issues.length > 0) {
    console.error(`\nProblems with photos (${issues.length}):`);
    for (const issue of issues.slice(0, 20)) console.error(`  - ${issue}`);
    console.error("To shrink big photos: sudo apt install imagemagick, then: mogrify -resize '1600x1600>' -quality 82 FILE.jpg");
  }
  if (unknown.length > 0) {
    console.error(`\nFiles with a name I do not recognise (rename them to <group>-1.jpg):\n  ${unknown.slice(0, 15).join(", ")}`);
  }
  console.log("\nOpen scripts/seed/photos/CHECKLIST.html to see what to download.");
  console.log("Open scripts/seed/photos/review.html to see what each product will show.");
}

main().catch((error) => {
  console.error("\nIndex failed:", error?.message ?? error);
  process.exit(1);
});
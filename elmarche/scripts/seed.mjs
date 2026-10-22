// Seed script for El Marché (development and demo data).
// Run from the elmarche folder:
//   npm run seed:photos                       downloads the product photos (once)
//   npm run seed                              dry run: checks the data and the photos, writes nothing
//   npm run seed:apply                        creates accounts, products, photos and the demo history
//   npm run seed:apply -- --refresh-images    also replaces the photos of products that already exist
// Safe to run again: existing accounts and products are skipped.

import { randomUUID } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { BUYERS, CATEGORIES, SELLERS } from "./seed-data.mjs";
import { PRODUCTS } from "./seed-catalog.mjs";

const APPLY = process.argv.includes("--apply");
const REFRESH = process.argv.includes("--refresh-images");
const BUCKET = "product-images";
const PHOTOS_DIR = new URL("../../scripts/seed/photos/", import.meta.url);
const MAX_WILAYA = 58;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // The variables may already be set in the shell.
}

function normalizePhone(raw) {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[\s().-]/g, "");
  if (/^0[567]\d{8}$/.test(cleaned)) return `+213${cleaned.slice(1)}`;
  const international = cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned;
  return /^\+[1-9]\d{7,14}$/.test(international) ? international : null;
}

async function loadManifest() {
  try {
    return JSON.parse(await readFile(new URL("manifest.json", PHOTOS_DIR), "utf8"));
  } catch {
    return {};
  }
}

async function checkInputs(manifest) {
  const problems = [];

  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SEED_DEMO_PASSWORD",
    "SEED_DEMO_WHATSAPP",
  ]) {
    if (!process.env[name]) problems.push(`Missing ${name} in elmarche/.env.local`);
  }
  const password = process.env.SEED_DEMO_PASSWORD;
  if (password && password.length < 8) {
    problems.push("SEED_DEMO_PASSWORD must have at least 8 characters");
  }
  const whatsapp = process.env.SEED_DEMO_WHATSAPP;
  if (whatsapp && !normalizePhone(whatsapp)) {
    problems.push("SEED_DEMO_WHATSAPP is not a valid mobile number (example: 0551234567)");
  }

  const titles = new Set();
  const slugs = new Set();
  for (const product of PRODUCTS) {
    const label = `"${product.title}"`;
    if (product.title.length < 3 || product.title.length > 120) problems.push(`${label}: title length`);
    if (product.description.length < 10 || product.description.length > 4000) {
      problems.push(`${label}: description length`);
    }
    if (!Number.isInteger(product.price) || product.price <= 0) problems.push(`${label}: price`);
    if (!Number.isInteger(product.wilaya) || product.wilaya < 1 || product.wilaya > MAX_WILAYA) {
      problems.push(`${label}: wilaya`);
    }
    if (!SELLERS[product.shop]) problems.push(`${label}: unknown shop "${product.shop}"`);
    if (titles.has(product.title)) problems.push(`${label}: duplicate title`);
    if (slugs.has(product.slug)) problems.push(`${label}: duplicate slug`);
    titles.add(product.title);
    slugs.add(product.slug);
  }
  if (PRODUCTS.length < 150) problems.push(`Only ${PRODUCTS.length} products (150 needed)`);

  for (const buyer of Object.values(BUYERS)) {
    for (const title of [...buyer.viewed, ...buyer.favorites]) {
      if (!titles.has(title)) problems.push(`Demo buyer ${buyer.fullName}: unknown product "${title}"`);
    }
  }

  let withoutPhotos = 0;
  for (const product of PRODUCTS) {
    const files = manifest[product.slug]?.files ?? [];
    let complete = files.length > 0;
    for (const file of files) {
      try {
        await access(new URL(file, PHOTOS_DIR));
      } catch {
        complete = false;
      }
    }
    if (!complete) withoutPhotos += 1;
  }
  if (withoutPhotos > 0) {
    problems.push(`${withoutPhotos} products have no photos on this computer: run npm run seed:photos first`);
  }
  return problems;
}

async function pool(items, size, worker) {
  const results = [];
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = error;
      }
    }
  }
  await Promise.all(Array.from({ length: size }, run));
  return results;
}

async function main() {
  const manifest = await loadManifest();
  const problems = await checkInputs(manifest);
  if (problems.length > 0) {
    console.error("Cannot continue:");
    for (const problem of problems.slice(0, 30)) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  console.log(`Target project: ${new URL(url).host}`);
  console.log(
    `Products: ${PRODUCTS.length} in ${CATEGORIES.length} categories, ` +
      `${Object.keys(SELLERS).length} shops, ${Object.keys(BUYERS).length} demo buyers`,
  );
  for (const category of CATEGORIES) {
    const count = PRODUCTS.filter((product) => product.category.slug === category.slug).length;
    console.log(`  ${category.slug}: ${count}`);
  }

  if (!APPLY) {
    console.log("\nDry run OK. Nothing was written. To write the data run: npm run seed:apply");
    return;
  }

  const password = process.env.SEED_DEMO_PASSWORD;
  const whatsapp = normalizePhone(process.env.SEED_DEMO_WHATSAPP);
  const domain = process.env.SEED_EMAIL_DOMAIN ?? "elmarche.test";
  const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Categories
  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id, slug");
  if (categoryError) throw categoryError;
  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));
  for (const category of CATEGORIES) {
    if (!categoryIds.has(category.slug)) throw new Error(`Category missing in database: ${category.slug}`);
  }

  // 2. Accounts
  const existingUsers = new Map();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const user of data.users) {
      if (user.email) existingUsers.set(user.email.toLowerCase(), user.id);
    }
    if (data.users.length < 200) break;
  }

  async function ensureAccount(account, role) {
    const email = `${account.email}@${domain}`;
    const isSeller = role === "seller";
    const metadata = {
      full_name: account.fullName,
      role,
      wilaya_code: account.wilaya,
      ...(isSeller ? { shop_name: account.shopName, whatsapp_number: whatsapp } : {}),
    };

    let id = existingUsers.get(email);
    if (id) {
      const { error } = await supabase.auth.admin.updateUserById(id, { password });
      if (error) throw error;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw error;
      id = data.user.id;
    }

    const patch = {
      full_name: account.fullName,
      wilaya_code: account.wilaya,
      ...(isSeller ? { shop_name: account.shopName, whatsapp_number: whatsapp } : {}),
    };
    const { data: updated, error: profileError } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select("id");
    if (profileError) throw profileError;
    if (!updated || updated.length === 0) throw new Error(`No profile row for ${email}`);
    return id;
  }

  const sellerIds = {};
  for (const [key, seller] of Object.entries(SELLERS)) {
    sellerIds[key] = await ensureAccount(seller, "seller");
  }
  const buyerIds = {};
  for (const [key, buyer] of Object.entries(BUYERS)) {
    buyerIds[key] = await ensureAccount(buyer, "buyer");
  }
  console.log(`\nAccounts ready: ${Object.keys(sellerIds).length} sellers, ${Object.keys(buyerIds).length} buyers`);

  // 3. Products and their photos
  const { data: existingProducts, error: existingError } = await supabase
    .from("products")
    .select("id, title")
    .in("seller_id", Object.values(sellerIds));
  if (existingError) throw existingError;
  const idByTitle = new Map(existingProducts.map((row) => [row.title, row.id]));

  const { data: imageRows, error: imageRowsError } = await supabase
    .from("product_images")
    .select("product_id, products!inner(seller_id)")
    .in("products.seller_id", Object.values(sellerIds));
  if (imageRowsError) throw imageRowsError;
  const hasImages = new Set(imageRows.map((row) => row.product_id));

  async function uploadImages(product, sellerId, productId) {
    const uploaded = [];
    try {
      const rows = [];
      for (const [i, file] of manifest[product.slug].files.entries()) {
        const body = await readFile(new URL(file, PHOTOS_DIR));
        const destination = `${sellerId}/${randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(destination, body, { contentType: "image/jpeg" });
        if (error) throw error;
        uploaded.push(destination);
        rows.push({ product_id: productId, storage_path: destination, position: i + 1 });
      }
      const { error: insertError } = await supabase.from("product_images").insert(rows);
      if (insertError) throw insertError;
    } catch (error) {
      if (uploaded.length > 0) await supabase.storage.from(BUCKET).remove(uploaded);
      throw error;
    }
  }

  async function replaceImages(product, sellerId, productId) {
    const { data: old, error } = await supabase
      .from("product_images")
      .select("storage_path")
      .eq("product_id", productId);
    if (error) throw error;
    if (old.length > 0) {
      await supabase.storage.from(BUCKET).remove(old.map((row) => row.storage_path));
      const { error: deleteError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);
      if (deleteError) throw deleteError;
    }
    await uploadImages(product, sellerId, productId);
  }

  let done = 0;
  async function processProduct(product, position) {
    const sellerId = sellerIds[product.shop];
    const existingId = idByTitle.get(product.title);

    if (existingId) {
      if (!REFRESH && hasImages.has(existingId)) return "existing";
      await replaceImages(product, sellerId, existingId);
      done += 1;
      if (done % 20 === 0) console.log(`  ${done} products processed...`);
      return "refreshed";
    }

    const createdAt = new Date(Date.now() - ((position * 7) % 40) * DAY - ((position * 37) % 24) * HOUR);
    const { data, error } = await supabase
      .from("products")
      .insert({
        seller_id: sellerId,
        category_id: categoryIds.get(product.category.slug),
        title: product.title,
        description: product.description,
        price_dzd: product.price,
        wilaya_code: product.wilaya,
        tags: product.tags,
        view_count: 20 + ((position * 37) % 380),
        created_at: createdAt.toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;

    const productId = data.id;
    try {
      await uploadImages(product, sellerId, productId);
    } catch (uploadError) {
      await supabase.from("products").delete().eq("id", productId);
      throw uploadError;
    }

    idByTitle.set(product.title, productId);
    done += 1;
    if (done % 20 === 0) console.log(`  ${done} products processed...`);
    return "created";
  }

  const results = await pool(PRODUCTS, 3, processProduct);
  const created = results.filter((result) => result === "created").length;
  const refreshed = results.filter((result) => result === "refreshed").length;
  const skipped = results.filter((result) => result === "existing").length;
  const failures = results.filter((result) => result instanceof Error);
  console.log(
    `Products: ${created} created, ${refreshed} photos replaced, ${skipped} already fine, ${failures.length} failed`,
  );
  for (const failure of failures.slice(0, 5)) console.error(`  - ${failure.message}`);
  if (failures.length > 0) {
    console.error("Some products failed. Run the command again: it only retries the missing ones.");
  }

  if (REFRESH) {
    // Remove the generic category photos from the first version of the seed.
    const legacy = CATEGORIES.flatMap((category) =>
      [1, 2].map((n) => `_seed/${category.imagePrefix}-${n}.jpg`),
    );
    await supabase.storage.from(BUCKET).remove(legacy);
  }

  // 4. Demo history for the recommendations (replaces the previous demo history)
  const productId = (title) => {
    const id = idByTitle.get(title);
    if (!id) throw new Error(`Demo product not found in the database: ${title}`);
    return id;
  };

  for (const [key, buyer] of Object.entries(BUYERS)) {
    const userId = buyerIds[key];
    const now = Date.now();

    for (const table of ["product_views", "searches", "recommendations_cache"]) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) throw error;
    }

    const events = [
      ...buyer.viewed.map((title, i) => ({
        user_id: userId,
        product_id: productId(title),
        event_type: "view",
        created_at: new Date(now - (i + 1) * 9 * HOUR).toISOString(),
      })),
      ...buyer.favorites.map((title, i) => ({
        user_id: userId,
        product_id: productId(title),
        event_type: "favorite",
        created_at: new Date(now - (i + 1) * 2 * HOUR).toISOString(),
      })),
    ];
    const { error: eventError } = await supabase.from("product_views").insert(events);
    if (eventError) throw eventError;

    const { error: favoriteError } = await supabase.from("favorites").upsert(
      buyer.favorites.map((title) => ({ user_id: userId, product_id: productId(title) })),
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
    if (favoriteError) throw favoriteError;

    const { error: searchError } = await supabase
      .from("searches")
      .insert({ user_id: userId, query: buyer.search });
    if (searchError) throw searchError;
  }
  console.log("Demo history written for the two demo buyers");

  console.log(`\nDemo accounts (password = SEED_DEMO_PASSWORD from your .env.local):`);
  for (const [key, seller] of Object.entries(SELLERS)) {
    console.log(
      `  seller  ${seller.email}@${domain}  (${seller.shopName})${key === "sneaker" ? "  <- Karim, demo seller" : ""}`,
    );
  }
  for (const buyer of Object.values(BUYERS)) {
    console.log(`  buyer   ${buyer.email}@${domain}  (${buyer.fullName})`);
  }
}

main().catch((error) => {
  console.error("\nSeed failed:", error?.message ?? error);
  process.exit(1);
});
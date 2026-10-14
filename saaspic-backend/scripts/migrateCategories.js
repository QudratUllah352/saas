// Dry run by default. Apply uses a MongoDB transaction and never deletes records.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const { categories, resolveCategory } = require('../utils/categories');
const apply = process.argv.includes('--apply');
async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name);
  const old = await db.collection('categories').find({}).toArray();
  const references = {};
  for (const name of names) {
    if (name === 'categories') continue;
    references[name] = await db.collection(name).find({ category: { $exists: true } }, { projection: { category: 1, name: 1, productName: 1 } }).toArray();
  }
  const plan = categories.map((definition) => {
    const matches = old.filter((item) => resolveCategory(item.slug)?.slug === definition.slug || resolveCategory(item.name)?.slug === definition.slug);
    const target = matches.find((item) => item.slug === definition.slug) || matches[0];
    return { definition, targetId: target?._id || new mongoose.Types.ObjectId(), matches };
  });
  const manual = old.filter((item) => !plan.some((entry) => entry.matches.some((match) => match._id.equals(item._id)))).map((item) => ({
    name: item.name, slug: item.slug, id: String(item._id),
    references: Object.fromEntries(Object.entries(references).map(([name, records]) => [name, records.filter((record) => String(record.category) === String(item._id) || String(record.category).toLowerCase() === item.name.toLowerCase() || String(record.category).toLowerCase() === item.slug.toLowerCase()).map((record) => ({ id: String(record._id), name: record.name || record.productName }))])),
  }));
  const report = { mode: apply ? 'apply' : 'dry-run', plan: plan.map((entry) => ({ name: entry.definition.name, slug: entry.definition.slug, targetId: String(entry.targetId), previous: entry.matches.map((item) => ({ id: String(item._id), name: item.name, slug: item.slug })) })), manual };
  console.log(JSON.stringify(report, null, 2));
  if (!apply) return;
  const backupDir = path.join(__dirname, '../migration-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `categories-${Date.now()}.json`);
  fs.writeFileSync(backupPath, mongoose.mongo.BSON.EJSON.stringify({ categories: old, references, report }, null, 2));
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const before = {};
      for (const name of names) before[name] = (await db.collection(name).find({}, { session, projection: { _id: 1 } }).sort({ _id: 1 }).toArray()).map((item) => String(item._id));
      for (const entry of plan) {
        const { definition, targetId, matches } = entry;
        // Keep source documents for audit, including merged and unassigned categories.
        await db.collection('categories').updateOne({ _id: targetId }, { $set: { name: definition.name, slug: definition.slug, isMain: true, updatedAt: new Date() }, $setOnInsert: { description: '', createdAt: new Date() } }, { session, upsert: true });
        for (const match of matches) {
          if (!match._id.equals(targetId)) {
            for (const name of names.filter((name) => name !== 'categories')) {
              await db.collection(name).updateMany({ category: match._id }, { $set: { category: targetId } }, { session });
              if (await db.collection(name).countDocuments({ category: match._id }, { session })) throw new Error(`Unmigrated reference in ${name}`);
            }
            await db.collection('categories').updateOne({ _id: match._id }, { $set: { isMain: false, migratedTo: targetId } }, { session });
          }
        }
        const legacyText = [...new Set([definition.name, definition.slug, ...definition.aliases, ...matches.flatMap((item) => [item.name, item.slug])])];
        await db.collection('dealsubmissions').updateMany({ category: { $in: legacyText.map((text) => new RegExp('^' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')) } }, { $set: { category: definition.name } }, { session });
      }
      for (const item of manual) await db.collection('categories').updateOne({ _id: new mongoose.Types.ObjectId(item.id) }, { $set: { isMain: false } }, { session });
      for (const name of names.filter((name) => name !== 'categories')) {
        const after = (await db.collection(name).find({}, { session, projection: { _id: 1 } }).sort({ _id: 1 }).toArray()).map((item) => String(item._id));
        if (JSON.stringify(after) !== JSON.stringify(before[name])) throw new Error(`Record IDs changed in ${name}; rolling back`);
      }
      const main = await db.collection('categories').find({ isMain: true }, { session }).toArray();
      if (main.length !== 6 || categories.some((definition) => !main.some((item) => item.name === definition.name && item.slug === definition.slug))) throw new Error('Main category verification failed');
    });
    console.log('Migration committed. All existing record IDs preserved. Backup: ' + backupPath);
  } finally { await session.endSession(); }
}
run().catch((error) => { console.error(error.name + ': ' + error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());

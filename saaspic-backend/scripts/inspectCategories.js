require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    console.log(JSON.stringify({
      categories: await db.collection('categories').find({}).toArray(),
      collections: await db.listCollections({}, { nameOnly: true }).toArray(),
      products: await db.collection('products').find({}, { projection: { name: 1, category: 1 } }).toArray(),
      submissions: await db.collection('dealsubmissions').distinct('category'),
    }, null, 2));
  } catch (error) {
    console.error(error.name + ': ' + error.message);
    process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
})();

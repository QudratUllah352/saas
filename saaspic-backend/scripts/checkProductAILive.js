require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { generateProduct } = require('../controllers/aiProductController');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    let status = 200;
    await generateProduct({ body: { name: 'Linear', website: 'https://linear.app/' } }, {
      status(value) { status = value; return this; },
      json(value) { console.log(JSON.stringify({ status, message: value.message, fields: Object.keys(value.suggestions || {}), officialSourceVerified: !!value.source })); if (status !== 200) process.exitCode = 1; },
    });
  } catch { console.error('Live product generation could not complete. Check backend connectivity and Gemini configuration.'); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();

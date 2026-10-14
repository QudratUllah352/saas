require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function checkModels() {
  try {
    console.log("Checking available Gemini models...\n");

    const pager = await ai.models.list();

    for await (const model of pager) {
      console.log(model.name);
    }
  } catch (error) {
    console.error(
      "Could not load Gemini models:",
      error.message
    );
  }
}

checkModels();
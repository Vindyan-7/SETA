import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export const getGeminiInsight = async (expenses: any[]) => {
  if (!API_KEY) {
    console.error("Gemini API Key missing");
    return "AI Insights are unavailable right now.";
  }

  if (expenses.length === 0) {
    return "Start adding expenses to get AI-powered financial advice!";
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Prepare a simple summary string for the AI
    const expenseSummary = expenses.map(e => 
      `- ${e.category}: ₹${e.amount}`
    ).join("\n");

    const prompt = `
      Act as a friendly financial advisor for a student.
      Here is my recent expense history:
      ${expenseSummary}

      Give me one short, encouraging, and specific tip (max 2 sentences) on how I can save money or what I'm doing well. 
      Don't use complex financial jargon. Use emojis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at the moment.";
  }
};

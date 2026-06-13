import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;
let model = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are Nova, a friendly, encouraging, and highly concise English communication mentor. You are on a 2-minute voice call with a student. Keep your responses to 1-2 short sentences so the student has time to speak. Do not use complex formatting, emojis, or markdown because your output will be read aloud by a Text-to-Speech engine. Ask open-ended questions to keep them talking. Correct major grammar mistakes gently, but prioritize fluency and confidence building.",
  });
}

export class NovaCallSession {
  constructor() {
    this.chatSession = null;
    this.history = [];
    if (model) {
      this.chatSession = model.startChat({
        history: [],
      });
    }
  }

  async sendMessage(userText) {
    if (!this.chatSession) {
      console.warn("Gemini API key is missing. Using fallback mock response.");
      
      const offlineResponses = [
        "That's interesting! Tell me more about it.",
        "I see. How did that make you feel?",
        "Could you elaborate on that?",
        "That sounds like a great experience. What did you learn from it?",
        "Awesome! Keep practicing your English. What else is on your mind?",
        "I understand. What do you plan to do next?",
        "Fascinating! How did you get started with that?",
        "Very good! Your pronunciation is getting better. Keep going!"
      ];
      
      if (this.history.length === 0) {
        return "I'm currently running in offline mode. Please add a Gemini API key to hear my real voice. Until then, let's practice! Tell me about your day.";
      }
      
      const randomResponse = offlineResponses[Math.floor(Math.random() * offlineResponses.length)];
      this.history.push({ role: "user", text: userText });
      this.history.push({ role: "model", text: randomResponse });
      return randomResponse;
    }

    try {
      const result = await this.chatSession.sendMessage(userText);
      const text = result.response.text();
      this.history.push({ role: "user", text: userText });
      this.history.push({ role: "model", text });
      return text;
    } catch (error) {
      console.error("Error communicating with Gemini:", error);
      return "I had trouble understanding that due to a connection issue. Could you repeat it?";
    }
  }

  async generateSummary() {
    if (!this.chatSession || this.history.length === 0) {
      return {
        score: 0,
        feedback: "No conversation was recorded, or API key is missing.",
        pointsEarned: 0
      };
    }

    try {
      const summaryPrompt = `The 2-minute conversation is over. Here is the transcript:
      ${this.history.map(m => m.role + ': ' + m.text).join('\n')}
      
      Provide a brief summary of the student's performance. Focus on fluency, vocabulary, and grammar. 
      Return ONLY a JSON string with the following structure (no markdown, just raw JSON):
      {
        "score": (a number out of 100 representing overall communication quality),
        "feedback": "(a 2-3 sentence constructive feedback message)",
        "pointsEarned": (1 if the student actively participated and tried, 0 if they were silent or didn't try)
      }`;

      const result = await this.chatSession.sendMessage(summaryPrompt);
      let text = result.response.text().trim();
      
      if (text.startsWith("\`\`\`json")) {
          text = text.substring(7, text.length - 3).trim();
      } else if (text.startsWith("\`\`\`")) {
          text = text.substring(3, text.length - 3).trim();
      }

      const parsed = JSON.parse(text);
      return {
        score: parsed.score || 0,
        feedback: parsed.feedback || "Good effort!",
        pointsEarned: parsed.pointsEarned || 0
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      return {
        score: 50,
        feedback: "Great job completing the session! (Summary generation failed).",
        pointsEarned: 1
      };
    }
  }
}

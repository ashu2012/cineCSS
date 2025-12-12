import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DirectorParams } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const directorSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    primaryColor: {
      type: Type.STRING,
      description: "The dominant hex color code for the scene (e.g., #FF0000).",
    },
    secondaryColor: {
      type: Type.STRING,
      description: "The secondary hex color code.",
    },
    accentColor: {
      type: Type.STRING,
      description: "An accent hex color code for highlights.",
    },
    animationSpeed: {
      type: Type.STRING,
      enum: ["slow", "medium", "fast"],
      description: "The pacing of the scene.",
    },
    shape: {
      type: Type.STRING,
      enum: ["circle", "square", "line"],
      description: "The primary geometric shape that represents the scene's abstract composition.",
    },
    moodDescription: {
      type: Type.STRING,
      description: "A short, poetic description of the visual mood derived from the prompt.",
    },
  },
  required: ["primaryColor", "secondaryColor", "accentColor", "animationSpeed", "shape", "moodDescription"],
};

export const analyzeSceneRequest = async (prompt: string): Promise<DirectorParams | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following movie scene description or concept and translate it into an abstract visual composition: "${prompt}". Return a JSON object defining the colors, speed, and shapes that best represent this scene's mood.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: directorSchema,
        systemInstruction: "You are an abstract visual artist and cinematographer. You translate words into colors, shapes, and motion.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DirectorParams;
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
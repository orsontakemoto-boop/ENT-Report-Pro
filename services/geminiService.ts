import { GoogleGenAI } from "@google/genai";

export const refineReportWithAI = async (
  findings: string,
  examType: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Você é um otorrinolaringologista experiente.
    Reescreva os achados clínicos abaixo de forma técnica, formal e profissional para um laudo médico de ${examType}.
    Mantenha a factualidade, corrija erros ortográficos e melhore o fluxo do texto.
    Não invente informações, apenas formate o que foi fornecido.
    
    Achados originais (notas do médico):
    "${findings}"
    
    Responda apenas com o texto reescrito dos achados.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || findings;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
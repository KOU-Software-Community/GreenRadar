import { fal } from "@fal-ai/client"
import { MainPrompt } from "./prompt.js"
fal.config({
  credentials: process.env.FAL_API_KEY})


function cleanGeminiJSON(response) {
  const start = response.indexOf("{");
  const end = response.lastIndexOf("}");

  if (start !== -1 && end !== -1 && start < end) {
    response = response.slice(start, end + 1);
  }

  return response;
}




export const llmPipeline = async (data) => {
  console.log("data:", data);
  const dataString = JSON.stringify(data)
  const result = await fal.subscribe("fal-ai/any-llm/enterprise", {
    input: {
      prompt: `Aşağıdaki ağaçlandırma potansiyeli veri setini analiz et ve SADECE JSON formatında yanıt ver:\n\n${dataString}`,
      system_prompt: MainPrompt,
      model: "google/gemini-2.0-flash-001",
    }
  });


  const finalAnswer = JSON.parse(cleanGeminiJSON(result.data.output))

  console.log(result);

  return finalAnswer;
}


import express from "express";
import cors from "cors";
import axios from "axios";
import { GoogleAdsApi } from "google-ads-api";

const app = express();

app.use(cors());
app.use(express.json());

async function getKeywordMetrics(keywords) {
  try {
    console.log("Input keywords:", JSON.stringify(keywords));

    const cleanKeywords = keywords
      .join(",")
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    console.log("Cleaned keywords:", JSON.stringify(cleanKeywords));
    console.log("Number of keywords:", cleanKeywords.length);

    // Process in batches of 100
    const keywordBatches = [];
    for (let i = 0; i < cleanKeywords.length; i += 100) {
      keywordBatches.push(cleanKeywords.slice(i, i + 100));
    }

    const allMetrics = [];

    for (const batch of keywordBatches) {
      try {
        console.log(
          "Processing batch:",
          JSON.stringify({
            batchSize: batch.length,
            keywords: batch,
          }),
        );

        const keywordPlanIdeas =
          await client.keywordPlanner.generateKeywordIdeas({
            keywords: batch,
            language: "en",
            locationIds: ["2840"],
            includeAdultKeywords: false,
          });

        console.log("Raw API response:", JSON.stringify(keywordPlanIdeas));

        const batchMetrics = keywordPlanIdeas.map((idea) => ({
          keyword: idea.text,
          metrics: {
            avgMonthlySearches: idea.keywordIdeaMetrics.avgMonthlySearches,
            competition: idea.keywordIdeaMetrics.competition,
            competitionIndex: idea.keywordIdeaMetrics.competitionIndex,
            lowTopOfPageBidMicros:
              idea.keywordIdeaMetrics.lowTopOfPageBidMicros,
            highTopOfPageBidMicros:
              idea.keywordIdeaMetrics.highTopOfPageBidMicros,
          },
        }));

        console.log("Processed batch metrics:", JSON.stringify(batchMetrics));
        allMetrics.push(...batchMetrics);
      } catch (batchError) {
        console.error("Error processing batch:", JSON.stringify(batchError));
        console.error("Batch that caused error:", JSON.stringify(batch));
        continue;
      }
    }

    console.log("Final results count:", allMetrics.length);
    return allMetrics;
  } catch (error) {
    console.error("Error in getKeywordMetrics:", JSON.stringify(error));
    throw error;
  }
}

app.post("/api/generate-map", async (req, res) => {
  const { subject, depth, openAIKey } = req.body;
  console.log("Received request:", { subject, depth });
  try {
    console.log("Making OpenAI API request...");
    const result = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `Generate a keyword list for "${subject}" with exactly these quantities per level:
Level 1: 1 keyword (the main topic)
Level 2: 5 keywords
Level 3: 25 keywords
Level 4: 125 keywords
Level 5: ${depth >= 5 ? "625" : "0"} keywords

Return ONLY an array of strings in this format:
[
  "main keyword",
  "5 level 2 keywords...",
  "25 level 3 keywords...",
  "125 level 4 keywords...",
  "625 level 5 keywords..."
]

Critical rules:
1. MUST generate exact number of keywords per level
2. Only include realistic search terms
3. All keywords must relate to their parent level
4. NO formatting, just a simple array
5. NO explanations or additional text
6. NO JSON structure
7. Generate only up to ${depth} levels`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
      },
    );

    console.log("OpenAI API response:", {
      status: result.status,
      responseLength: result.data.choices[0].message.content.length,
      firstFewChars: result.data.choices[0].message.content.substring(0, 100),
    });

    const keywords = JSON.parse(result.data.choices[0].message.content);
    console.log("Parsed keywords array length:", keywords.length);
    console.log("First few keywords:", keywords.slice(0, 5));

    console.log("Calling getKeywordMetrics...");
    const keywordMetrics = await getKeywordMetrics(keywords);
    console.log("Keyword metrics received, count:", keywordMetrics.length);

    console.log("Sending response to client...");
    res.json({ keywordMetrics });
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    res.status(500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

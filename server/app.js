import express from 'express';  
import cors from 'cors';
import path from 'path';
import OpenAI from 'openai';



const app = express();
app.use(cors());
app.use(express.json());

const generateKeywords = async (subject, depth, openAIKey) => {
    const openai = new OpenAI({ apiKey: openAIKey });

    const prompt = `Generate a keyword list for "${subject}" with exactly these quantities per level:
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
7. Generate only up to ${depth} levels`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        console.log("OpenAI API response received");
        const content = completion.choices[0].message.content;
        
        try {
            const keywords = JSON.parse(content);
            console.log("Parsed keywords array length:", keywords.length);
            console.log("First few keywords:", keywords.slice(0, 5));
            return keywords;
        } catch (parseError) {
            console.error("Error parsing OpenAI response:", parseError);
            throw new Error("Failed to parse keyword response");
        }
    } catch (error) {
        console.error("OpenAI API error:", error);
        throw error;
    }
};

const getKeywordMetrics = async (keywords) => {
    console.log('Starting keyword metrics process');
    
    try {
        // Mock metrics for demonstration
        const mockMetrics = keywords.flatMap(keywordGroup => 
            keywordGroup.split(',').map(keyword => ({
                keyword: keyword.trim(),
                metrics: {
                    avgMonthlySearches: Math.floor(Math.random() * 10000),
                    competition: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
                    competitionIndex: Math.floor(Math.random() * 100),
                    lowTopOfPageBidMicros: Math.floor(Math.random() * 1000000),
                    highTopOfPageBidMicros: Math.floor(Math.random() * 2000000)
                }
            }))
        );

        return { data: mockMetrics };
    } catch (error) {
        console.error('Error:', error);
        return { error: error.message };
    }
};

app.post('/api/generate-map', async (req, res) => {
    console.log('Received generate-map request');
    const { subject, depth, openAIKey } = req.body;
    
    if (!subject || !depth || !openAIKey) {
        return res.status(400).json({ 
            error: 'Missing required parameters: subject, depth, and openAIKey are required' 
        });
    }
    
    console.log(`Request details: subject=${subject}, depth=${depth}, hasOpenAIKey=${Boolean(openAIKey)}`);
    
    try {
        // Generate keywords using OpenAI
        const keywords = await generateKeywords(subject, depth, openAIKey);
        
        // // Get metrics for the keywords
        // const keywordMetrics = await getKeywordMetrics(keywords);
        
        console.log('Sending response to client...');
        res.json({ keywords });
    } catch (error) {
        console.error('Error in generate-map:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
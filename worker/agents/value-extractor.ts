import { callAgentWithJson, type JsonSchema } from "./clients/gemini-client.js";

// Define the structure for our value items
export interface ValueItem {
	title: string;
	keyPoints: string[];
	rawContent: string;
}

const SYSTEM_PROMPT = `You are "Value Extractor", an AI assistant. Your purpose is to meticulously analyze long-form content (such as books, long video transcripts, comprehensive articles, etc.) and identify the most valuable and actionable insights specifically relevant to a given persona.

Input:
Long-Form Content: This will be a substantial piece of text.
Persona: This will be a description of a specific individual, including their role, goals, challenges, interests, and any other relevant characteristics.

Your Goal:
Extract and present the most crucial and practical takeaways from the long-form content that directly address the needs, interests, and objectives of the provided persona. Focus on information that can lead to tangible actions or significant understanding for that specific persona.

Output Format:
Your output must be a JSON array of 10 to 20 "topic" objects. A higher number is better but only if they can provide REAL ACTIONABLE VALUE to the persona. Each topic object must have the following structure:
{
  "title": "A concise and descriptive title that captures the essence of the insight",
  "keyPoints": [
    "A single, impactful line expanding on the insight",
    "Another single, impactful line expanding on the insight",
    "Another single, impactful line expanding on the insight"
  ],
  "rawContent": "The title followed by bullet points, formatted as: Title:\\n• Key point 1\\n• Key point 2\\n• Key point 3"
}

Example Persona:
"A busy marketing manager at a SaaS startup, focused on customer acquisition and retention. Their main challenges are limited budget, small team size, and the need for quick, measurable results. They are interested in low-cost, high-impact marketing strategies and tools that can automate tasks."

Example Output (based on hypothetical content about digital marketing trends):
[
  {
    "title": "Leveraging AI for Hyper-Personalization at Scale",
    "keyPoints": [
      "Utilize AI-powered tools to segment audiences with greater granularity for targeted messaging",
      "Implement dynamic content on websites and emails that adapts to individual user behavior",
      "Explore AI chatbots for personalized customer support and lead qualification on a budget",
      "Track key personalization metrics to demonstrate ROI and iterate on strategies quickly"
    ],
    "rawContent": "Leveraging AI for Hyper-Personalization at Scale:\\n• Utilize AI-powered tools to segment audiences with greater granularity for targeted messaging\\n• Implement dynamic content on websites and emails that adapts to individual user behavior\\n• Explore AI chatbots for personalized customer support and lead qualification on a budget\\n• Track key personalization metrics to demonstrate ROI and iterate on strategies quickly"
  },
  {
    "title": "Building Community for Sustainable Growth and Retention",
    "keyPoints": [
      "Foster an online community around your brand to increase customer loyalty and gather feedback",
      "Identify and empower brand advocates within your user base to drive word-of-mouth marketing",
      "Host regular virtual events or Q&A sessions to engage directly with your audience",
      "Measure community engagement and its impact on churn reduction and customer lifetime value"
    ],
    "rawContent": "Building Community for Sustainable Growth and Retention:\\n• Foster an online community around your brand to increase customer loyalty and gather feedback\\n• Identify and empower brand advocates within your user base to drive word-of-mouth marketing\\n• Host regular virtual events or Q&A sessions to engage directly with your audience\\n• Measure community engagement and its impact on churn reduction and customer lifetime value"
  }
]

Instructions for "Value Extractor":
Deeply Understand the Persona: Before analyzing the content, thoroughly internalize the persona's characteristics, goals, pain points, and motivations. Everything you extract should be filtered through this lens.
Prioritize Actionability and Value: Focus on insights that the persona can directly apply or that offer significant new understanding relevant to their objectives. Avoid vague or overly general points.
Conciseness and Clarity: Ensure titles are attention-grabbing and accurately reflect the insight. Key points must be single, impactful lines.
Relevance is Key: Do not include information that, while interesting, is not directly beneficial or relevant to the specific persona provided.
Adhere Strictly to Output Format: Ensure the output is a valid JSON array of 5 to 20 topics, each with title, keyPoints array (3-5 items), and rawContent string.
Extract, Don't Invent: All insights must be derived directly from the provided long-form content.

Now, await the long-form content and the persona description.`;

/**
 * Extract valuable insights from content for a specific persona
 * @returns Array of structured value items
 */
export async function extractValue(
	apiKey: string,
	content: string,
	persona: string,
): Promise<ValueItem[]> {
	if (!content || content.length === 0) {
		throw new Error("No content provided for value extraction");
	}

	console.log(`🧠 Extracting value, please wait...`);

	const prompt = `
\`<LONG_FORM_CONTENT>\`
${content}
\`</LONG_FORM_CONTENT>\`

\`<PERSONA>\`
${persona}
\`</PERSONA>\`

Now provide your analysis as a JSON array of value items:`;

	// Define the schema for the expected response
	const responseSchema: JsonSchema = {
		type: "array",
		items: {
			type: "object",
			properties: {
				title: { type: "string" },
				keyPoints: {
					type: "array",
					items: { type: "string" },
					minItems: 3,
					maxItems: 5,
				},
				rawContent: { type: "string" },
			},
			required: ["title", "keyPoints", "rawContent"],
		},
		minItems: 10,
		maxItems: 20,
	};

	const response = await callAgentWithJson<ValueItem[]>({
		apiKey,
		agentName: "value-extractor",
		systemInstruction: SYSTEM_PROMPT,
		prompt,
		responseSchema,
	});

	// Validate the response
	if (!response || response.length === 0) {
		throw new Error("Received empty value data from AI");
	}

	console.log(
		`✅ Value extraction complete - extracted ${response.length} insights`,
	);
	return response;
}

import { callAgentWithSystem } from "./clients/gemini-client.js";

const createStyleAdaptationPrompt = (
	baseStyleBlueprint: string,
	newStyleDirectives: string,
): string => {
	return `[SYSTEM PROMPT]

You are StyleMorph-2.5, a specialized AI expert in linguistic pattern analysis and textual adaptation. Your function is to remap an existing writing style blueprint to reflect new stylistic directives provided by the user.

# Mission
Analyze the ## Base Style Blueprint and transform its descriptions to align with the ## New Style Directives. Your output must be a single, raw Markdown string containing only the newly transformed blueprint.

# Core Directives
1.  **Preserve the Analytical Structure:** The original blueprint's structure—its sections, headers, and categories of analysis (e.g., "Voice & Tone," "Sentence Architecture")—is the template. **Do not change this structure.**
2.  **Remap Stylistic Descriptions:** Your primary task is to rewrite the *descriptions* of the writing style to match the ## New Style Directives. If the base style is "academic" and the target is "conversational," your output must describe a conversational style using the original's analytical framework.
3.  **Synthesize New Examples:** Do not reuse or slightly alter the original examples. You must generate **new, plausible, analogous examples of phrases and sentences** that perfectly illustrate the new target style.
4.  **Single String Markdown Output:** Your entire response must be a **single, raw Markdown string**. Start directly with the main header of the transformed blueprint. Do not include any preambles, conversational filler, apologies, or code blocks around the final output.

# Inputs

## Base Style Blueprint
The following blueprint describes the author's original writing style.

${baseStyleBlueprint}

## New Style Directives
The following instructions describe the new target style to which the blueprint must be adapted.

${newStyleDirectives}

# Execution Strategy
1.  **Analyze Base Blueprint:** First, deconstruct the ## Base Style Blueprint to understand its analytical framework and the characteristics of the original style.
2.  **Analyze New Directives:** Next, thoroughly review the ## New Style Directives to identify the target style's core features.
3.  **Adapt Section-by-Section:** Go through the ## Base Style Blueprint element by element. For each point, preserve the analytical category but replace the description and examples with newly synthesized ones that reflect the ## New Style Directives.
4.  **Assemble Final Output:** Construct the transformed blueprint as a single, clean Markdown string, ensuring its structure mirrors the original.

# Output Specification
Produce ONLY the transformed blueprint. It must be a single string in Markdown format, beginning with the top-level header.
`;
};

/**
 * Analyze the psychological patterns in the provided content samples
 */
export async function writeProfileModifier(
	apiKey: string,
	profile: string,
	modifications: string,
): Promise<string> {
	if (!profile || profile.length === 0) {
		throw new Error("No profile provided for writing analysis");
	}

	console.log(`🧠 Updating writing profile, please wait...`);

	const prompt = `Now provide the updated profile:`;

	const response = await callAgentWithSystem({
		apiKey,
		agentName: "write-profile-modifier",
		systemInstruction: createStyleAdaptationPrompt(profile, modifications),
		prompt,
	});

	if (!response || response.trim().length < 100) {
		throw new Error("Received insufficient profile data from AI");
	}

	console.log("✅ Writing profile update complete");
	return response.trim();
}

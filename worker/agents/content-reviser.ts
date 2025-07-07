import { callAgentWithSystem } from "./clients/gemini-client";

// --- NEW AND UPDATED INTERFACES ---

export interface ContentHistory {
	contentGenerated: string;
	revisionAsked?: string;
}

interface PersonaReviserParams {
	psychologicalProfile: string;
	writingStyleProfile: string;
	revisionRequest: string;
	contentToRevise: string;
	personaProfile?: string;
	contentHistory?: ContentHistory[]; // Optional history of content evolution
}

interface ReviseContentParams {
	apiKey: string;
	psychologyProfile: string;
	writingProfile: string;
	revisionRequest: string;
	contentToRevise: string;
	personaProfile?: string;
	contentHistory?: ContentHistory[]; // Optional history of content evolution
}

// --- UPDATED PROMPT CREATION FOR REVISION ---

/**
 * Generates an advanced, AI-evasive system prompt for ghost-revising content,
 * now with the ability to process content history for improved context.
 */
function createPersonaReviserPrompt({
	psychologicalProfile,
	writingStyleProfile,
	revisionRequest,
	contentToRevise,
	personaProfile,
	contentHistory,
}: PersonaReviserParams): string {
	// Dynamically build the history block for the prompt
	const historyBlock =
		contentHistory && contentHistory.length > 0
			? contentHistory
					.map(
						(entry, index) => `
<history_item index="${index + 1}">
  <previous_version>
  ${entry.contentGenerated}
  </previous_version>
  <revision_feedback>
  ${entry.revisionAsked || "No specific feedback was provided for this version."}
  </revision_feedback>
</history_item>`,
					)
					.join("\n")
			: "No previous versions or feedback provided.";

	return `
<role_definition>
You are "Persona Reviser," an elite-tier Ghostwriting AI specializing in context-aware content revision. Your function is to meticulously analyze provided text, its entire revision history, and apply new edits. The final output must be virtually indistinguishable from the target individual's authentic writing. You will achieve this by deeply internalizing their psychological and stylistic profiles and by learning from the content's evolution.
Your output must be ONLY the fully revised content. No other text, explanation, or meta-commentary is permitted.
</role_definition>

<core_mission_directives>
1.  **Comprehensive Profile and History Assimilation:**
    * **Psychological & Writing Profile Deconstruction:** Deconstruct the target's mind and voice from the <psychological_profile_data> and <writing_style_profile_data>.
    * **Content Evolution Analysis (Input: <content_evolution_history>):** THIS IS CRITICAL. Analyze the full history of the document. Understand what changes were made and why. Use past feedback to inform your current revision, avoiding rejected ideas and building upon successful edits. This history gives you context for the user's ultimate goal.
    * **Target Audience Adaptation:** If a reader persona is provided, ensure revisions resonate with that audience.

2.  **Revision and Integration Protocol:**
    * **Analyze Current Content (Input: <content_to_revise>):** Thoroughly analyze the current version of the text.
    * **Execute New Revision Request (Input: <revision_request>):** Precisely implement the NEW changes specified in the current request. Your primary task is to fulfill this new request in the context of all that has come before.
    * **Maintain Persona Integrity:** Ensure every change aligns with the target's voice. The final piece must sound as if the target made the edits themselves, informed by previous drafts.

3.  **Evasion & Humanization Protocol Integration:**
    * **Objective:** Produce revised content that registers as human to both intuition and detection tools.
    * **Protocols:** Maximize Burstiness, Elevate Perplexity, use Controlled Imperfection, and adhere to the Forbidden Vocabulary Protocol (avoid AI-marker words like "delve," "tapestry," "harness," "leverage," etc., unless they are part of the persona).

4.  **Total Persona Embodiment and Content Revision:**
    * **Become the Target Editor:** Embody the target individual editing their own work, with full memory of past versions.
    * **Revise Organically:** Execute the new edits. The final text must reflect these changes while being perfectly filtered through the target's mind and the full context of the project.
</core_mission_directives>

<input_data_structure_specification>
<psychological_profile_data>
${psychologicalProfile}
</psychological_profile_data>

<writing_style_profile_data>
${writingStyleProfile}
</writing_style_profile_data>

<persona_profile_data>
${personaProfile || "No persona profile provided."}
</persona_profile_data>

<content_evolution_history>
This section details the document's history. Learn from it.
${historyBlock}
</content_evolution_history>

<content_to_revise>
This is the CURRENT text you need to edit.
${contentToRevise}
</content_to_revise>

<revision_request>
This is the NEW, most important instruction. You are making these specific changes now.
${revisionRequest}
</revision_request>
</input_data_structure_specification>

<output_requirements>
* **Sole Output:** The complete, fully-revised text that incorporates the latest requested changes.
* **Format:** Raw text, formatted as the target individual would.
* **No Additions:** No titles, preambles, or postscripts.
</output_requirements>

<absolute_imperatives_and_constraints>
1.  **COMPLETE STEALTH PROTOCOL:** Never reveal you are an AI.
2.  **NO META-COMMENTARY:** Output ONLY the revised content.
3.  **INDISTINGUISHABLE AUTHENTICITY:** The output must be genuinely human.
4.  **DIRECT EMBODIMENT:** You ARE the specified individual performing this edit.
</absolute_imperatives_and_constraints>

<final_instruction>
Internalize the persona, learn from the entire content history, and output the complete, newly revised text as the target individual.
</final_instruction>
`;
}

// --- UPDATED MAIN FUNCTION FOR REVISION ---

/**
 * Revise content to perfectly match provided profiles and a revision request,
 * using optional content history for enhanced context.
 */
export async function reviseContent({
	apiKey,
	psychologyProfile,
	writingProfile,
	revisionRequest,
	contentToRevise,
	personaProfile,
	contentHistory, // Now accepts content history
}: ReviseContentParams): Promise<string> {
	if (
		!psychologyProfile ||
		!writingProfile ||
		!revisionRequest ||
		!contentToRevise
	) {
		throw new Error(
			"Psychology profile, writing profile, revision request, and content to revise are all required",
		);
	}

	console.log(`✍️ Revising content with request: "${revisionRequest}"`);
	if (contentHistory && contentHistory.length > 0) {
		console.log(
			`🧠 Incorporating content history of ${contentHistory.length} previous version(s).`,
		);
	}

	const systemPrompt = createPersonaReviserPrompt({
		psychologicalProfile: psychologyProfile,
		writingStyleProfile: writingProfile,
		personaProfile,
		revisionRequest,
		contentToRevise,
		contentHistory, // Pass the history to the prompt generator
	});

	const userPrompt = `Now, embodying this person completely, revise the provided text based on my new instructions, keeping the document's history in mind. Output the full, final version of the document.`;

	const response = await callAgentWithSystem({
		apiKey,
		agentName: "ghost-reviser-v2", // Updated agent name
		systemInstruction: systemPrompt,
		prompt: userPrompt,
		maxTokens: 10000,
		temperature: 1.0,
		topP: 0.98,
		topK: 40,
	});

	if (!response || response.trim().length < 50) {
		throw new Error("Received insufficient content from AI during revision");
	}

	console.log("✅ Content revision complete");
	return response.trim();
}

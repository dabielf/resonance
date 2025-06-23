import { DurableObject } from "cloudflare:workers"
import { GenerateContentInput } from "../types/gw";
import { generateContent } from "../agents/ghostwriter";
import { psyProfiles, writingProfiles, personas, insights } from "../db/schema-ghostwriter";
import { eq, } from "drizzle-orm";
import { getDB } from "../db";


export class AgentDurableObject extends DurableObject {
    env: Env | null = null;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.env = env;
    }



  async fetch() {
    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Calling `acceptWebSocket()` informs the runtime that this WebSocket is to begin terminating
    // request within the Durable Object. It has the effect of "accepting" the connection,
    // and allowing the WebSocket to send and receive messages.
    // Unlike `ws.accept()`, `state.acceptWebSocket(ws)` informs the Workers Runtime that the WebSocket
    // is "hibernatable", so the runtime does not need to pin this Durable Object to memory while
    // the connection is open. During periods of inactivity, the Durable Object can be evicted
    // from memory, but the WebSocket connection will remain open. If at some later point the
    // WebSocket receives a message, the runtime will recreate the Durable Object
    // (run the `constructor`) and deliver the message to the appropriate handler.
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }






  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    // Upon receiving a message from the client, reply with the same message,
    // but will prefix the message with "[Durable Object]: " and return the
    // total number of connections.
    const data = JSON.parse(String(message));
    console.log(data);
    if (!data.type) {
      const len = String(message).length;
      ws.send(
          `[Durable Object] message: ${String(message)}, connections: ${this.ctx.getWebSockets().length}, len: ${len}`,
        );
      return;
    }
    switch (data.type) {
      case "generate": {
        
        const generateContentInput = GenerateContentInput.parse(data.args);
        const { psychologyProfileId, personaProfileId, writingProfileId, insightId, topic } = generateContentInput;
        
        if (!this.env?.GOOGLE_GENERATIVE_AI_API_KEY) {
          ws.send(JSON.stringify({ type: "error", message: "Google Generative AI API key not found" }));
          return;
        }
        const db = getDB(this.env);
        ws.send(JSON.stringify({ type: "loading", message: "Generating content..." }));
        if (!insightId && (topic === null || topic === undefined)) {
                ws.send(JSON.stringify({ type: "error", message: "Insight or topic is required" }));
                break;
            }
            
            const psyProfile = await db.query.psyProfiles.findFirst({ where: eq(psyProfiles.id, Number(psychologyProfileId)) });
            const writingProfile = await db.query.writingProfiles.findFirst({ where: eq(writingProfiles.id, Number(writingProfileId)) });
            const personaProfile = 	personaProfileId ? await db.query.personas.findFirst({ where: eq(personas.id, Number(personaProfileId)) }) : null;
        
            if (!psyProfile || !writingProfile) {
                ws.send(JSON.stringify({ type: "error", message: "Profiles not found" }));
                break;
            }
        
        
            if (insightId) {
                const insight = await db.query.insights.findFirst({ where: eq(insights.id, Number(insightId)) });
                if (!insight || insight === undefined) {
                   ws.send(JSON.stringify({ type: "error", message: "Insight not found" }));
                   break;
                }
                const insightContent = insight.rawContent;
                const finalTopic = topic ? `${insightContent}\n\n**THIS HAS ABSOLUTE PRIORITY**\n\n${topic}` : insightContent;
                const content = await generateContent({ apiKey: this.env.GOOGLE_GENERATIVE_AI_API_KEY, psychologyProfile: psyProfile.content, writingProfile: writingProfile?.content, personaProfile: personaProfile?.content || undefined, topic: finalTopic });
                ws.send(JSON.stringify({ type: "success", content }));
                break;
            }
        
            const content = await generateContent({ apiKey: this.env.GOOGLE_GENERATIVE_AI_API_KEY, psychologyProfile: psyProfile?.content, writingProfile: writingProfile?.content, personaProfile: personaProfile?.content || undefined, topic: topic! });
            ws.send(JSON.stringify({ type: "success", content }));
            break;
        }
        default: {
            ws.send(JSON.stringify({ type: "error", message: "Invalid message type" }));
            break;
        }
    }
  }

  async webSocketClose(ws: WebSocket, code: number) {
    // If the client closes the connection, the runtime will invoke the webSocketClose() handler.
    ws.close(code, "Durable Object is closing WebSocket");
  }
}
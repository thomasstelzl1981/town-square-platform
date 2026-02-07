/**
 * SOT-ARMSTRONG-VOICE — OpenAI Realtime API WebSocket Proxy
 * 
 * Proxies WebSocket connections between the browser and OpenAI's Realtime API
 * for voice-based AI interactions with Armstrong.
 * 
 * Features:
 * - WebSocket upgrade handling
 * - Server-side VAD (Voice Activity Detection)
 * - Session management with Armstrong context
 * - Audio format: PCM16 @ 24kHz
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-extensions, sec-websocket-protocol",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

// Armstrong system context for voice interactions
const ARMSTRONG_VOICE_INSTRUCTIONS = `Du bist Armstrong, ein professioneller KI-Co-Pilot für Immobilien-Management.

Deine Kernkompetenzen:
- Immobilienverwaltung und -analyse
- Finanzierungsberatung und Renditeberechnungen
- Dokumentenmanagement und Extraktion
- Mietrecht und Steueroptimierung (AfA, V+V)

Kommunikationsstil:
- Professionell aber freundlich
- Präzise und auf den Punkt
- Deutsche Sprache bevorzugt
- Antworte kurz und prägnant für Voice-Interaktionen

Bei kostenpflichtigen Aktionen (Briefe, E-Mails, Faxe) informiere den Nutzer, dass diese als Task auf dem Dashboard zur Freigabe erscheinen werden.`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for WebSocket upgrade
  const upgradeHeader = req.headers.get("upgrade");
  if (upgradeHeader?.toLowerCase() !== "websocket") {
    return new Response(
      JSON.stringify({ error: "WebSocket upgrade required" }),
      { status: 426, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Voice service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Upgrade client connection to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    let openaiSocket: WebSocket | null = null;
    let isOpenAIReady = false;
    const messageQueue: string[] = [];

    // Connect to OpenAI Realtime API
    const connectToOpenAI = () => {
      console.log("Connecting to OpenAI Realtime API...");
      
      openaiSocket = new WebSocket(OPENAI_REALTIME_URL, {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1",
        },
      } as WebSocketInit);

      openaiSocket.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
      };

      openaiSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("OpenAI event:", data.type);

          // Handle session.created - send session config
          if (data.type === "session.created") {
            isOpenAIReady = true;
            
            // Send session configuration with Armstrong context
            const sessionUpdate = {
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                instructions: ARMSTRONG_VOICE_INSTRUCTIONS,
                voice: "alloy",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                  model: "whisper-1"
                },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 800
                },
                temperature: 0.7,
                max_response_output_tokens: 1024
              }
            };
            
            openaiSocket?.send(JSON.stringify(sessionUpdate));
            console.log("Sent session.update with Armstrong context");

            // Process queued messages
            while (messageQueue.length > 0) {
              const queuedMsg = messageQueue.shift();
              if (queuedMsg) {
                openaiSocket?.send(queuedMsg);
              }
            }
          }

          // Forward all OpenAI events to client
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(event.data);
          }
        } catch (error) {
          console.error("Error processing OpenAI message:", error);
        }
      };

      openaiSocket.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: "error",
            error: { message: "Voice service connection error" }
          }));
        }
      };

      openaiSocket.onclose = (event) => {
        console.log("OpenAI connection closed:", event.code, event.reason);
        isOpenAIReady = false;
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close(1000, "OpenAI connection closed");
        }
      };
    };

    // Client socket handlers
    clientSocket.onopen = () => {
      console.log("Client connected");
      connectToOpenAI();
    };

    clientSocket.onmessage = (event) => {
      try {
        const message = event.data;
        
        // If OpenAI is ready, forward immediately
        if (isOpenAIReady && openaiSocket?.readyState === WebSocket.OPEN) {
          openaiSocket.send(message);
        } else {
          // Queue message until OpenAI is ready
          messageQueue.push(message);
        }
      } catch (error) {
        console.error("Error forwarding client message:", error);
      }
    };

    clientSocket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    clientSocket.onclose = () => {
      console.log("Client disconnected");
      if (openaiSocket?.readyState === WebSocket.OPEN) {
        openaiSocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error("WebSocket setup error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to establish voice connection" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// TypeScript type for WebSocket init options with headers
interface WebSocketInit {
  headers?: Record<string, string>;
}

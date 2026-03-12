import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GameState, VideoPlan, Player } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION, GAME_STATE_SCHEMA, VIDEO_PLAN_SCHEMA } from '../constants';

// Resolve API key from runtime input first, then env fallbacks.
function getRuntimeApiKey(): string | null {
    try {
        if (typeof window !== 'undefined') {
            const local = window.localStorage.getItem('gemini_api_key');
            if (local && local.trim()) return local.trim();
        }
    } catch {
        // ignore storage access errors
    }

    const envKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    return envKey || null;
}

function getAI() {
    const apiKey = getRuntimeApiKey();
    if (!apiKey) {
        throw new Error("Gemini API key is missing. Add it on the start screen before playing.");
    }
    return new GoogleGenAI({ apiKey });
}

function getBackendBaseUrl(): string | null {
    const raw = (process.env.VITE_BACKEND_URL || '').trim();
    return raw ? raw.replace(/\/$/, '') : null;
}

/**
 * Parses an error from the Gemini API and returns a user-friendly message.
 */
function parseGeminiError(e: unknown): string {
    let errorMessage = "An unknown error occurred.";

    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else {
        try {
            errorMessage = JSON.stringify(e);
        } catch { /* Do nothing */ }
    }

    if (/PERMISSION_DENIED/i.test(errorMessage)) {
        return "This feature (like image or video generation) requires a paid Gemini API key. You can still play the text adventure!";
    }

    const isQuotaError = /quota exceeded|RESOURCE_EXHAUSTED/i.test(errorMessage);
    if (isQuotaError) {
        return "You've exceeded your API usage quota. Please try again in a few minutes.";
    }

    return errorMessage;
}

async function callGemini(command: string, payload: any, schema: any): Promise<any> {
    try {
        const backendBaseUrl = getBackendBaseUrl();
        if (backendBaseUrl) {
            const response = await fetch(`${backendBaseUrl}/api/game/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command,
                    payload,
                    schema,
                    systemInstruction: SYSTEM_INSTRUCTION,
                    model: GEMINI_MODEL,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data?.ok) {
                throw new Error(data?.error || `Backend call failed with ${response.status}`);
            }
            return data.data;
        }

        const ai = getAI();
        const llmResponse: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: JSON.stringify({ command, payload }),
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const text = llmResponse.text;
        if (!text) {
             throw new Error("Received an empty response from the AI.");
        }

        const cleanedJson = text.trim().replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Error calling Gemini API or parsing response:", e);
        const friendlyErrorMessage = parseGeminiError(e);
        throw new Error(`Failed to get a valid response from the AI. ${friendlyErrorMessage}`);
    }
}

export const createCharacterAndStartGame = async (players: { name: string, role: string, backstory: string }[]): Promise<GameState> => {
    const payload = { players };
    return callGemini("CREATE_CHARACTER_AND_START_GAME", payload, GAME_STATE_SCHEMA);
};

export const resolveAction = async (currentState: GameState, choiceId: number | null, customActionText?: string): Promise<GameState> => {
    const choiceText = choiceId === null
        ? undefined
        : currentState.choices.find((c) => c.id === choiceId)?.text;
    const payload = { currentState, choiceId, choiceText, customActionText };
    return callGemini("RESOLVE_ACTION", payload, GAME_STATE_SCHEMA);
};

export const generateVideoPlan = async (log: string[], duration_s: number): Promise<VideoPlan> => {
    const payload = { log, duration_s };
    return callGemini("GENERATE_VIDEO_PLAN", payload, VIDEO_PLAN_SCHEMA);
};

export const generateImage = async (scenePrompt: string, players: Player[]): Promise<string> => {
    try {
        const ai = getAI();
        const consistencyInstruction = "Always render each player character with consistent appearance across all generated images. The character’s core traits (face, hairstyle, outfit, colors, accessories, equipment) must remain exactly the same in every scene. Do not alter or reinvent their design unless the user explicitly updates their character description. Only vary the background, environment, and pose depending on the current scene or action. Maintain a consistent dark fantasy art style throughout.";
        
        const characterDescriptions = players.map(p => `Character Name: '${p.name}'. Full Description: '${p.description}'`).join('\n');
        
        const fullPrompt = `${consistencyInstruction}\n\n[BEGIN CHARACTER DESCRIPTIONS]\n${characterDescriptions}\n[END CHARACTER DESCRIPTIONS]\n\nNow, create a high-quality, cinematic, digital painting in the style of Dungeons and Dragons fantasy art depicting the characters in the following scene: ${scenePrompt}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                },
            },
        });

        let imageUrl = '';
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }

        if (!imageUrl) {
            throw new Error("Image generation returned no images.");
        }

        return imageUrl;

    } catch (e) {
        console.error("Error calling Gemini Image API:", e);
        const friendlyErrorMessage = parseGeminiError(e);
        throw new Error(`Failed to generate image. ${friendlyErrorMessage}`);
    }
};

export const generateCharacterPortrait = async (prompt: string): Promise<string> => {
    try {
        const ai = getAI();
        const fullPrompt = `Waist-up fantasy character portrait, digital painting, dungeons and dragons character art style, neutral background. Character details: ${prompt}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                },
            },
        });

        const candidate = response.candidates?.[0];
        if (!candidate?.content?.parts) {
            throw new Error("Image generation returned no images.");
        }

        let imageUrl = '';
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }

        if (!imageUrl) {
            throw new Error("Image generation returned no images.");
        }

        return imageUrl;

    } catch (e) {
        console.error("Error calling Gemini Image API for portrait:", e);
        const friendlyErrorMessage = parseGeminiError(e);
        throw new Error(`Failed to generate character portrait. ${friendlyErrorMessage}`);
    }
};

export const generateCoverImage = async (prompt: string): Promise<string> => {
    try {
        const ai = getAI();
        const fullPrompt = `${prompt} Omit any text or typography from the image.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                },
            },
        });

        let imageUrl = '';
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }

        if (!imageUrl) {
            throw new Error("Cover image generation returned no images.");
        }

        return imageUrl;

    } catch (e) {
        console.error("Error calling Gemini Image API for cover art:", e);
        const friendlyErrorMessage = parseGeminiError(e);
        throw new Error(`Failed to generate cover art. ${friendlyErrorMessage}`);
    }
};

export const generateVideoFromScene = async (base64ImageDataUrl: string, scenePrompt: string): Promise<string> => {
    try {
        const ai = getAI();
        const mimeTypeMatch = base64ImageDataUrl.match(/data:(.*);base64,/);
        if (!mimeTypeMatch) {
            throw new Error("Invalid base64 data URL format.");
        }
        const mimeType = mimeTypeMatch[1];
        const base64ImageBytes = base64ImageDataUrl.split(',')[1];
        
        const videoPrompt = `Animate this Dungeons and Dragons scene into a cinematic video. Predict what happens next based on the image and this description: ${scenePrompt}`;

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: videoPrompt,
            image: {
                imageBytes: base64ImageBytes,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video generation operation completed but no download link was found.");
        }

        const apiKey = getRuntimeApiKey() || '';
        const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': apiKey || '',
            },
        });
        
        if (!response.ok) {
            throw new Error(`Failed to download video file: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch (e) {
        console.error("Error calling Gemini Video API:", e);
        const friendlyErrorMessage = parseGeminiError(e);
        throw new Error(`Failed to generate video. ${friendlyErrorMessage}`);
    }
};
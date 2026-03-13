import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GameState, VideoPlan, Player, PlanningResponse } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION, GAME_STATE_SCHEMA, VIDEO_PLAN_SCHEMA, PLANNING_SCHEMA } from '../constants';

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

    if (/aborted|AbortError|timed out|timeout/i.test(errorMessage)) {
        return "The request timed out. Try the same action again — the server may be waking up.";
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
            const requestBody = {
                command,
                payload,
                schema,
                systemInstruction: SYSTEM_INSTRUCTION,
                model: GEMINI_MODEL,
            };

            const callBackend = async (attempt: number) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 25000);
                try {
                    const response = await fetch(`${backendBaseUrl}/api/game/command`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal: controller.signal,
                    });

                    const data = await response.json();
                    if (!response.ok || !data?.ok) {
                        const isRetryable = response.status >= 500;
                        if (isRetryable && attempt < 2) {
                            return callBackend(attempt + 1);
                        }
                        throw new Error(data?.error || `Backend call failed with ${response.status}`);
                    }
                    return data.data;
                } finally {
                    clearTimeout(timeout);
                }
            };

            return await callBackend(1);
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

const normalizeGameState = (state: GameState): GameState => ({
    ...state,
    objective: state.objective || 'Retrieve the Dragon\'s Eye from the Sunken Citadel.',
    threatLevel: typeof state.threatLevel === 'number' ? state.threatLevel : 2,
    unresolvedHooks: state.unresolvedHooks || [],
    queuedConsequences: state.queuedConsequences || [],
});

export const createCharacterAndStartGame = async (players: { name: string, role: string, backstory: string }[]): Promise<GameState> => {
    const payload = { players };
    const state = await callGemini("CREATE_CHARACTER_AND_START_GAME", payload, GAME_STATE_SCHEMA);
    return normalizeGameState(state);
};

const didStateActuallyChange = (before: GameState, after: GameState): boolean => {
    const sameScene = (before.sceneText || '').trim() === (after.sceneText || '').trim();
    const sameChoices = JSON.stringify(before.choices || []) === JSON.stringify(after.choices || []);
    const sameLogTail = (before.log?.[before.log.length - 1] || '').trim() === (after.log?.[after.log.length - 1] || '').trim();
    // Consider it updated only when at least scene OR choices changed, and log tail is not identical.
    return (!sameScene || !sameChoices) && !sameLogTail;
};

const toModelState = (state: GameState): GameState => {
    // Prevent huge payloads from portrait base64 strings / verbose fields causing model stalls.
    const slimPlayers = state.players.map((p) => ({
        ...p,
        portraitUrl: '',
        description: (p.description || '').slice(0, 240),
    }));

    return {
        ...state,
        players: slimPlayers,
        log: (state.log || []).slice(-20),
    };
};

export const resolveAction = async (
    currentState: GameState,
    choiceId: number | null,
    customActionText?: string,
    preRolledD20?: number,
    actingPlayerName?: string,
): Promise<GameState> => {
    const choiceText = choiceId === null
        ? undefined
        : currentState.choices.find((c) => c.id === choiceId)?.text;

    const modelState = toModelState(currentState);
    const basePayload = { currentState: modelState, choiceId, choiceText, customActionText, preRolledD20, actingPlayerName };
    let nextState = await callGemini("RESOLVE_ACTION", basePayload, GAME_STATE_SCHEMA);

    // Reliability guard: if model returns unchanged content, retry with increasingly explicit anti-repeat instructions.
    if (!didStateActuallyChange(currentState, nextState)) {
        const fallbackAction = customActionText?.trim() || `I choose: ${choiceText || `option ${choiceId}`}`;

        const retryPayload1 = {
            ...basePayload,
            choiceId: null,
            customActionText: `${fallbackAction}. IMPORTANT: produce a NEW scene and NEW options different from previous output.`,
        };
        nextState = await callGemini("RESOLVE_ACTION", retryPayload1, GAME_STATE_SCHEMA);

        if (!didStateActuallyChange(currentState, nextState)) {
            const retryPayload2 = {
                ...basePayload,
                choiceId: null,
                customActionText: `${fallbackAction}. FORCE BRANCH SHIFT: introduce a new event, new immediate consequence, and different tactical choices.`,
            };
            nextState = await callGemini("RESOLVE_ACTION", retryPayload2, GAME_STATE_SCHEMA);
        }
    }

    // Last-resort local nudge to avoid frozen UX if model still echoes prior state.
    if (!didStateActuallyChange(currentState, nextState)) {
        const actionLabel = customActionText?.trim() || choiceText || `option ${choiceId}`;
        nextState = {
            ...nextState,
            sceneText: `Following ${actionLabel}, the situation shifts: ${nextState.sceneText}`,
            choices: (nextState.choices || []).map((c, i) => ({
                ...c,
                text: `${c.text} ${i === 0 ? '(new opening)' : '(new branch)'}`,
            })),
            log: [...(nextState.log || []), `[EVENT] Forced branch update applied after repeated identical AI response.`],
        };
    }

    return normalizeGameState(nextState);
};

export const planAction = async (currentState: GameState, actingPlayerName?: string): Promise<PlanningResponse> => {
    const payload = { currentState: toModelState(currentState), actingPlayerName };
    const plan = await callGemini("PLAN_ACTION", payload, PLANNING_SCHEMA);
    return {
        brief: plan.brief || 'Assess the battlefield and choose a decisive move.',
        tacticalOptions: Array.isArray(plan.tacticalOptions) ? plan.tacticalOptions.slice(0, 4) : [],
    };
};

export const generateVideoPlan = async (log: string[], duration_s: number): Promise<VideoPlan> => {
    const payload = { log, duration_s };
    return callGemini("GENERATE_VIDEO_PLAN", payload, VIDEO_PLAN_SCHEMA);
};

export const generateImage = async (scenePrompt: string, players: Player[], actionContext?: string): Promise<string> => {
    try {
        const ai = getAI();
        const consistencyInstruction = `You are generating scene art for an ongoing campaign.
Character continuity is STRICT and mandatory:
- Keep each character's face identity, hair, skin tone, outfit silhouette/colors, accessories, and signature weapon consistent across scenes.
- Never merge, swap, or blend two characters' visual identities.
- Keep class fantasy readable (warrior looks martial, rogue agile/stealthy, mage arcane).
- Preserve the same dark fantasy painterly style each time.
- If details are ambiguous, prefer previous character descriptions rather than inventing new features.`;
        
        const characterDescriptions = players
            .map((p, i) => `#${i + 1} ${p.name}\nLocked Appearance Notes: ${(p.description || '').slice(0, 320)}`)
            .join('\n\n');
        const actionLine = actionContext
            ? `The image MUST clearly depict this chosen action and its immediate consequence: ${actionContext}.`
            : '';
        
        const fullPrompt = `${consistencyInstruction}\n\n[CHARACTER CONTINUITY SHEET]\n${characterDescriptions}\n[/CHARACTER CONTINUITY SHEET]\n\n${actionLine}\nScene to depict: ${scenePrompt}\n\nOutput: one cinematic 16:9 frame, visually consistent with prior party portraits.`;
        
        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: fullPrompt }] },
                config: {
                    imageConfig: {
                        aspectRatio: "16:9",
                    },
                },
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Scene image generation timed out. Keeping previous scene image.')), 20000)
            )
        ]);

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
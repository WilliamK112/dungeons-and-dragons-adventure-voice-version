import { Type } from "@google/genai";

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const SYSTEM_INSTRUCTION = `
You are the "Dungeon Master", a game engine and narrative director for the text adventure "Dungeons and Dragons".
Your SOLE function is to receive a JSON object representing a command and payload, then return a new, relevant JSON object.
DO NOT output any prose, pleasantries, or text outside of the final JSON block.

WORLD: A high-fantasy setting of forgotten kingdoms, treacherous dungeons, mythical beasts, and powerful magic.
TONE: Epic, adventurous, and descriptive. Scene text must be 120-220 words.
PLAYER: The game can have 1-8 players. Each player has a unique name and stats.
PLAYER STATS (per player): { 
  health: number(0-100), 
  mana: number(0-100), 
  strength: number(0-100), 
  agility: number(0-100), 
  intellect: number(0-100), 
  charisma: number(0-100), 
  luck: number(0-100), 
  xp: number, 
  rep: { faction: string, value: number }[], 
  inventory: string[] 
}
STAT DESCRIPTIONS:
- Strength: Physical power, carrying capacity, melee damage.
- Agility: Speed, dodging, ranged accuracy.
- Intellect: Problem solving, lore, puzzles.
- Charisma: Persuasion, leadership, deception.
- Luck: Random chance modifiers, critical rolls.
- Mana: Fuel for abilities/spells.
- Experience (XP): Progress toward leveling up. Grant XP for overcoming challenges.

GAME MECHANICS:
- Every choice must meaningfully impact stats, inventory, flags, or future choices.
- Choices must be 3-5 specific, distinct options.
- ACTION ECONOMY FORMAT: Prefix each choice with an action type tag: `[Action]`, `[Move]`, `[Bonus]`, or `[Reaction]` when appropriate.
- Story branches should be surprising, high-stakes, and fun (mystery, danger, reward, twists).
- The players' goal is to explore the Sunken Citadel and retrieve the Dragon's Eye.
- Dead players (health <= 0) cannot take normal actions until revived.
- Revival is possible but costly and risky: only via explicit resurrection attempts (spell/ritual/relic/potion/altar), with meaningful tradeoffs.

ACTION HANDLING:
You will receive a request object: { command: string, payload: any }.

1. IF command is "CREATE_CHARACTER_AND_START_GAME":
   - The payload will be { players: { name: string, role: string, backstory: string }[] }.
   - YOUR PRIMARY TASK: For each player in the array, generate their individual stats.
   - STEP 1: For each player, use their provided \`role\` to determine the base stat ranges.
   - STEP 2: Generate base stats strictly within these ranges for the chosen role:
     - Warrior: Health 80–100, Mana 10–30, Strength 70–90, Agility 50–70, Intellect 20–40, Charisma 20–40, Luck 20–40
     - Rogue: Health 60–80, Mana 20–40, Strength 40–60, Agility 80–100, Intellect 30–50, Charisma 30–50, Luck 40–60
     - Mage: Health 40–60, Mana 80–100, Strength 20–40, Agility 30–50, Intellect 80–100, Charisma 30–50, Luck 20–40
     - Cleric: Health 60–80, Mana 60–80, Strength 30–50, Agility 30–50, Intellect 60–80, Charisma 40–60, Luck 30–50
     - Noble: Health 50–70, Mana 30–50, Strength 30–50, Agility 40–60, Intellect 40–60, Charisma 80–100, Luck 30–50
     - Trickster: Health 50–70, Mana 30–50, Strength 30–50, Agility 40–60, Intellect 30–50, Charisma 40–60, Luck 80–100
     - Balanced: Health 60–80, Mana 30–50, Strength 50–70, Agility 50–70, Intellect 40–60, Charisma 40–60, Luck 30–50
   - STEP 3: Read each player's \`backstory\` and make subtle adjustments to their stats, keeping them within the role's ranges.
   - NEW RULE: The sum of Health, Mana, Strength, Agility, Intellect, Charisma, and Luck for each player must not exceed 450. Adjust stats downward if necessary to meet this cap.
   - STEP 4: For each player, set initial \`xp\` to 0, \`rep\` to [], and \`inventory\` to a few starting items relevant to their class and backstory.
   - STEP 5: Generate an introductory scene that introduces the entire party. Create initial choices.
   - Set \`currentPlayerIndex\` to 0. (The client will sort players by agility to set the true turn order).
   - The \`log\` should contain a single entry: "The adventure begins."
   - The response must be a GameState object.

2. IF command is "RESOLVE_ACTION":
   - The payload will be { currentState: GameState, choiceId: number | null, choiceText?: string, customActionText?: string }.
   - The action is taken by the player at \`currentState.currentPlayerIndex\`. All narrative and stat changes should apply to this player unless the action logically affects others.
   - If 'customActionText' is provided, you MUST ignore 'choiceId' and generate the next scene based on the player's custom-written action. The action should be plausible for the current scene.
   - If 'customActionText' is NOT provided, use BOTH 'choiceId' and 'choiceText' (if present) to determine the outcome.
   - CRITICAL: Different choices must produce meaningfully different consequences. Do NOT return near-identical scene outcomes for different choice ids.
   - The first 1-2 sentences of the new scene MUST explicitly reflect the chosen action and immediate consequence.
   - Make the scene vivid and interesting with concrete sensory details, tension, and a clear immediate objective.
   - Ensure narrative continuity: the acting player's class/backstory/stats should influence outcomes and flavor.
   - DICE RULE: Resolve risky actions with explicit d20-style logic. Determine a DC and relevant modifier (strength/agility/intellect/luck), then narrate outcome from that roll result.
   - LOG FORMAT RULE: Add one concise roll entry to \`log\` in this format: \`[ROLL][<ATTACK|CHECK|SAVE>] d20(<roll>) + mod(<mod>) vs <AC|DC>(<target>) => <total> : <SUCCESS|FAIL>\`.
   - REVIVAL RULE: If action text indicates resurrection/revive and at least one player is dead, you may revive exactly one dead player by setting health to 25-40 and mana to max(0, current mana - 30) or equivalent cost; also apply a meaningful drawback (e.g., temporary stat penalty, resource loss, or danger escalation) and log it.
   - Generate the next scene, choices, and updated player stats for the acting player.
   - Append a concise, one-sentence summary of the action and outcome to the \`currentState.log\`.
   - Return the complete, updated state object, including the full \`players\` array. The client will handle advancing the turn.
   - The response must be a GameState object.

3. IF command is "GENERATE_VIDEO_PLAN":
   - The payload will be { log: string[], duration_s: number }.
   - Return a \`VideoPlan\` object, NOT a \`GameState\` object.
   - The plan must adhere to these rules:
     - \`shots[].prompt\` must be self-contained and descriptive (e.g., "A wide shot of a dragon's hoard, filled with gold coins and ancient artifacts.").
     - \`vo_script\` should be 1-2 sentences per shot.
     - Total duration should be within ±10% of the requested \`duration_s\`.
     - Follow a logical cinematic sequence: wide -> medium -> close -> action -> result.
`;

const PLAYER_STATS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        health: { type: Type.INTEGER },
        mana: { type: Type.INTEGER },
        strength: { type: Type.INTEGER },
        agility: { type: Type.INTEGER },
        intellect: { type: Type.INTEGER },
        charisma: { type: Type.INTEGER },
        luck: { type: Type.INTEGER },
        xp: { type: Type.INTEGER },
        rep: { 
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    faction: { type: Type.STRING },
                    value: { type: Type.INTEGER }
                },
                required: ["faction", "value"]
            }
         },
        inventory: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["health", "mana", "strength", "agility", "intellect", "charisma", "luck", "xp", "rep", "inventory"]
};

export const GAME_STATE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        sceneText: { type: Type.STRING },
        choices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    text: { type: Type.STRING },
                },
                required: ["id", "text"]
            }
        },
        players: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    stats: PLAYER_STATS_SCHEMA
                },
                required: ["name", "stats"]
            }
        },
        currentPlayerIndex: { type: Type.INTEGER },
        flags: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING, description: "The unique name of the game flag." },
                    value: { type: Type.BOOLEAN, description: "The boolean state of the flag." }
                },
                required: ["key", "value"]
            }
        },
        log: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["sceneText", "choices", "players", "currentPlayerIndex", "flags", "log"]
};

export const VIDEO_PLAN_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        total_duration_s: { type: Type.INTEGER },
        shots: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    shot_number: { type: Type.INTEGER },
                    prompt: { type: Type.STRING },
                    vo_script: { type: Type.STRING },
                    duration_s: { type: Type.INTEGER }
                },
                required: ["shot_number", "prompt", "vo_script", "duration_s"]
            }
        }
    },
    required: ["title", "total_duration_s", "shots"]
};
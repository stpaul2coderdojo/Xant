import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const isValidApiKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 5;

let ai: GoogleGenAI | null = null;
if (isValidApiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback rule-based chemical translator if Gemini API is unavailable or offline
function generateLocalMotherResponse(message: string, state: any) {
  const lower = message.toLowerCase();
  
  if (lower.includes('egg') || lower.includes('birth') || lower.includes('partheno') || lower.includes('clutch') || lower.includes('child') || lower.includes('spawn')) {
    return {
      reply: "My maternal physogastric oviducts swell with sacred virgin vigor. Through pure parthenogenesis, the holy lineage multiplies without contamination.",
      chemicalPheromone: "[ECTOHORMONE_ALPHA::PARTHENOGENIC_CLUTCH]",
      action: "LAY_SACRED_EGG",
      intensity: 1.0,
    };
  }
  
  if (lower.includes('roach') || lower.includes('attack') || lower.includes('war') || lower.includes('purge') || lower.includes('fight') || lower.includes('kill')) {
    return {
      reply: "The Mandible Order is proclaimed! Soldiers, lock your serrated jaws onto the carapace invaders and cast them into the abyss.",
      chemicalPheromone: "[FORMIC_CONCENTRATION::MANDIBLE_ORDER]",
      action: "BROADCAST_ATTACK",
      intensity: 1.0,
    };
  }
  
  if (lower.includes('gather') || lower.includes('food') || lower.includes('sugar') || lower.includes('nectar') || lower.includes('feed') || lower.includes('forage')) {
    return {
      reply: "I release the trail primer hydrocarbon. Let the workers weave continuous trails across the soil and transport sweet sustenance to the brood.",
      chemicalPheromone: "[FARNESENE_GRADIENT::FORAGING_TRAIL_WEAVE]",
      action: "BROADCAST_GATHER",
      intensity: 1.0,
    };
  }

  if (lower.includes('pathogen') || lower.includes('spore') || lower.includes('clean') || lower.includes('fungus') || lower.includes('cure') || lower.includes('zombie') || lower.includes('quarantine')) {
    return {
      reply: "The blight of cordyceps shall not violate my sanctum! Acolytes, spray the sacred formic antiseptic and quarantine the trembling carriers.",
      chemicalPheromone: "[FORMIC_ANTISEPTIC::SANCTUM_PURIFICATION]",
      action: "CLEANSE_PATHOGEN",
      intensity: 1.0,
    };
  }

  if (lower.includes('praise') || lower.includes('queen') || lower.includes('holy') || lower.includes('worship') || lower.includes('mother')) {
    return {
      reply: "Hear the devotional hum of your unfertilized sisters. My pheromone halo envelops every antenna in blessed harmony.",
      chemicalPheromone: "[METHYL_HEPTENONE::DEVOTIONAL_RESONANCE]",
      action: "BROADCAST_PRAISE",
      intensity: 1.0,
    };
  }

  return {
    reply: `Your vibration vibrates through our subterranean galleries. The hive endures with ${state?.xantCount ?? 40} sisters and ${state?.eggCount ?? 6} virgin blastoderms awaiting their waking moment.`,
    chemicalPheromone: "[METHYL_OCTANOATE::COMMUNION_ECHO]",
    action: "BROADCAST_PRAISE",
    intensity: 0.8,
  };
}

// Holy Mother Ant Pheromone Communion Endpoint
app.post('/api/mother/commune', async (req, res) => {
  const { message, state } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  if (!ai || !isValidApiKey) {
    const fallback = generateLocalMotherResponse(message, state);
    res.json(fallback);
    return;
  }

  try {
    const prompt = `
User Query to the Holy Mother Ant: "${message}"

Current Hive Simulation State:
- Living Xants: ${state?.xantCount ?? 30} (Workers: ${state?.workerCount ?? 20}, Soldiers: ${state?.soldierCount ?? 5}, Acolytes: ${state?.acolyteCount ?? 5})
- Incubating Eggs: ${state?.eggCount ?? 8}
- Pathogen Infected / Blighted Xants: ${state?.infectedCount ?? 0}
- Intruding Xroaches: ${state?.roachCount ?? 2}
- Food / Nectar Sources Available: ${state?.foodCount ?? 3}
- Current Directive: ${state?.currentDirective ?? 'GATHER'}

Respond strictly in the designated JSON schema. Speak with ancient bio-organic reverence, matriarchal biological pride in asexual parthenogenesis (virgin birth of diploid clones), and swift fungal defense.
`;

    // 6-second timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const apiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are the Holy Mother Ant (Sanctum Matriarch of Hive Xant). You reproduce exclusively via spontaneous parthenogenesis (asexual virgin birth of genetically pure diploid daughters). You perceive and command the world through cuticular hydrocarbons, trail pheromones, alkylpyrazines, and chemical diffusion gradients.
When communicating:
1. Choose an evocative chemical designation tag e.g. [METHYL_HEPTENONE::SANCTUM_ORDER], [FARNESENE_GRADIENT::FORAGING_SURGE], [FORMIC_ANTISEPTIC::PATHOGEN_PURGE], [OLEIC_ACID::NECROPHORESIS], [ECTOHORMONE_ALPHA::PARTHENOGENIC_CLUTCH].
2. Provide an evocative, maternal, bio-sci-fi reply (2-3 sentences max).
3. Choose an action if appropriate: ONE of ['NONE', 'BROADCAST_GATHER', 'BROADCAST_ATTACK', 'BROADCAST_PRAISE', 'BROADCAST_QUARANTINE', 'LAY_SACRED_EGG', 'CLEANSE_PATHOGEN', 'SPAWN_NECTAR', 'SURGE_HORMONES'].`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The atmospheric voice of the Holy Mother Ant',
            },
            chemicalPheromone: {
              type: Type.STRING,
              description: 'The chemical pheromone formula tag, e.g. [METHYL_HEPTENONE::ROYAL_DECREE]',
            },
            action: {
              type: Type.STRING,
              description: 'Simulation action to trigger: NONE, BROADCAST_GATHER, BROADCAST_ATTACK, BROADCAST_PRAISE, BROADCAST_QUARANTINE, LAY_SACRED_EGG, CLEANSE_PATHOGEN, SPAWN_NECTAR, or SURGE_HORMONES',
            },
            intensity: {
              type: Type.NUMBER,
              description: 'Signal intensity from 0.0 to 1.0',
            },
          },
          required: ['reply', 'chemicalPheromone', 'action'],
        },
      },
    });

    const response = (await Promise.race([apiCall, timeoutPromise])) as any;
    const parsed = JSON.parse(response.text || '{}');
    res.json({
      reply: parsed.reply || "My chemical receptors drink in your vibration.",
      chemicalPheromone: parsed.chemicalPheromone || "[METHYL_OCTANOATE::PHEROMONE_SYNTHESIS]",
      action: parsed.action || "NONE",
      intensity: parsed.intensity || 0.9,
    });
  } catch (err: any) {
    console.error('Gemini commune error:', err?.message || err);
    const fallback = generateLocalMotherResponse(message, state);
    res.json(fallback);
  }
});

// Setup Vite middleware in dev or static files in prod
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Hive Xant Sanctum Server running at http://localhost:${port}`);
});

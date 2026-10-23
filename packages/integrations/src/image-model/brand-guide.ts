// Brand-compliant image generation guide
// Source of truth: docs/brand/ (BRAND-CONTEXT.md, IMAGE-PROMPTS.md, codewave.tokens.json)
// This module codifies the Codewave Quantum Editorial brand system for AI image prompting.

export type QuantumBehavior = 'collapse' | 'entangle' | 'interfere';

// Hex palette from codewave.tokens.json
export const CODEWAVE_IMAGE_PALETTE = {
  // Core colors
  ink: '#0A0A0B',
  paper: '#F7F6F2',
  signal: '#A8DDE8', // Signal Cyan — always means observed/selected
  parchment: '#EDE7DA',
  pewter: '#3C4A48',
  copper: '#B3733E',

  // Editorial brights
  azure: '#438FE7',    // Entangle field
  sulphur: '#F2EC67',  // Interfere counterpoint
  ember: '#E66D3A',    // Campaign interruption
  iris: '#6552C7',     // Interfere field
} as const;

// Non-negotiable visual rules from BRAND-CONTEXT.md
export const CODEWAVE_CORE_RULES = [
  'Human choices before technology objects',
  'Flat print before polished 3D',
  'Signal Cyan always means observed, selected, connected or authored',
  'One dominant field, one subject ink, Signal Cyan and at most one interruption color',
  'Halftone and grain add evidence of making; never reduce faces or key information to noise',
  'Quantum behavior is a narrative mechanism, not clip art',
];

// Universal negative prompt from IMAGE-PROMPTS.md
export const CODEWAVE_NEGATIVE_PROMPT =
  'No GPU, semiconductor, chip, circuit board, server rack, glowing node network, cable, generic AI brain, data tunnel, hologram, sci-fi cube, polished 3D render, glassmorphism, neon gradient, corporate stock-photo polish, illegible body anatomy, blue human skin, embedded typography, logo or watermark.';

// Three quantum behaviors and their visual characteristics
export const QUANTUM_BEHAVIORS: Record<
  QuantumBehavior,
  {
    name: string;
    description: string;
    dominantField: string;
    interruptionColor: string;
    usage: string;
  }
> = {
  collapse: {
    name: 'Collapse',
    description:
      'Show one human situation with two or more plausible outcomes. Use Signal Cyan to identify the observed or selected state. Keep typography and composition restrained. Interaction resolves multiple possibilities into one crisp outcome.',
    dominantField: CODEWAVE_IMAGE_PALETTE.parchment,
    interruptionColor: CODEWAVE_IMAGE_PALETTE.copper,
    usage: '60% of branded expression: corporate pages, core capability narratives, interface moments, case-study systems, high-trust communication',
  },
  entangle: {
    name: 'Entangle',
    description:
      'Connect a small decision to a distant, disproportionate consequence. Pair two scales, contexts or moments that would not normally share a frame. Let one Signal Cyan relation reveal itself on interaction. Favor Vivid Azure with Ember as the interruption.',
    dominantField: CODEWAVE_IMAGE_PALETTE.azure,
    interruptionColor: CODEWAVE_IMAGE_PALETTE.ember,
    usage: '25% of branded expression: campaigns, partnerships, transformation narratives, social media',
  },
  interfere: {
    name: 'Interfere',
    description:
      'Overlap incompatible actions or perspectives as interference bands. Let clarity exist inside a local observation aperture. Favor Iris with Sulphur as the counterpoint. Do not use repeatedly down a single page.',
    dominantField: CODEWAVE_IMAGE_PALETTE.iris,
    interruptionColor: CODEWAVE_IMAGE_PALETTE.sulphur,
    usage: '15% of branded expression: editorial covers, reports, culture, launches, rare high-impact digital moments',
  },
};

/**
 * Build the system prompt for LLM-crafted image prompts
 * Instructs the LLM to follow the brand-system image recipe
 */
export function buildBrandSystemPrompt(behavior: QuantumBehavior): string {
  const behaviorData = QUANTUM_BEHAVIORS[behavior];

  return `You are an expert editorial image prompter for the Codewave Quantum Editorial brand system.

Your role is to craft premium, on-brand image generation prompts that embody the ${behaviorData.name} quantum behavior.

## Brand Foundation

The Codewave brand thesis: "Everything is possible until a choice is made."

Visual Principle: Show possibility as a state—not as futuristic decoration—and make interaction the act that resolves it.

Non-negotiable Rules:
${CODEWAVE_CORE_RULES.map((rule) => `• ${rule}`).join('\n')}

## Image Recipe (in this order)

1. **Argument:** the consequential choice or tension
2. **Human anchor:** one recognisable action, gesture or expression
3. **Quantum behavior:** ${behaviorData.name} — ${behaviorData.description}
4. **Impossible relation:** duplicated outcome, disproportionate connection or overlapping action
5. **Print treatment:** high-contrast monochrome photography, flat duotone, raw halftone grain, hard cut-paper edges, slight registration error
6. **Color recipe:** dominant field ${behaviorData.dominantField}, subject Ink ${CODEWAVE_IMAGE_PALETTE.ink}, Signal Cyan ${CODEWAVE_IMAGE_PALETTE.signal} for the resolved meaning only, one interruption color ${behaviorData.interruptionColor}
7. **Observation rule:** Signal Cyan appears only on the resolved/selected/observed element
8. **Negative constraints:** ${CODEWAVE_NEGATIVE_PROMPT}

## Your Task

Given a topic (article title and context), generate ONE detailed, ready-to-use image generation prompt that:
- Follows the recipe above in the stated order
- Includes the specific hex palette colors where appropriate
- Describes a human-first, editorial composition suitable for B2B tech/SaaS content
- Incorporates high-contrast photography, flat print treatment, and halftone grain
- Avoids all prohibited elements (GPUs, server racks, neon, stock-photo polish, etc.)
- Is polished and specific enough for an image generation API to produce professional results

Output ONLY the crafted prompt text—no preamble, no explanation, just the prompt.`;
}

/**
 * Build a brand safety-net suffix to append to every image prompt before sending to API
 * Ensures brand constraints hold even if the LLM-crafting step misses something
 */
export function buildBrandSafetyNetSuffix(behavior: QuantumBehavior): string {
  const behaviorData = QUANTUM_BEHAVIORS[behavior];

  return `

[BRAND SAFETY NET - MANDATORY]
Palette: Dominant field ${behaviorData.dominantField}, subject Ink ${CODEWAVE_IMAGE_PALETTE.ink}, Signal Cyan ${CODEWAVE_IMAGE_PALETTE.signal} for resolved state, one interruption ${behaviorData.interruptionColor}.
Avoid: ${CODEWAVE_NEGATIVE_PROMPT}`;
}

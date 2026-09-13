// Difficulty tiers and their mapping to real UCI options.
//
// Stockfish's own UCI_Elo option is calibrated — and hard-clamped — between 1320
// and 3190; asking for anything lower has no effect. ("Skill Level" 0, the other
// weakening knob, bottoms out at roughly the same strength.) See:
// https://github.com/official-stockfish/Stockfish/wiki/UCI-&-Commands
//
// So for the two tiers below that floor (Beginner, Easy) this app adds two more
// layers on top of the engine's own weakest setting: a very low depth cap, and a
// chance for the app itself to play a uniformly random legal move instead of
// Stockfish's suggestion (see chooseEngineMove() in hooks/useStockfish.js). Both
// are applied transparently and explained in the UI — this file never claims a
// tier corresponds to an exact, calibrated Elo rating.

export const DIFFICULTY_TIERS = [
  {
    id: 'beginner',
    label: 'Beginner',
    eloHint: '~400–700',
    description: 'Shallow search plus frequent random moves. Loses on purpose, a lot.',
    limitStrength: true,
    elo: 1320,
    skillLevel: 0,
    depthCap: 1,
    defaultMovetimeMs: 200,
    minMovetimeMs: 100,
    maxMovetimeMs: 5000,
    randomMoveChance: 0.4,
  },
  {
    id: 'easy',
    label: 'Easy',
    eloHint: '~800–1100',
    description: 'Still shallow, with occasional random moves.',
    limitStrength: true,
    elo: 1320,
    skillLevel: 0,
    depthCap: 3,
    defaultMovetimeMs: 300,
    minMovetimeMs: 100,
    maxMovetimeMs: 5000,
    randomMoveChance: 0.18,
  },
  {
    id: 'medium',
    label: 'Medium',
    eloHint: '~1200–1700',
    description: "Plays real moves, but won't see very far ahead.",
    limitStrength: true,
    elo: 1500,
    skillLevel: 6,
    depthCap: 8,
    defaultMovetimeMs: 600,
    minMovetimeMs: 100,
    maxMovetimeMs: 8000,
    randomMoveChance: 0,
  },
  {
    id: 'hard',
    label: 'Hard',
    eloHint: '~1800–2200',
    description: 'A solid club-level opponent.',
    limitStrength: true,
    elo: 2000,
    skillLevel: 12,
    depthCap: 12,
    defaultMovetimeMs: 1000,
    minMovetimeMs: 200,
    maxMovetimeMs: 10000,
    randomMoveChance: 0,
  },
  {
    id: 'expert',
    label: 'Expert',
    eloHint: '~2300–2700',
    description: 'Strong enough to trouble most human players.',
    limitStrength: true,
    elo: 2500,
    skillLevel: 18,
    depthCap: 18,
    defaultMovetimeMs: 2000,
    minMovetimeMs: 300,
    maxMovetimeMs: 15000,
    randomMoveChance: 0,
  },
  {
    id: 'maximum',
    label: 'Maximum',
    eloHint: 'Full engine strength',
    description: 'No handicap. Give it time and it will not miss much.',
    limitStrength: false,
    elo: null,
    skillLevel: 20,
    depthCap: null,
    defaultMovetimeMs: 3000,
    minMovetimeMs: 500,
    maxMovetimeMs: 30000,
    randomMoveChance: 0,
  },
]

export function getTier(id) {
  return DIFFICULTY_TIERS.find((t) => t.id === id) || DIFFICULTY_TIERS[2]
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)))

/**
 * Resolve a difficulty selection into { uciOptions, go, randomMoveChance } for one
 * move request. `movetimeMs` is the current value of the (tier-scoped) think-time
 * slider; `custom` carries the manual overrides used only when tierId === 'custom'.
 */
export function resolveEngineSettings(tierId, movetimeMs, custom) {
  if (tierId === 'custom' && custom) {
    return {
      uciOptions: {
        UCI_LimitStrength: custom.limitStrength,
        UCI_Elo: clamp(custom.elo ?? 1320, 1320, 3190),
        'Skill Level': clamp(custom.skillLevel ?? 20, 0, 20),
      },
      go: custom.useDepth
        ? { depth: clamp(custom.depth ?? 15, 1, 40) }
        : { movetime: clamp(custom.movetimeMs ?? 1000, 50, 60000) },
      randomMoveChance: 0,
    }
  }

  const tier = getTier(tierId)
  const go = { movetime: clamp(movetimeMs ?? tier.defaultMovetimeMs, tier.minMovetimeMs, tier.maxMovetimeMs) }
  if (tier.depthCap) go.depth = tier.depthCap

  return {
    uciOptions: {
      UCI_LimitStrength: tier.limitStrength,
      UCI_Elo: tier.elo ?? 1320,
      'Skill Level': tier.skillLevel,
    },
    go,
    randomMoveChance: tier.randomMoveChance,
  }
}

export const MDS_CONFIG = {
  ID: "fvtt-maresdesangue",

  attributes: {
    strength: "MDS.Attribute.strength",
    agility: "MDS.Attribute.agility",
    wits: "MDS.Attribute.wits",
    empathy: "MDS.Attribute.empathy",
  },

  attributeAbbr: {
    strength: "MDS.AttributeAbbr.strength",
    agility: "MDS.AttributeAbbr.agility",
    wits: "MDS.AttributeAbbr.wits",
    empathy: "MDS.AttributeAbbr.empathy",
  },

  physicalAttributes: ["strength", "agility"],
  mentalAttributes: ["wits", "empathy"],

  // Pure Step Dice Scale (A=D12, B=D10, C=D8, D=D6)
  stepDice: {
    none: { label: "MDS.StepDie.none", letter: "—", faces: 0, deno: "" },
    d6: { label: "MDS.StepDie.d6", letter: "D", faces: 6, deno: "6" },
    d8: { label: "MDS.StepDie.d8", letter: "C", faces: 8, deno: "8" },
    d10: { label: "MDS.StepDie.d10", letter: "B", faces: 10, deno: "10" },
    d12: { label: "MDS.StepDie.d12", letter: "A", faces: 12, deno: "12" },
  },

  attributeStepChoices: {
    d6: "MDS.StepAttr.d6",
    d8: "MDS.StepAttr.d8",
    d10: "MDS.StepAttr.d10",
    d12: "MDS.StepAttr.d12",
  },

  skillStepChoices: {
    none: "MDS.StepSkill.none",
    d6: "MDS.StepSkill.d6",
    d8: "MDS.StepSkill.d8",
    d10: "MDS.StepSkill.d10",
    d12: "MDS.StepSkill.d12",
  },

  stepOrder: ["none", "d6", "d8", "d10", "d12"],

  // 12 Official Skills (Chapter 3)
  coreSkills: [
    { key: "force", nameKey: "MDS.CoreSkill.force", attribute: "strength" },
    { key: "melee", nameKey: "MDS.CoreSkill.melee", attribute: "strength" },
    { key: "stamina", nameKey: "MDS.CoreSkill.stamina", attribute: "strength" },
    { key: "marksmanship", nameKey: "MDS.CoreSkill.marksmanship", attribute: "agility" },
    { key: "stealth", nameKey: "MDS.CoreSkill.stealth", attribute: "agility" },
    { key: "mobility", nameKey: "MDS.CoreSkill.mobility", attribute: "agility" },
    { key: "observation", nameKey: "MDS.CoreSkill.observation", attribute: "wits" },
    { key: "crafting", nameKey: "MDS.CoreSkill.crafting", attribute: "wits" },
    { key: "survival", nameKey: "MDS.CoreSkill.survival", attribute: "wits" },
    { key: "healing", nameKey: "MDS.CoreSkill.healing", attribute: "empathy" },
    { key: "insight", nameKey: "MDS.CoreSkill.insight", attribute: "empathy" },
    { key: "persuasion", nameKey: "MDS.CoreSkill.persuasion", attribute: "empathy" },
  ],

  // 10 Official Archetypes (Chapter 2)
  archetypes: {
    aristocrat: { label: "MDS.Archetype.aristocrat", keyAttribute: "empathy", keySkill: "persuasion" },
    freedman: { label: "MDS.Archetype.freedman", keyAttribute: "strength", keySkill: "force" },
    drowned: { label: "MDS.Archetype.drowned", keyAttribute: "wits", keySkill: "insight" },
    rat: { label: "MDS.Archetype.rat", keyAttribute: "agility", keySkill: "stealth" },
    renegade: { label: "MDS.Archetype.renegade", keyAttribute: "strength", keySkill: "marksmanship" },
    manipulator: { label: "MDS.Archetype.manipulator", keyAttribute: "empathy", keySkill: "persuasion" },
    bloodthirsty: { label: "MDS.Archetype.bloodthirsty", keyAttribute: "strength", keySkill: "melee" },
    healer: { label: "MDS.Archetype.healer", keyAttribute: "wits", keySkill: "healing" },
    sorcerer: { label: "MDS.Archetype.sorcerer", keyAttribute: "empathy", keySkill: "insight" },
    exorcist: { label: "MDS.Archetype.exorcist", keyAttribute: "empathy", keySkill: "insight" },
  },

  // Narrative Conditions Severity (non-stacking, highest active prevails)
  conditionSeverities: {
    none: { label: "MDS.Condition.Severity.none", penalty: 0 },
    mild: { label: "MDS.Condition.Severity.mild", penalty: -1 },
    moderate: { label: "MDS.Condition.Severity.moderate", penalty: -2 },
    severe: { label: "MDS.Condition.Severity.severe", penalty: -3 },
  },

  ranges: {
    engaged: "MDS.Range.engaged",
    short: "MDS.Range.short",
    medium: "MDS.Range.medium",
    long: "MDS.Range.long",
    extreme: "MDS.Range.extreme",
  },

  weaponGrips: {
    "1h": "MDS.Weapon.Grip.1h",
    "2h": "MDS.Weapon.Grip.2h",
    unarmed: "MDS.Weapon.Grip.unarmed",
  },

  armorParts: {
    body: "MDS.Armor.Part.body",
    shield: "MDS.Armor.Part.shield",
    cover: "MDS.Armor.Part.cover",
  },

  coverPresets: [
    { key: "none", label: "MDS.Cover.none", die: "none" },
    { key: "barrel", label: "MDS.Cover.barrel", die: "d6" },
    { key: "cabinDoor", label: "MDS.Cover.cabinDoor", die: "d8" },
    { key: "mast", label: "MDS.Cover.mast", die: "d8" },
    { key: "shipWall", label: "MDS.Cover.shipWall", die: "d10" },
    { key: "fortWall", label: "MDS.Cover.fortWall", die: "d12" },
  ],

  weightChoices: {
    0: "MDS.Weight.tiny",
    1: "MDS.Weight.handful",
    2: "MDS.Weight.heavy",
    3: "MDS.Weight.veryHeavy",
  },

  specialtyCategories: {
    general: "MDS.Specialty.Category.general",
    exclusive: "MDS.Specialty.Category.exclusive",
    magic: "MDS.Specialty.Category.magic",
  },

  // Chapter 5: Magic Traditions
  magicTraditions: {
    vodou: "MDS.Magic.Tradition.vodou",
    faith: "MDS.Magic.Tradition.faith",
    corruption: "MDS.Magic.Tradition.corruption",
  },

  vodouLoas: {
    legba: "MDS.Magic.Loa.legba",
    ogou: "MDS.Magic.Loa.ogou",
    erzulie: "MDS.Magic.Loa.erzulie",
    baronSamedi: "MDS.Magic.Loa.baronSamedi",
    agwe: "MDS.Magic.Loa.agwe",
  },

  magicCastingTimes: {
    fast: "MDS.Magic.CastingTime.fast",
    slow: "MDS.Magic.CastingTime.slow",
    stretch: "MDS.Magic.CastingTime.stretch",
    quarterDay: "MDS.Magic.CastingTime.quarterDay",
  },

  // 5 Commandments of Catholic Faith (Chapter 5)
  commandments: [
    { id: "noKillInnocents", label: "MDS.Faith.Commandment.noKillInnocents" },
    { id: "noStealPoor", label: "MDS.Faith.Commandment.noStealPoor" },
    { id: "noAbandonAllies", label: "MDS.Faith.Commandment.noAbandonAllies" },
    { id: "noPactDepths", label: "MDS.Faith.Commandment.noPactDepths" },
    { id: "careWeak", label: "MDS.Faith.Commandment.careWeak" },
  ],

  // Vodou Mishaps (D6, Chapter 5)
  vodouMishapTable: Array.from({ length: 6 }, (_, idx) => ({
    roll: idx + 1,
    effectKey: `MDS.Tables.VodouMishap.r${idx + 1}`,
  })),

  criticalCategories: {
    physical: "MDS.Critical.Category.physical",
    mental: "MDS.Critical.Category.mental",
  },

  timeLimits: {
    none: "MDS.TimeLimit.none",
    round: "MDS.TimeLimit.round",
    stretch: "MDS.TimeLimit.stretch",
    quarterDay: "MDS.TimeLimit.quarterDay",
  },

  // Physical Critical Injuries (D66, Chapter 4)
  physicalCritTable: [
    { d66: [11, 12, 13, 14, 15, 16], key: "11", lethal: false, timeLimit: "none", healingTime: "D6" },
    { d66: [21], key: "21", lethal: false, timeLimit: "none", healingTime: "MDS.Permanent" },
    { d66: [22, 23, 24], key: "22", lethal: false, timeLimit: "none", healingTime: "D6" },
    { d66: [25, 26, 31], key: "25", lethal: false, timeLimit: "none", healingTime: "2D6" },
    { d66: [32, 33, 34, 35], key: "32", lethal: false, timeLimit: "none", healingTime: "2D6" },
    { d66: [36, 41], key: "36", lethal: false, timeLimit: "none", healingTime: "2D6" },
    { d66: [42, 43], key: "42", lethal: false, timeLimit: "none", healingTime: "3D6" },
    { d66: [44, 45], key: "44", lethal: true, timeLimit: "quarterDay", healingTime: "D6" },
    { d66: [46, 51], key: "46", lethal: true, timeLimit: "quarterDay", healingTime: "2D6" },
    { d66: [52], key: "52", lethal: true, timeLimit: "stretch", healingTime: "D6" },
    { d66: [53, 54], key: "53", lethal: true, timeLimit: "stretch", healingTime: "D6" },
    { d66: [55], key: "55", lethal: true, timeLimit: "quarterDay", healingTime: "MDS.Permanent" },
    { d66: [56, 61], key: "56", lethal: true, timeLimit: "quarterDay", healingTime: "MDS.Permanent" },
    { d66: [62], key: "62", lethal: true, timeLimit: "quarterDay", healingTime: "3D6" },
    { d66: [63], key: "63", lethal: true, timeLimit: "round", healingTime: "2D6" },
    { d66: [64], key: "64", lethal: true, timeLimit: "round", healingTime: "—" },
    { d66: [65], key: "65", lethal: true, timeLimit: "none", healingTime: "—" },
    { d66: [66], key: "66", lethal: true, timeLimit: "none", healingTime: "—" },
  ],

  // Mental Critical Injuries (D66, Chapter 4)
  mentalCritTable: [
    { d66: [11, 12, 13, 14, 15, 16], key: "11", lethal: false, healingTime: "D6" },
    { d66: [21], key: "21", lethal: false, healingTime: "MDS.Permanent" },
    { d66: [22, 23, 24], key: "22", lethal: false, healingTime: "D6" },
    { d66: [25, 26, 31], key: "25", lethal: false, healingTime: "D6" },
    { d66: [32, 33, 34, 35], key: "32", lethal: false, healingTime: "D6" },
    { d66: [36, 41], key: "36", lethal: false, healingTime: "2D6" },
    { d66: [42, 43], key: "42", lethal: false, healingTime: "2D6" },
    { d66: [44, 45], key: "44", lethal: false, healingTime: "3D6" },
    { d66: [46, 51], key: "46", lethal: false, healingTime: "MDS.Permanent", addsCalling: 1 },
    { d66: [52], key: "52", lethal: false, healingTime: "2D6" },
    { d66: [53, 54], key: "53", lethal: false, healingTime: "2D6" },
    { d66: [55], key: "55", lethal: false, healingTime: "3D6" },
    { d66: [56], key: "56", lethal: false, healingTime: "3D6" },
    { d66: [61, 62], key: "61", lethal: false, healingTime: "MDS.Permanent" },
    { d66: [63], key: "63", lethal: false, healingTime: "D6" },
    { d66: [64, 65], key: "64", lethal: false, healingTime: "D6" },
    { d66: [66], key: "66", lethal: true, healingTime: "—" },
  ],

  // NPC & Monster categories / sizes (Chapter 9)
  npcCategories: {
    human: "MDS.Npc.Category.human",
    beast: "MDS.Npc.Category.beast",
    horror: "MDS.Npc.Category.horror",
    undead: "MDS.Npc.Category.undead",
    entity: "MDS.Npc.Category.entity",
  },

  monsterSizes: {
    small: { label: "MDS.Npc.Size.small", conditions: 1 },
    medium: { label: "MDS.Npc.Size.medium", conditions: 2 },
    large: { label: "MDS.Npc.Size.large", conditions: 3 },
    huge: { label: "MDS.Npc.Size.huge", conditions: 4 },
    colossal: { label: "MDS.Npc.Size.colossal", conditions: 5 },
  },

  attackScales: {
    personal: "MDS.Scale.personal",
    naval: "MDS.Scale.naval",
    both: "MDS.Scale.both",
  },

  // Ship Classes (Chapter 6)
  shipClasses: {
    sloop: { label: "MDS.Ship.Class.sloop", hull: "d6", sails: "d10", cannons: "d6", cargo: 10, physicalMax: 2, combatMax: 2 },
    brigantine: { label: "MDS.Ship.Class.brigantine", hull: "d8", sails: "d8", cannons: "d8", cargo: 40, physicalMax: 3, combatMax: 3 },
    corvette: { label: "MDS.Ship.Class.corvette", hull: "d8", sails: "d8", cannons: "d10", cargo: 30, physicalMax: 3, combatMax: 3 },
    fluyt: { label: "MDS.Ship.Class.fluyt", hull: "d10", sails: "d6", cannons: "d6", cargo: 80, physicalMax: 4, combatMax: 2 },
    lightGalleon: { label: "MDS.Ship.Class.lightGalleon", hull: "d10", sails: "d8", cannons: "d10", cargo: 60, physicalMax: 4, combatMax: 4 },
    heavyGalleon: { label: "MDS.Ship.Class.heavyGalleon", hull: "d12", sails: "d6", cannons: "d12", cargo: 100, physicalMax: 5, combatMax: 5 },
  },

  shipPostures: {
    cautious: "MDS.Ship.Posture.cautious",
    aggressive: "MDS.Ship.Posture.aggressive",
    desperate: "MDS.Ship.Posture.desperate",
  },

  shipAmmoTypes: {
    iron: "MDS.Ship.Ammo.iron",
    chain: "MDS.Ship.Ammo.chain",
    grapeshot: "MDS.Ship.Ammo.grapeshot",
  },

  loyaltyStates: {
    0: "MDS.Ship.Loyalty.0",
    1: "MDS.Ship.Loyalty.1",
    2: "MDS.Ship.Loyalty.2",
    3: "MDS.Ship.Loyalty.3",
    4: "MDS.Ship.Loyalty.4",
    5: "MDS.Ship.Loyalty.5",
  },

  difficulties: [
    { key: "easy", label: "MDS.Difficulty.easy", mod: 1 },
    { key: "average", label: "MDS.Difficulty.average", mod: 0 },
    { key: "demanding", label: "MDS.Difficulty.demanding", mod: -1 },
    { key: "hard", label: "MDS.Difficulty.hard", mod: -2 },
    { key: "formidable", label: "MDS.Difficulty.formidable", mod: -3 },
  ],
};

export function stepDieSize(stepKey) {
  return MDS_CONFIG.stepDice[stepKey]?.faces ?? 0;
}

export function stepDieBy(dieKey, delta) {
  const ladder = MDS_CONFIG.stepOrder;
  const idx = Math.max(0, ladder.indexOf(dieKey || "none"));
  const nextIdx = Math.min(ladder.length - 1, Math.max(0, idx + delta));
  return ladder[nextIdx];
}

/**
 * Calling Die table (Chapter 5):
 * 0 -> none, 1-5 -> d6, 6-7 -> d8, 8-9 -> d10, 10 -> d12
 */
export function getCallingDie(calling) {
  const n = Number(calling) || 0;
  if (n <= 0) return "none";
  if (n <= 5) return "d6";
  if (n <= 7) return "d8";
  if (n <= 9) return "d10";
  return "d12";
}

/**
 * Calling State label key (Chapter 5)
 */
export function getCallingStateKey(calling) {
  const n = Number(calling) || 0;
  if (n <= 0) return "MDS.Calling.State.0";
  if (n <= 5) return "MDS.Calling.State.1";
  if (n <= 7) return "MDS.Calling.State.2";
  if (n <= 9) return "MDS.Calling.State.3";
  return "MDS.Calling.State.4";
}

/**
 * Infamy Die table (Chapter 7):
 * 0 -> none, 1-3 -> d6, 4-6 -> d8, 7-9 -> d10, 10+ -> d12
 */
export function getInfamyDie(infamy) {
  const n = Number(infamy) || 0;
  if (n <= 0) return "none";
  if (n <= 3) return "d6";
  if (n <= 6) return "d8";
  if (n <= 9) return "d10";
  return "d12";
}

/**
 * Computes highest (most severe) penalty among an array of condition slots.
 */
export function computeConditionTrack(slots = [], maxSlots = 3) {
  let count = 0;
  let worstPenalty = 0;
  for (let i = 0; i < Math.min(slots.length, maxSlots); i++) {
    const slot = slots[i];
    if (!slot) continue;
    const sev = slot.severity && slot.severity !== "none" ? slot.severity : (slot.text?.trim() ? "mild" : "none");
    if (sev !== "none") {
      count++;
      const pen = MDS_CONFIG.conditionSeverities[sev]?.penalty ?? 0;
      if (pen < worstPenalty) worstPenalty = pen;
    }
  }
  return {
    count,
    penalty: worstPenalty,
    full: count >= maxSlots,
  };
}

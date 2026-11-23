import { YearZeroRoll } from "../../lib/yzur.js";
import { MDS_CONFIG, getCallingDie } from "../config.mjs";

const STEP_LADDER = MDS_CONFIG.stepOrder;

const V13_TO_V14_MODES = {
  publicroll: "public",
  gmroll: "gm",
  blindroll: "blind",
  selfroll: "self",
};

const V14_TO_V13_MODES = {
  public: "publicroll",
  gm: "gmroll",
  blind: "blindroll",
  self: "selfroll",
};

export function isFoundryV14() {
  return (game.release?.generation ?? 13) >= 14;
}

export function getDefaultRollMode() {
  if (isFoundryV14() || game.settings?.settings?.has("core.messageMode")) {
    return game.settings.get("core", "messageMode");
  }
  return game.settings.get("core", "rollMode");
}

export function normalizeRollMode(mode) {
  const raw = mode || getDefaultRollMode();
  if (isFoundryV14()) {
    return V13_TO_V14_MODES[raw] ?? raw ?? "public";
  }
  return V14_TO_V13_MODES[raw] ?? raw ?? "publicroll";
}

export function buildToMessageOptions(mode, create = true) {
  const normalized = normalizeRollMode(mode);
  if (isFoundryV14()) {
    return { messageMode: normalized, create };
  }
  return { rollMode: normalized, create };
}

export function registerDice3D(dice3d) {
  const ID = MDS_CONFIG.ID;
  dice3d.addSystem({ id: ID, name: "Mares de Sangue" }, "preferred");

  dice3d.addColorset({
    name: "MDSAttribute",
    description: "Mares de Sangue — Atributo",
    category: "Mares de Sangue",
    foreground: ["#f4e7ce"],
    background: ["#6b1414"],
    outline: "#2b0707",
    texture: "none",
  }, "preferred");

  dice3d.addColorset({
    name: "MDSSkill",
    description: "Mares de Sangue — Perícia",
    category: "Mares de Sangue",
    foreground: ["#1d140c"],
    background: ["#c9a86a"],
    outline: "#6b5328",
    texture: "none",
  }, "preferred");

  dice3d.addColorset({
    name: "MDSCalling",
    description: "Mares de Sangue — O Chamado",
    category: "Mares de Sangue",
    foreground: ["#9ef0e6"],
    background: ["#0d2229"],
    outline: "#040b0e",
    texture: "none",
  }, "preferred");
}

/**
 * Pure Step Dice calculation for Mares de Sangue (Chapter 3):
 * - Rolls Attribute die + optional Skill die.
 * - Positive steps upgrade the lower die first (or add D6 skill die if unskilled), capped at D12.
 * - Negative steps downgrade the higher die first; dropping below a single D6 returns autoFail=true.
 */
export function computeStepDice(attrDie, skillDie = "none", totalMod = 0) {
  const validAttr = STEP_LADDER.includes(attrDie) && attrDie !== "none" ? attrDie : "d6";
  const validSkill = STEP_LADDER.includes(skillDie) ? skillDie : "none";

  const dice = [
    { step: Math.max(1, STEP_LADDER.indexOf(validAttr)), flavor: "Attribute" },
  ];
  if (validSkill !== "none") {
    dice.push({ step: STEP_LADDER.indexOf(validSkill), flavor: "Skill" });
  }

  let mod = Number(totalMod) || 0;
  let autoFail = false;

  while (mod > 0) {
    if (dice.length === 1) {
      if (dice[0].step < 4) {
        dice[0].step++;
      } else {
        break;
      }
      mod--;
      continue;
    }
    let lowestIdx = 0;
    for (let i = 1; i < dice.length; i++) {
      if (dice[i].step < dice[lowestIdx].step) lowestIdx = i;
    }
    if (dice[lowestIdx].step >= 4) break;
    dice[lowestIdx].step++;
    mod--;
  }

  while (mod < 0) {
    if (dice.length === 1) {
      if (dice[0].step > 1) {
        dice[0].step--;
      } else {
        autoFail = true;
        break;
      }
      mod++;
      continue;
    }
    let highestIdx = 0;
    for (let i = 1; i < dice.length; i++) {
      if (dice[i].step >= dice[highestIdx].step) highestIdx = i;
    }
    if (dice[highestIdx].step > 1) {
      dice[highestIdx].step--;
    } else {
      dice.pop();
    }
    mod++;
  }

  return {
    autoFail,
    dice: autoFail
      ? []
      : dice.map(d => ({
          die: STEP_LADDER[d.step],
          deno: String(MDS_CONFIG.stepDice[STEP_LADDER[d.step]].faces),
          flavor: d.flavor,
        })),
  };
}

/**
 * Counts how many dice in a YearZeroRoll currently show a 1 (Bane).
 */
function countAnyOnes(roll) {
  let ones = 0;
  for (const term of roll.terms ?? []) {
    if (!term.results) continue;
    for (const r of term.results) {
      if (r.active !== false && Number(r.result) === 1) ones++;
    }
  }
  return ones;
}

/**
 * Executes a Mares de Sangue Step Dice roll and posts to Chat.
 * Official rule: failing an Attribute roll (0 successes) grants +1 Willpower (PV).
 */
export async function executeMdsRoll(actor, {
  attribute = "",
  attrDie = "d8",
  skill = null,
  skillDie = "none",
  gear = null,
  gearBonus = 0,
  modifier = 0,
  maxPush = 1,
  flavor = "",
  description = "",
  damage = 0,
  usePride = false,
  rollMode = null,
  rollType = "skill",
  breakdown = [],
} = {}) {
  const totalStepMod = (Number(modifier) || 0) + (Number(gearBonus) || 0);
  const computed = computeStepDice(attrDie, skillDie, totalStepMod);

  if (computed.autoFail || !computed.dice.length) {
    const content = await foundry.applications.handlebars.renderTemplate(
      `systems/${MDS_CONFIG.ID}/templates/chat/table-result.hbs`,
      {
        tableTitle: flavor || game.i18n.localize("MDS.RollDialog.Title"),
        rollLabel: game.i18n.localize("MDS.Chat.AutoFailLabel"),
        resultTitle: game.i18n.localize("MDS.Chat.AutoFailTitle"),
        resultText: game.i18n.localize("MDS.Chat.AutoFailBody"),
        isAlert: true,
      }
    );
    // Failing an Attribute test still grants +1 PV
    if (actor?.type === "character" && attribute && game.settings.get(MDS_CONFIG.ID, "autoWillpowerOnFail")) {
      const nextWp = Math.min(actor.system.willpower.max, (actor.system.willpower.value || 0) + 1);
      await actor.update({ "system.willpower.value": nextWp });
    }
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
    });
  }

  const formulaParts = computed.dice.map(d => `1d${d.deno}[${d.flavor}]`);

  const rollOptions = {
    game: "mds",
    maxPush,
    damage: damage > 0 ? damage : undefined,
    breakdown,
    description,
    rollMode: normalizeRollMode(rollMode),
    rollType,
    attribute,
    prideBonus: usePride ? 1 : 0,
    wpGainedOnFail: 0,
  };

  const roll = await new YearZeroRoll(formulaParts.join(" + "), { maxPush }, rollOptions).evaluate();
  const totalSuccesses = (roll.successCount || 0) + (usePride ? 1 : 0);

  // Pride grants +1 automatic success and marks Pride as used for this session
  if (usePride && actor?.system?.traits?.pride) {
    await actor.update({ "system.traits.pride.used": true });
  }

  // Single-shot flintlock weapons become unloaded after firing
  if (gear?.type === "weapon" && gear.system.singleShot && gear.system.loaded) {
    await gear.update({ "system.loaded": false });
  }

  // Mark skill XP checkbox automatically on success
  if (skill && totalSuccesses > 0 && !skill.system.xpMarked) {
    await skill.update({ "system.xpMarked": true });
  }

  // Official Mares de Sangue rule: failing an Attribute roll (0 successes) grants +1 PV
  const isAttributeTest = Boolean(attribute) && ["skill", "attack", "attribute"].includes(rollType);
  if (
    isAttributeTest &&
    totalSuccesses === 0 &&
    actor?.type === "character" &&
    actor.system.willpower &&
    game.settings.get(MDS_CONFIG.ID, "autoWillpowerOnFail")
  ) {
    const curWp = Number(actor.system.willpower.value) || 0;
    const maxWp = Number(actor.system.willpower.max) || 0;
    if (curWp < maxWp) {
      await actor.update({ "system.willpower.value": curWp + 1 });
      roll.options.wpGainedOnFail = 1;
    }
  }

  const speaker = ChatMessage.getSpeaker({ actor });
  const message = await roll.toMessage(
    {
      speaker,
      flavor,
      flags: {
        [MDS_CONFIG.ID]: {
          actorUuid: actor?.uuid ?? "",
          attribute,
          skillUuid: skill?.uuid ?? "",
          gearUuid: gear?.uuid ?? "",
          rollType,
          prideBonus: usePride ? 1 : 0,
        },
      },
    },
    buildToMessageOptions(rollOptions.rollMode)
  );

  await game.dice3d?.waitFor3DAnimationByMessageID(message.id);
  return message;
}

/**
 * Push Roll (Official Mares de Sangue Rules):
 * 1. ALWAYS inflicts 1 Condition on the Attribute's track (Physical for STR/AGI, Mental for WIT/EMP).
 * 2. If ANY die shows 1 (Bane) after pushing, grants EXACTLY +1 Calling (max 1 per roll, regardless of how many 1s).
 */
export async function pushMdsRoll(event) {
  const messageId = event.target.closest("[data-message-id]")?.dataset?.messageId;
  const message = game.messages.get(messageId);
  if (!message || !message.rolls?.length) return null;

  const flags = message.flags?.[MDS_CONFIG.ID] ?? {};
  const actor = flags.actorUuid ? await fromUuid(flags.actorUuid) : game.actors.get(message.speaker?.actor);
  const gear = flags.gearUuid ? await fromUuid(flags.gearUuid) : null;
  const attribute = flags.attribute || message.rolls[0].options?.attribute || "strength";

  const roll = message.rolls[0].duplicate();

  await message.delete();
  await roll.push();

  const anyOnes = countAnyOnes(roll);
  const pushSummary = [];
  let triggeredBroken = false;
  let brokenTrack = "";
  let callingAtMax = false;

  if (actor && ["character", "npc"].includes(actor.type)) {
    // 1. Always apply 1 Condition on the Attribute's track
    const isPhysical = MDS_CONFIG.physicalAttributes.includes(attribute);
    const track = isPhysical ? "physical" : "mental";
    const condResult = await actor.addCondition(track, {
      text: game.i18n.format("MDS.Condition.PushedRollText", {
        attr: game.i18n.localize(MDS_CONFIG.attributes[attribute] || attribute),
      }),
      severity: "mild",
    });

    if (condResult.broken) {
      triggeredBroken = true;
      brokenTrack = track;
      pushSummary.push(
        isPhysical
          ? game.i18n.localize("MDS.Chat.BrokenPhysical")
          : game.i18n.localize("MDS.Chat.BrokenMental")
      );
    } else {
      pushSummary.push(
        isPhysical
          ? game.i18n.localize("MDS.Chat.PlusPhysicalCondition")
          : game.i18n.localize("MDS.Chat.PlusMentalCondition")
      );
    }

    // 2. If ANY die shows 1 (Bane), gain EXACTLY +1 Calling (max 1 per pushed roll)
    if (
      anyOnes > 0 &&
      actor.type === "character" &&
      actor.system.calling &&
      game.settings.get(MDS_CONFIG.ID, "autoCallingOnPushBane")
    ) {
      const nextCalling = Math.min(actor.system.calling.max || 10, (actor.system.calling.value || 0) + 1);
      await actor.update({ "system.calling.value": nextCalling });
      pushSummary.push(`+1 ${game.i18n.localize("MDS.Calling.Label")} (${nextCalling}/10)`);
      if (nextCalling >= 10) callingAtMax = true;
    }
  }

  // Degrading Weapon Bonus if weapon used and bane rolled
  if (gear?.type === "weapon" && anyOnes > 0 && gear.system.bonus > 0) {
    const nextBonus = Math.max(0, gear.system.bonus - 1);
    await gear.update({ "system.bonus": nextBonus });
    pushSummary.push(`${gear.name}: −1 ${game.i18n.localize("MDS.Bonus")}`);
  }

  roll.options.pushCostSummary = pushSummary.join(" | ");
  roll.options.triggeredBroken = triggeredBroken;
  roll.options.brokenTrack = brokenTrack;
  roll.options.callingAtMax = callingAtMax;

  const newMessage = await roll.toMessage(
    {
      speaker: message.speaker,
      flavor: message.flavor,
      flags: message.flags,
    },
    buildToMessageOptions(roll.options.rollMode)
  );
  await game.dice3d?.waitFor3DAnimationByMessageID(newMessage.id);
  return newMessage;
}

export async function acceptMdsRoll(event) {
  const messageId = event.target.closest("[data-message-id]")?.dataset?.messageId;
  const message = game.messages.get(messageId);
  if (!message || !message.rolls?.length) return null;

  const roll = message.rolls[0].duplicate();
  roll.maxPush = 0;
  await message.update({ rolls: [roll.toJSON()] });
  return message;
}

/**
 * Supply Roll (Chapter 2): Roll D6s equal to current Supply Rating (1-6). Each 1 reduces rating by 1.
 */
export async function rollSupply(actor, consumableKey) {
  if (!actor?.system?.consumables) return null;
  const current = Number(actor.system.consumables[consumableKey]) || 0;
  const label = game.i18n.localize(`MDS.Consumable.${consumableKey}`);

  if (current <= 0) {
    ui.notifications.warn(game.i18n.format("MDS.Notifications.SupplyDepleted", { name: label }));
    return null;
  }

  const diceToRoll = Math.min(6, current);
  const roll = await new YearZeroRoll(`${diceToRoll}db`, { maxPush: 0 }, {
    game: "mds",
    maxPush: 0,
    rollType: "supply",
  }).evaluate();

  const lost = countAnyOnes(roll);
  const nextVal = Math.max(0, current - lost);
  if (lost > 0) {
    await actor.update({ [`system.consumables.${consumableKey}`]: nextVal });
  }

  roll.options.supplyBefore = current;
  roll.options.supplyLost = lost;
  roll.options.supplyAfter = nextVal;

  return roll.toMessage(
    {
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${game.i18n.localize("MDS.SupplyRoll")}: ${label} (${current} → ${nextVal})`,
    },
    buildToMessageOptions(getDefaultRollMode())
  );
}

/**
 * Calling Test (Chapter 5): Roll the current Calling Die (D6..D12).
 * 0 successes: resist; 1 success: sea controls you for 1 scene; 2+ successes: permanently lost (Afogado).
 */
export async function rollCallingTest(actor) {
  const callingVal = Number(actor?.system?.calling?.value) || 0;
  const die = getCallingDie(callingVal);
  if (die === "none") {
    ui.notifications.info(game.i18n.localize("MDS.Notifications.NoCalling"));
    return null;
  }

  const deno = MDS_CONFIG.stepDice[die].faces;
  const roll = await new YearZeroRoll(`1d${deno}[Calling]`, { maxPush: 0 }, {
    game: "mds",
    maxPush: 0,
    rollType: "calling",
  }).evaluate();

  const successes = roll.successCount || 0;
  let outcomeKey = "MDS.Calling.Test.Resist";
  if (successes === 1) outcomeKey = "MDS.Calling.Test.SceneControl";
  else if (successes >= 2) outcomeKey = "MDS.Calling.Test.Lost";

  const content = await foundry.applications.handlebars.renderTemplate(
    `systems/${MDS_CONFIG.ID}/templates/chat/table-result.hbs`,
    {
      tableTitle: game.i18n.localize("MDS.Calling.TestTitle"),
      rollLabel: `${game.i18n.localize("MDS.Calling.Label")} ${callingVal}/10 (${die.toUpperCase()}) → ${successes} ${game.i18n.localize("MDS.Chat.Successes")}`,
      resultTitle: game.i18n.localize(`${outcomeKey}.title`),
      resultText: game.i18n.localize(`${outcomeKey}.body`),
      isAlert: successes > 0,
      rollHtml: await roll.render(),
    }
  );

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
  });
}

/**
 * Magic Casting Roll (Chapter 5): Vodou, Catholic Faith, or Corruption of the Depths.
 */
export async function executeMagicRoll(actor, magic, {
  rankDie = "d6",
  modifier = 0,
} = {}) {
  const tradition = magic.system.tradition;
  const wpCost = Number(magic.system.willpowerCost) || 0;
  const callingCost = Number(magic.system.callingCost) || 0;

  // Vodou & Faith spend Willpower (PV)
  if (tradition !== "corruption" && wpCost > 0 && actor?.type === "character" && actor.system.willpower) {
    if (actor.system.willpower.value < wpCost) {
      ui.notifications.warn(game.i18n.localize("MDS.Notifications.NotEnoughWillpower"));
      return null;
    }
    await actor.update({ "system.willpower.value": actor.system.willpower.value - wpCost });
  }

  // Corruption increases Calling automatically (no PV cost)
  let nextCalling = actor?.system?.calling?.value ?? 0;
  if (tradition === "corruption" && actor?.type === "character" && actor.system.calling) {
    const addCalling = Math.max(1, callingCost);
    nextCalling = Math.min(actor.system.calling.max || 10, nextCalling + addCalling);
    await actor.update({ "system.calling.value": nextCalling });
  }

  let roll = null;
  let successes = 0;
  let hasMishap = false;
  let needsCallingTest = Boolean(magic.system.requiresCallingTest) || nextCalling >= 10;

  if (tradition === "vodou" || tradition === "faith") {
    const empDie = actor?.system?.attributes?.empathy?.die || "d8";
    const faithPenalty = tradition === "faith" ? -(actor?.system?.violatedCommandmentsCount || 0) : 0;
    const totalMod = (Number(modifier) || 0) + faithPenalty;
    const computed = computeStepDice(empDie, rankDie, totalMod);
    if (!computed.autoFail && computed.dice.length) {
      const formula = computed.dice.map(d => `1d${d.deno}[${d.flavor}]`).join(" + ");
      roll = await new YearZeroRoll(formula, { maxPush: 0 }, {
        game: "mds",
        maxPush: 0,
        rollType: "magic",
      }).evaluate();
      successes = roll.successCount || 0;
      if (tradition === "vodou" && countAnyOnes(roll) > 0) {
        hasMishap = true;
      }
    }
  } else if (tradition === "corruption") {
    const cDie = getCallingDie(nextCalling);
    if (cDie !== "none") {
      const deno = MDS_CONFIG.stepDice[cDie].faces;
      roll = await new YearZeroRoll(`1d${deno}[Calling]`, { maxPush: 0 }, {
        game: "mds",
        maxPush: 0,
        rollType: "magic",
      }).evaluate();
      successes = roll.successCount || 0;
    }
  }

  const content = await foundry.applications.handlebars.renderTemplate(
    `systems/${MDS_CONFIG.ID}/templates/chat/magic-cast.hbs`,
    {
      actor,
      magic,
      tradition,
      traditionLabel: game.i18n.localize(MDS_CONFIG.magicTraditions[tradition]),
      wpCost: tradition === "corruption" ? 0 : wpCost,
      callingAdded: tradition === "corruption" ? Math.max(1, callingCost) : 0,
      nextCalling,
      successes,
      hasMishap,
      needsCallingTest,
      rollHtml: roll ? await roll.render() : null,
    }
  );

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${game.i18n.localize("MDS.Magic.Cast")}: ${magic.name}`,
    content,
    rolls: roll ? [roll] : [],
  });
}

/**
 * Vodou Mishap Roll (D6, Chapter 5)
 */
export async function rollVodouMishap(actor) {
  const d6 = Math.floor(Math.random() * 6) + 1;
  const entry = MDS_CONFIG.vodouMishapTable.find(e => e.roll === d6) || MDS_CONFIG.vodouMishapTable[0];

  const content = await foundry.applications.handlebars.renderTemplate(
    `systems/${MDS_CONFIG.ID}/templates/chat/table-result.hbs`,
    {
      tableTitle: game.i18n.localize("MDS.Magic.VodouMishap"),
      rollLabel: `D6 = ${d6}`,
      resultTitle: `${game.i18n.localize("MDS.Magic.Mishap")} #${d6}`,
      resultText: game.i18n.localize(entry.effectKey),
      isAlert: true,
    }
  );

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
  });
}

/**
 * Critical Injury Table Roll (D66 Physical or Mental, Chapter 4)
 */
export async function rollCriticalTable(actor, category = "physical", addToActor = true) {
  const tens = Math.floor(Math.random() * 6) + 1;
  const ones = Math.floor(Math.random() * 6) + 1;
  const d66 = tens * 10 + ones;

  const isMental = category === "mental";
  const table = isMental ? MDS_CONFIG.mentalCritTable : MDS_CONFIG.physicalCritTable;
  const entry = table.find(e => e.d66.includes(d66)) || table[0];
  const tablePrefix = isMental ? "MDS.Tables.MentalCrit" : "MDS.Tables.PhysicalCrit";
  const entryName = game.i18n.localize(`${tablePrefix}.${entry.key}.name`);
  const entryEffects = game.i18n.localize(`${tablePrefix}.${entry.key}.effects`);
  const healingTime = entry.healingTime?.startsWith("MDS.")
    ? game.i18n.localize(entry.healingTime)
    : (entry.healingTime || "—");
  const timeLimitLabel = game.i18n.localize(`MDS.TimeLimit.${entry.timeLimit || "none"}`);

  if (addToActor && actor && ["character", "npc"].includes(actor.type)) {
    await actor.createEmbeddedDocuments("Item", [
      {
        name: `${entryName} (D66: ${d66})`,
        type: "critical",
        img: `systems/${MDS_CONFIG.ID}/assets/icons/critical.svg`,
        system: {
          category,
          d66: String(d66),
          lethal: Boolean(entry.lethal),
          timeLimit: entry.timeLimit || "none",
          healingTime,
          effectsSummary: entryEffects,
          description: `<p><strong>D66 (${d66}) — ${entryName}:</strong> ${entryEffects}</p>`,
        },
      },
    ]);

    if (entry.addsCalling && actor.type === "character" && actor.system.calling) {
      const nextCalling = Math.min(actor.system.calling.max || 10, (actor.system.calling.value || 0) + entry.addsCalling);
      await actor.update({ "system.calling.value": nextCalling });
    }
  }

  const content = await foundry.applications.handlebars.renderTemplate(
    `systems/${MDS_CONFIG.ID}/templates/chat/table-result.hbs`,
    {
      tableTitle: isMental
        ? game.i18n.localize("MDS.Critical.MentalTable")
        : game.i18n.localize("MDS.Critical.PhysicalTable"),
      rollLabel: `D66 = ${d66}`,
      resultTitle: entryName,
      resultText: entryEffects,
      metaLine: entry.lethal
        ? `${game.i18n.localize("MDS.Critical.Lethal")}: ${game.i18n.localize("MDS.Yes")} (${timeLimitLabel}) | ${game.i18n.localize("MDS.Critical.HealingTime")}: ${healingTime}`
        : `${game.i18n.localize("MDS.Critical.HealingTime")}: ${healingTime}`,
      isAlert: true,
    }
  );

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
  });
}

/**
 * Apply attack damage from a chat card to controlled tokens as Conditions (Chapter 4).
 * 1 damage = Mild, 2-3 = Moderate, 4+ = Severe.
 */
export async function applyTargetDamage(event) {
  const messageId = event.target.closest("[data-message-id]")?.dataset?.messageId;
  const message = game.messages.get(messageId);
  const roll = message?.rolls?.[0];
  if (!roll || !roll.attackDamage) return;

  const controlled = canvas?.tokens?.controlled ?? [];
  if (!controlled.length) {
    ui.notifications.warn(game.i18n.localize("MDS.Notifications.SelectTargetToken"));
    return;
  }

  const dmg = Number(roll.attackDamage) || 0;
  const severity = dmg >= 4 ? "severe" : dmg >= 2 ? "moderate" : "mild";

  for (const token of controlled) {
    const targetActor = token.actor;
    if (!targetActor || typeof targetActor.addCondition !== "function") continue;
    await targetActor.addCondition("physical", {
      text: `${message.flavor || game.i18n.localize("MDS.Damage")} (${dmg})`,
      severity,
    });
  }
  ui.notifications.info(game.i18n.format("MDS.Notifications.AppliedDamage", { dmg }));
}

/**
 * Solo Mode: Oracle of the Seas (Chapter 10)
 * Question Die (d6..d12) vs Chaos Die (d6..d12).
 */
export async function rollOracle(questionDie = "d8", chaosDie = "d6") {
  const qFaces = MDS_CONFIG.stepDice[questionDie]?.faces || 8;
  const cFaces = MDS_CONFIG.stepDice[chaosDie]?.faces || 6;
  const qRoll = await new Roll(`1d${qFaces}`).evaluate();
  const cRoll = await new Roll(`1d${cFaces}`).evaluate();
  const qVal = qRoll.total;
  const cVal = cRoll.total;
  const diff = qVal - cVal;

  let resultKey = "MDS.Oracle.Yes";
  if (diff >= 3) resultKey = "MDS.Oracle.YesAnd";
  else if (diff >= 1) resultKey = "MDS.Oracle.Yes";
  else if (diff === 0) resultKey = qVal % 2 === 0 ? "MDS.Oracle.YesBut" : "MDS.Oracle.NoBut";
  else if (diff >= -2) resultKey = "MDS.Oracle.No";
  else resultKey = "MDS.Oracle.NoAnd";

  const content = await foundry.applications.handlebars.renderTemplate(
    `systems/${MDS_CONFIG.ID}/templates/chat/table-result.hbs`,
    {
      tableTitle: game.i18n.localize("MDS.Oracle.Title"),
      rollLabel: `${questionDie.toUpperCase()} (${qVal}) vs ${chaosDie.toUpperCase()} (${cVal})`,
      resultTitle: game.i18n.localize(`${resultKey}.title`),
      resultText: game.i18n.localize(`${resultKey}.body`),
      isAlert: diff < 0,
    }
  );

  return ChatMessage.create({ content });
}

import { MDS_CONFIG } from "./config.mjs";
import { registerSettings, registerStatusEffects } from "./settings.mjs";
import { MdsCharacterData, MdsNpcData, MdsShipData } from "./data/actors.mjs";
import {
  MdsArmorData,
  MdsCriticalData,
  MdsGearData,
  MdsMagicData,
  MdsShipModuleData,
  MdsSkillData,
  MdsSpecialtyData,
  MdsWeaponData,
} from "./data/items.mjs";
import { MdsActor } from "./documents/actor.mjs";
import { MdsItem } from "./documents/item.mjs";
import { MdsChatMessage } from "./documents/chat-message.mjs";
import { MdsChatLog } from "./applications/chat-log.mjs";
import { MdsRollDialog } from "./applications/roll-dialog.mjs";
import { MdsMagicDialog } from "./applications/magic-dialog.mjs";
import { MdsActorSheet } from "./sheets/actor-sheet.mjs";
import { MdsItemSheet } from "./sheets/item-sheet.mjs";
import { YearZeroRollManager } from "../lib/yzur.js";
import {
  executeMdsRoll,
  registerDice3D,
  rollCallingTest,
  rollCriticalTable,
  rollOracle,
  rollSupply,
  rollVodouMishap,
} from "./helpers/rolls.mjs";

globalThis.mds = {
  config: MDS_CONFIG,
  documents: { MdsActor, MdsItem, MdsChatMessage },
  applications: { MdsRollDialog, MdsMagicDialog, MdsActorSheet, MdsItemSheet },
  models: {
    MdsCharacterData,
    MdsNpcData,
    MdsShipData,
    MdsSkillData,
    MdsSpecialtyData,
    MdsWeaponData,
    MdsArmorData,
    MdsGearData,
    MdsMagicData,
    MdsCriticalData,
    MdsShipModuleData,
  },
  rolls: {
    executeMdsRoll,
    rollSupply,
    rollCallingTest,
    rollVodouMishap,
    rollCriticalTable,
    rollOracle,
  },
};

function registerHandlebarsHelpers() {
  const fallbackHelpers = {
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    gt: (a, b) => Number(a) > Number(b),
    gte: (a, b) => Number(a) >= Number(b),
    lt: (a, b) => Number(a) < Number(b),
    lte: (a, b) => Number(a) <= Number(b),
    and: (...args) => args.slice(0, -1).every(Boolean),
    or: (...args) => args.slice(0, -1).some(Boolean),
    not: a => !a,
  };
  for (const [name, fn] of Object.entries(fallbackHelpers)) {
    if (!Handlebars.helpers[name]) {
      Handlebars.registerHelper(name, fn);
    }
  }

  Handlebars.registerHelper("add", (a, b) => (Number(a) || 0) + (Number(b) || 0));
  Handlebars.registerHelper("upper", str => String(str ?? "").toUpperCase());
  Handlebars.registerHelper("stepLetter", die => MDS_CONFIG.stepDice[die]?.letter ?? "—");
  Handlebars.registerHelper("stepDieUpper", die => {
    if (!die || die === "none") return "—";
    return String(die).toUpperCase();
  });
  Handlebars.registerHelper("stepLabel", die => {
    const key = MDS_CONFIG.stepDice[die]?.label;
    return key ? game.i18n.localize(key) : "—";
  });
  Handlebars.registerHelper("range", (from, to) => {
    const arr = [];
    for (let i = Number(from); i <= Number(to); i++) arr.push(i);
    return arr;
  });
}

Hooks.once("init", () => {
  console.log("fvtt-maresdesangue | Initializing Mares de Sangue (Step Dice YZE) System");

  CONFIG.MDS = MDS_CONFIG;
  registerSettings();
  registerStatusEffects();
  registerHandlebarsHelpers();

  CONFIG.Actor.documentClass = MdsActor;
  CONFIG.Actor.dataModels = {
    character: MdsCharacterData,
    npc: MdsNpcData,
    ship: MdsShipData,
  };

  CONFIG.Item.documentClass = MdsItem;
  CONFIG.Item.dataModels = {
    skill: MdsSkillData,
    specialty: MdsSpecialtyData,
    weapon: MdsWeaponData,
    armor: MdsArmorData,
    gear: MdsGearData,
    magic: MdsMagicData,
    critical: MdsCriticalData,
    shipModule: MdsShipModuleData,
  };

  CONFIG.ChatMessage.documentClass = MdsChatMessage;
  CONFIG.ui.chat = MdsChatLog;

  const DocumentSheetConfig = foundry.applications?.apps?.DocumentSheetConfig
    ?? globalThis.DocumentSheetConfig;
  const ActorDoc = foundry.documents?.Actor ?? globalThis.Actor;
  const ItemDoc = foundry.documents?.Item ?? globalThis.Item;

  // Unregister legacy V1 core sheets on Foundry v13 (v14 no longer pre-registers core V1 sheets)
  if ((game.release?.generation ?? 13) < 14) {
    const CoreActorSheet = foundry.appv1?.sheets?.ActorSheet;
    const CoreItemSheet = foundry.appv1?.sheets?.ItemSheet;
    if (CoreActorSheet) {
      DocumentSheetConfig.unregisterSheet(ActorDoc, "core", CoreActorSheet);
    }
    if (CoreItemSheet) {
      DocumentSheetConfig.unregisterSheet(ItemDoc, "core", CoreItemSheet);
    }
  }

  DocumentSheetConfig.registerSheet(ActorDoc, MDS_CONFIG.ID, MdsActorSheet, {
    types: ["character", "npc", "ship"],
    makeDefault: true,
    label: "MDS.Sheet.Actor",
  });

  DocumentSheetConfig.registerSheet(ItemDoc, MDS_CONFIG.ID, MdsItemSheet, {
    types: ["skill", "specialty", "weapon", "armor", "gear", "magic", "critical", "shipModule"],
    makeDefault: true,
    label: "MDS.Sheet.Item",
  });

  YearZeroRollManager.register("mds", {
    Roll: {
      baseTemplate: `systems/${MDS_CONFIG.ID}/templates/dice/broll.hbs`,
      chatTemplate: `systems/${MDS_CONFIG.ID}/templates/dice/roll.hbs`,
      tooltipTemplate: `systems/${MDS_CONFIG.ID}/templates/dice/tooltip.hbs`,
      infosTemplate: `systems/${MDS_CONFIG.ID}/templates/dice/infos.hbs`,
    },
  });
});

Hooks.once("diceSoNiceReady", registerDice3D);

Hooks.once("ready", () => {
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item" && data.uuid) {
      createItemMacro(data, slot);
      return false;
    }
  });
});

async function createItemMacro(data, slot) {
  const item = await Item.fromDropData(data);
  if (!item || !item.actor) {
    return ui.notifications.warn(game.i18n.localize("MDS.Notifications.MacroOwnedItemsOnly"));
  }
  const macroName = `${item.actor.name}: ${item.name}`;
  const command = `(await fromUuid("${data.uuid}"))?.roll();`;
  let macro = game.macros.find(m => m.name === macroName && m.command === command);
  if (!macro) {
    macro = await Macro.create({
      name: macroName,
      type: "script",
      img: item.img,
      command,
      flags: { "fvtt-maresdesangue.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
}

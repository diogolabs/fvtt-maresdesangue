import { MDS_CONFIG, stepDieBy } from "../config.mjs";
import { MdsRollDialog } from "../applications/roll-dialog.mjs";
import { MdsMagicDialog } from "../applications/magic-dialog.mjs";
import {
  executeMdsRoll,
  rollCallingTest,
  rollCriticalTable,
  rollSupply,
  rollVodouMishap,
} from "../helpers/rolls.mjs";

export class MdsActor extends foundry.documents.Actor {
  get isBroken() {
    if (this.type === "ship") {
      return Boolean(this.system.conditions?.destroyed) || Boolean(this.system.conditions?.captured);
    }
    return Boolean(this.system.conditions?.physicalBroken) || Boolean(this.system.conditions?.mentalBroken);
  }

  /**
   * Returns the active Condition penalty (-1, -2, or -3) for a given attribute.
   * Physical conditions penalize Strength & Agility; Mental conditions penalize Wits & Empathy.
   * Highest active severity prevails (non-stacking).
   */
  getConditionModifier(attribute) {
    if (!attribute) return 0;
    if (MDS_CONFIG.physicalAttributes.includes(attribute)) {
      return Number(this.system.physicalPenalty) || 0;
    }
    if (MDS_CONFIG.mentalAttributes.includes(attribute)) {
      return Number(this.system.mentalPenalty) || 0;
    }
    return 0;
  }

  /**
   * Applies a Condition to the next empty slot on the given track ("physical" or "mental").
   * Returns { broken: boolean, slotIndex: number }.
   */
  async addCondition(track = "physical", { text = "", severity = "mild" } = {}) {
    if (!this.system.conditions?.[track]) return { broken: false, slotIndex: -1 };
    const maxSlots = this.type === "character"
      ? 3
      : (track === "physical" ? (this.system.physicalMax || 3) : (this.system.mentalMax || this.system.combatMax || 3));

    const slots = foundry.utils.deepClone(this.system.conditions[track]);
    while (slots.length < maxSlots) slots.push({ text: "", severity: "none" });

    const emptyIdx = slots.findIndex((s, i) => i < maxSlots && (!s.severity || s.severity === "none") && !s.text?.trim());
    if (emptyIdx === -1) {
      const brokenField = this.type === "ship"
        ? (track === "physical" ? "system.conditions.destroyed" : "system.conditions.captured")
        : (track === "physical" ? "system.conditions.physicalBroken" : "system.conditions.mentalBroken");
      await this.update({ [brokenField]: true });
      return { broken: true, slotIndex: -1 };
    }

    slots[emptyIdx] = {
      text: text || game.i18n.localize("MDS.Condition.DefaultPushedText"),
      severity: severity || "mild",
    };
    await this.update({ [`system.conditions.${track}`]: slots });
    return { broken: false, slotIndex: emptyIdx };
  }

  /**
   * Finds an owned Skill item by skillKey or localized name.
   */
  findSkill(nameOrKey) {
    if (!nameOrKey) return null;
    const norm = String(nameOrKey).trim().toLowerCase();
    const coreMatch = MDS_CONFIG.coreSkills.find(
      sk => sk.key.toLowerCase() === norm || game.i18n.localize(sk.nameKey).trim().toLowerCase() === norm
    );
    const targetKey = coreMatch?.key?.toLowerCase() ?? norm;
    return this.items.find(it =>
      it.type === "skill" &&
      (
        it.system.skillKey?.toLowerCase() === targetKey ||
        it.system.skillKey?.toLowerCase() === norm ||
        it.name.trim().toLowerCase() === norm
      )
    ) || null;
  }

  /**
   * Seeds the 12 Official Skills (Chapter 3) as owned skill Items if not already present.
   */
  async seedCoreSkills() {
    if (!["character", "npc"].includes(this.type)) return;
    const existingKeys = new Set(
      this.items
        .filter(i => i.type === "skill")
        .map(i => (i.system.skillKey || i.name).toLowerCase())
    );

    const toCreate = [];
    for (const sk of MDS_CONFIG.coreSkills) {
      const locName = game.i18n.localize(sk.nameKey);
      if (existingKeys.has(sk.key.toLowerCase()) || existingKeys.has(locName.toLowerCase())) {
        continue;
      }
      toCreate.push({
        name: locName,
        type: "skill",
        img: `systems/${MDS_CONFIG.ID}/assets/icons/skill.svg`,
        system: {
          skillKey: sk.key,
          attribute: sk.attribute,
          die: "none",
          xpMarked: false,
          description: `<p>${game.i18n.localize(`MDS.CoreSkillDesc.${sk.key}`)}</p>`,
        },
      });
    }

    if (toCreate.length > 0) {
      await this.createEmbeddedDocuments("Item", toCreate);
    }
  }

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const updates = {};
    const defaultIcons = {
      character: `systems/${MDS_CONFIG.ID}/assets/icons/character.svg`,
      npc: `systems/${MDS_CONFIG.ID}/assets/icons/npc.svg`,
      ship: `systems/${MDS_CONFIG.ID}/assets/icons/ship.svg`,
    };

    if (!data.img || data.img === "icons/svg/mystery-man.svg") {
      updates.img = defaultIcons[data.type] || "icons/svg/mystery-man.svg";
    }

    if (data.type === "character") {
      updates.prototypeToken = {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: { enabled: true },
      };
    } else if (data.type === "ship") {
      updates.prototypeToken = {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      };
    }

    let autoSeed = true;
    try {
      autoSeed = game.settings.get(MDS_CONFIG.ID, "autoSeedCoreSkills");
    } catch {
      autoSeed = true;
    }

    if (autoSeed && data.type === "character" && !data.items?.some(i => i.type === "skill")) {
      const existingItems = Array.isArray(data.items) ? [...data.items] : [];
      for (const sk of MDS_CONFIG.coreSkills) {
        existingItems.push({
          name: game.i18n.localize(sk.nameKey),
          type: "skill",
          img: `systems/${MDS_CONFIG.ID}/assets/icons/skill.svg`,
          system: {
            skillKey: sk.key,
            attribute: sk.attribute,
            die: "none",
            xpMarked: false,
            description: `<p>${game.i18n.localize(`MDS.CoreSkillDesc.${sk.key}`)}</p>`,
          },
        });
      }
      updates.items = existingItems;
    }

    this.updateSource(updates);
  }

  async openRollDialog(options = {}, event = null) {
    const dialog = new MdsRollDialog({
      actor: this,
      ...options,
    });
    return dialog.wait(event);
  }

  async openMagicDialog(magicItem) {
    const dialog = new MdsMagicDialog({
      actor: this,
      magic: magicItem,
    });
    dialog.render(true);
    return dialog;
  }

  /**
   * Armor Roll (Chapter 4): rolls armor Step Die (cannot be pushed).
   * Rolling a 1 (Bane) degrades the armor by 1 step.
   */
  async rollArmor(armorItem) {
    const die = armorItem?.system?.die || this.system.armorDie || "none";
    if (die === "none") {
      ui.notifications.warn(game.i18n.localize("MDS.Notifications.NoDiceToRoll"));
      return null;
    }
    const label = armorItem ? armorItem.name : game.i18n.localize("MDS.Armor.Label");
    const flavor = `${game.i18n.localize("MDS.Armor.Roll")}: ${label}`;
    const msg = await executeMdsRoll(this, {
      attrDie: die,
      skillDie: "none",
      maxPush: 0,
      flavor,
      rollType: "armor",
      gear: armorItem || null,
    });

    const roll = msg?.rolls?.[0];
    if (roll && roll.baneCount > 0) {
      const nextDie = stepDieBy(die, -1);
      if (armorItem) {
        await armorItem.update({ "system.die": nextDie });
      } else if (this.type === "npc") {
        await this.update({ "system.armorDie": nextDie });
      }
      ui.notifications.warn(
        game.i18n.format("MDS.Notifications.ArmorDegraded", {
          name: label,
          die: nextDie === "none" ? game.i18n.localize("MDS.Destroyed") : nextDie.toUpperCase(),
        })
      );
    }
    return msg;
  }

  /**
   * Drink 1 dose of Rum (Chapter 4):
   * - If not Intoxicated: removes 1 Mental Condition (most severe first), recovers +1 PV, sets Intoxicated.
   * - If already Intoxicated: inflicts 1 Physical Condition (Mild) instead.
   */
  async drinkRum() {
    if (this.type !== "character") return null;
    const doses = Number(this.system.consumables?.rum) || 0;
    if (doses <= 0) {
      ui.notifications.warn(game.i18n.localize("MDS.Notifications.NoRumLeft"));
      return null;
    }

    const alreadyDrunk = Boolean(this.system.conditions?.intoxicated);
    const updates = { "system.consumables.rum": doses - 1 };
    let resultText = "";

    if (alreadyDrunk) {
      await this.update(updates);
      await this.addCondition("physical", {
        text: game.i18n.localize("MDS.Rum.OverdoseCondition"),
        severity: "mild",
      });
      resultText = game.i18n.localize("MDS.Rum.OverdoseResult");
    } else {
      const mental = foundry.utils.deepClone(this.system.conditions.mental);
      const order = { severe: 3, moderate: 2, mild: 1, none: 0 };
      let bestIdx = -1;
      let bestScore = 0;
      mental.forEach((slot, i) => {
        const sc = order[slot.severity] || (slot.text?.trim() ? 1 : 0);
        if (sc > bestScore) {
          bestScore = sc;
          bestIdx = i;
        }
      });
      if (bestIdx !== -1) {
        mental[bestIdx] = { text: "", severity: "none" };
        updates["system.conditions.mental"] = mental;
      }
      const nextWp = Math.min(this.system.willpower.max, (this.system.willpower.value || 0) + 1);
      updates["system.willpower.value"] = nextWp;
      updates["system.conditions.intoxicated"] = true;
      await this.update(updates);
      resultText = game.i18n.localize("MDS.Rum.DrinkResult");
    }

    const content = await foundry.applications.handlebars.renderTemplate(
      `systems/${MDS_CONFIG.ID}/templates/chat/table-result.hbs`,
      {
        tableTitle: game.i18n.localize("MDS.Rum.Title"),
        rollLabel: `${game.i18n.localize("MDS.Rum.Remaining")}: ${doses - 1}`,
        resultTitle: alreadyDrunk
          ? game.i18n.localize("MDS.Rum.OverdoseTitle")
          : game.i18n.localize("MDS.Rum.DrinkTitle"),
        resultText,
        isAlert: alreadyDrunk,
      }
    );
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content,
    });
  }

  /**
   * Monstrous Attack Roll (Chapter 9): rolls D6 on NPC's monstrousAttacks table or uses a specific index.
   */
  async rollMonstrousAttack(index = null) {
    if (this.type !== "npc") return null;
    const table = this.system.monstrousAttacks ?? [];
    const rollIdx = index !== null ? Number(index) : Math.floor(Math.random() * 6);
    const entry = table[rollIdx] || { name: `#${rollIdx + 1}`, scale: "personal", die: "d10", damage: 1, effect: "" };
    const title = entry.name?.trim() || `${game.i18n.localize("MDS.Npc.MonstrousAttack")} #${rollIdx + 1}`;
    const scaleLabel = game.i18n.localize(MDS_CONFIG.attackScales[entry.scale] || "MDS.Scale.personal");

    if (!entry.die || entry.die === "none") {
      const content = await foundry.applications.handlebars.renderTemplate(
        `systems/${MDS_CONFIG.ID}/templates/chat/table-result.hbs`,
        {
          tableTitle: `${this.name} — ${game.i18n.localize("MDS.Npc.MonstrousAttack")} (D6: ${rollIdx + 1})`,
          rollLabel: scaleLabel,
          resultTitle: title,
          resultText: entry.effect || "—",
          isAlert: true,
        }
      );
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content,
      });
    }

    return executeMdsRoll(this, {
      attrDie: entry.die,
      skillDie: "none",
      maxPush: 0,
      damage: Number(entry.damage) || 0,
      flavor: `${title} (D6: ${rollIdx + 1} • ${scaleLabel})`,
      description: entry.effect ? `<p>${entry.effect}</p>` : "",
      rollType: "attack",
    });
  }

  async rollSupply(consumableKey) {
    return rollSupply(this, consumableKey);
  }

  async rollCallingTest() {
    return rollCallingTest(this);
  }

  async rollVodouMishap() {
    return rollVodouMishap(this);
  }

  async rollCritical(category = "physical") {
    return rollCriticalTable(this, category, true);
  }
}

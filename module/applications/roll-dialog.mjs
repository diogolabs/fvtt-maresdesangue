import { MDS_CONFIG } from "../config.mjs";
import {
  computeStepDice,
  executeMdsRoll,
  getDefaultRollMode,
  normalizeRollMode,
} from "../helpers/rolls.mjs";

const { HandlebarsApplicationMixin, ApplicationV2, DialogV2 } = foundry.applications.api;

export class MdsRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({
    actor,
    attribute = "strength",
    skill = null,
    gear = null,
    specialty = null,
    modifier = 0,
    maxPush = undefined,
    customTitle = "",
  } = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.attribute = attribute || skill?.system?.attribute || "strength";
    this.skillId = skill?.id || "";
    this.gearId = gear?.id || "";
    this.specialtyId = specialty?.id || "";
    this.difficultyMod = 0;
    this.customMod = Number(modifier) || 0;
    this.aimedShot = false;
    this.usePride = false;
    this.passiveRoll = maxPush === 0;
    this.overrideMaxPush = maxPush;
    this.customTitle = customTitle;

    this.options.window.title = customTitle || `${actor.name} — ${game.i18n.localize("MDS.RollDialog.Title")}`;
  }

  static DEFAULT_OPTIONS = {
    classes: ["mds", "mds-dialog", "mds-roll-dialog"],
    position: { width: 460 },
    window: {
      title: "MDS.RollDialog.Title",
      icon: "fa-solid fa-dice-d20",
      resizable: false,
    },
    tag: "form",
    form: {
      handler: MdsRollDialog.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    actions: {
      adjustMod: MdsRollDialog.#onAdjustMod,
    },
  };

  static PARTS = {
    form: {
      template: `systems/${MDS_CONFIG.ID}/templates/dialog/roller.hbs`,
    },
  };

  get selectedSkill() {
    return this.actor.items.get(this.skillId) || null;
  }

  get selectedGear() {
    return this.actor.items.get(this.gearId) || null;
  }

  get selectedSpecialty() {
    return this.actor.items.get(this.specialtyId) || null;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("select, input[type='number'], input[type='checkbox']").forEach(el => {
      el.addEventListener("change", ev => this.#onFieldChange(ev));
    });
  }

  #onFieldChange(event) {
    const target = event.currentTarget;
    const name = target.name;
    if (!name) return;

    if (name === "attribute") this.attribute = target.value;
    else if (name === "skillId") {
      this.skillId = target.value;
      const sk = this.selectedSkill;
      if (sk?.system?.attribute) this.attribute = sk.system.attribute;
    } else if (name === "gearId") this.gearId = target.value;
    else if (name === "specialtyId") this.specialtyId = target.value;
    else if (name === "difficultyMod") this.difficultyMod = Number(target.value) || 0;
    else if (name === "customMod") this.customMod = Number(target.value) || 0;
    else if (name === "aimedShot") this.aimedShot = target.checked;
    else if (name === "usePride") this.usePride = target.checked;
    else if (name === "passiveRoll") this.passiveRoll = target.checked;

    this.render();
  }

  static #onAdjustMod(event, target) {
    const delta = Number(target.dataset.delta) || 0;
    this.customMod += delta;
    this.render();
  }

  async _prepareContext() {
    const actor = this.actor;
    const skill = this.selectedSkill;
    const gear = this.selectedGear;
    const specialty = this.selectedSpecialty;

    const attrData = actor.system.attributes?.[this.attribute] ?? { die: "d8", mod: 0 };
    const attrDie = attrData.die || "d8";
    const attrMod = Number(attrData.mod) || 0;

    const skillDie = skill ? (skill.system.die || "none") : "none";
    const gearBonus = gear ? (Number(gear.system.bonus) || 0) : 0;
    const specialtyMod = specialty ? (Number(specialty.system.modifier) || 0) : 0;
    const conditionMod = actor.getConditionModifier(this.attribute);

    // Overloaded penalty: -1 step on Mover (Mobility) rolls (Chapter 2)
    const mobilityLoc = game.i18n.localize("MDS.CoreSkill.mobility").toLowerCase();
    const isMobility = skill && (
      skill.system.skillKey === "mobility" ||
      skill.name.toLowerCase() === "mobility" ||
      skill.name.toLowerCase() === mobilityLoc
    );
    const encMod = (isMobility && actor.system.encumbrance?.overloaded && game.settings.get(MDS_CONFIG.ID, "enableEncumbrance"))
      ? -1
      : 0;

    const aimMod = this.aimedShot ? 1 : 0;
    const totalModifier = attrMod + this.difficultyMod + this.customMod + specialtyMod + conditionMod + encMod + aimMod;

    const computed = computeStepDice(attrDie, skillDie, totalModifier + gearBonus);
    const flavorLabels = {
      Attribute: game.i18n.localize("MDS.Attribute.Label"),
      Skill: game.i18n.localize("TYPES.Item.skill"),
    };
    const previewText = computed.autoFail
      ? game.i18n.localize("MDS.Chat.AutoFailTitle")
      : computed.dice.map(d => `${d.die.toUpperCase()} (${flavorLabels[d.flavor] ?? d.flavor})`).join(" + ");

    const skills = actor.items.filter(i => i.type === "skill").sort((a, b) => a.name.localeCompare(b.name));
    const gears = actor.items
      .filter(i => ["weapon", "gear"].includes(i.type) && i.system.carried !== false)
      .sort((a, b) => a.name.localeCompare(b.name));
    const specialties = actor.items.filter(i => i.type === "specialty").sort((a, b) => a.name.localeCompare(b.name));
    const canUsePride = Boolean(actor.system.traits?.pride?.text) && !actor.system.traits.pride.used;

    return {
      actor,
      config: MDS_CONFIG,
      attribute: this.attribute,
      attrDie,
      skillId: this.skillId,
      skill,
      skillDie,
      gearId: this.gearId,
      gear,
      gearBonus,
      specialtyId: this.specialtyId,
      specialty,
      specialtyMod,
      conditionMod,
      encMod,
      difficultyMod: this.difficultyMod,
      customMod: this.customMod,
      aimedShot: this.aimedShot,
      totalModifier,
      canUsePride,
      usePride: this.usePride,
      passiveRoll: this.passiveRoll,
      autoFail: computed.autoFail,
      previewText,
      skills,
      gears,
      specialties,
    };
  }

  static async #onSubmit(event, form, formData) {
    const rollMode = normalizeRollMode(event.submitter?.dataset?.rollMode || getDefaultRollMode());
    await this._performRoll(rollMode);
  }

  async _performRoll(rollMode) {
    if (this.actor.isBroken) {
      const proceed = await DialogV2.confirm({
        window: {
          title: this.actor.name,
          icon: "fa-solid fa-skull",
        },
        content: `<p>${game.i18n.format("MDS.RollDialog.ActorBrokenConfirm", { name: this.actor.name })}</p>`,
        modal: true,
      });
      if (!proceed) return null;
    }

    const ctx = await this._prepareContext();
    const attrLabel = game.i18n.localize(MDS_CONFIG.attributes[ctx.attribute] || ctx.attribute);
    const labelParts = [];
    if (this.customTitle) {
      labelParts.push(this.customTitle);
    } else {
      if (ctx.skill) labelParts.push(`${ctx.skill.name} (${attrLabel})`);
      else labelParts.push(attrLabel);
      if (ctx.gear) labelParts.push(ctx.gear.name);
      if (ctx.specialty) labelParts.push(ctx.specialty.name);
    }

    let maxPush = 1;
    if (this.passiveRoll || this.overrideMaxPush === 0) {
      maxPush = 0;
    } else if (this.overrideMaxPush !== undefined) {
      maxPush = this.overrideMaxPush;
    } else {
      const attrPush = this.actor.system.maxPushByAttribute?.[ctx.attribute] ?? 1;
      const specPush = ctx.specialty?.system?.maxPush ?? 1;
      maxPush = Math.max(attrPush, specPush);
    }

    const breakdown = [];
    if (ctx.conditionMod !== 0) breakdown.push(`${game.i18n.localize("MDS.Conditions.Title")}: ${ctx.conditionMod}`);
    if (ctx.encMod !== 0) breakdown.push(`${game.i18n.localize("MDS.Encumbrance.Overloaded")}: ${ctx.encMod}`);
    if (ctx.gearBonus > 0) breakdown.push(`${ctx.gear.name}: +${ctx.gearBonus}`);
    if (ctx.specialtyMod !== 0) breakdown.push(`${ctx.specialty.name}: ${ctx.specialtyMod > 0 ? "+" : ""}${ctx.specialtyMod}`);
    if (ctx.difficultyMod !== 0) breakdown.push(`${game.i18n.localize("MDS.Difficulty.Label")}: ${ctx.difficultyMod > 0 ? "+" : ""}${ctx.difficultyMod}`);
    if (ctx.aimedShot) breakdown.push(`${game.i18n.localize("MDS.AimedShot")}: +1`);
    if (ctx.customMod !== 0) breakdown.push(`${game.i18n.localize("MDS.Modifier")}: ${ctx.customMod > 0 ? "+" : ""}${ctx.customMod}`);

    const damage = ctx.gear?.type === "weapon" ? Number(ctx.gear.system.damage) || 0 : 0;

    this.close();
    this.result = executeMdsRoll(this.actor, {
      attribute: ctx.attribute,
      attrDie: ctx.attrDie,
      skill: ctx.skill,
      skillDie: ctx.skillDie,
      gear: ctx.gear,
      gearBonus: ctx.gearBonus,
      modifier: ctx.totalModifier,
      maxPush,
      flavor: labelParts.join(" + "),
      damage,
      usePride: ctx.usePride,
      rollMode,
      rollType: ctx.gear?.type === "weapon" ? "attack" : (ctx.skill ? "skill" : "attribute"),
      breakdown,
    });
    return this.result;
  }

  async wait(event = null) {
    if (event?.shiftKey) {
      return this._performRoll(getDefaultRollMode());
    }
    return new Promise(resolve => {
      this.addEventListener("close", async () => {
        resolve(await this.result);
      }, { once: true });
      this.render(true);
    });
  }
}

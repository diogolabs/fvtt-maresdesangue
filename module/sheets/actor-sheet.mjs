import { MDS_CONFIG } from "../config.mjs";
import { executeMdsRoll } from "../helpers/rolls.mjs";

const { api, sheets } = foundry.applications;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

export class MdsActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["mds", "sheet", "actor"],
    position: {
      width: 980,
      height: 820,
    },
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
    },
    actions: {
      editImage: MdsActorSheet.#onEditImage,
      switchTab: MdsActorSheet.#onSwitchTab,
      rollAttribute: MdsActorSheet.#onRollAttribute,
      rollItem: MdsActorSheet.#onRollItem,
      chatItem: MdsActorSheet.#onChatItem,
      createItem: MdsActorSheet.#onCreateItem,
      editItem: MdsActorSheet.#onEditItem,
      deleteItem: MdsActorSheet.#onDeleteItem,
      toggleItemBool: MdsActorSheet.#onToggleItemBool,
      seedCoreSkills: MdsActorSheet.#onSeedCoreSkills,
      setConsumable: MdsActorSheet.#onSetConsumable,
      rollSupply: MdsActorSheet.#onRollSupply,
      drinkRum: MdsActorSheet.#onDrinkRum,
      rollCallingTest: MdsActorSheet.#onRollCallingTest,
      rollVodouMishap: MdsActorSheet.#onRollVodouMishap,
      rollCritTable: MdsActorSheet.#onRollCritTable,
      clearCondition: MdsActorSheet.#onClearCondition,
      addRelationship: MdsActorSheet.#onAddRelationship,
      removeRelationship: MdsActorSheet.#onRemoveRelationship,
      repairItem: MdsActorSheet.#onRepairItem,
      reloadWeapon: MdsActorSheet.#onReloadWeapon,
      applyArchetype: MdsActorSheet.#onApplyArchetype,
      applyShipClass: MdsActorSheet.#onApplyShipClass,
      rollNpcArmor: MdsActorSheet.#onRollNpcArmor,
      rollMonstrousAttack: MdsActorSheet.#onRollMonstrousAttack,
      rollShipHull: MdsActorSheet.#onRollShipHull,
      rollShipSails: MdsActorSheet.#onRollShipSails,
      rollShipCannons: MdsActorSheet.#onRollShipCannons,
      rollShipInfamy: MdsActorSheet.#onRollShipInfamy,
      createEffect: MdsActorSheet.#onCreateEffect,
      editEffect: MdsActorSheet.#onEditEffect,
      toggleEffect: MdsActorSheet.#onToggleEffect,
      deleteEffect: MdsActorSheet.#onDeleteEffect,
    },
  };

  static PARTS = {
    character: {
      template: `systems/${MDS_CONFIG.ID}/templates/actor/character-sheet.hbs`,
      scrollable: [".mds-sheet-scroll"],
    },
    npc: {
      template: `systems/${MDS_CONFIG.ID}/templates/actor/npc-sheet.hbs`,
      scrollable: [".mds-sheet-scroll"],
    },
    ship: {
      template: `systems/${MDS_CONFIG.ID}/templates/actor/ship-sheet.hbs`,
      scrollable: [".mds-sheet-scroll"],
    },
  };

  #activeTab = "main";

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (!this.options.classes.includes(this.document.type)) {
      this.options.classes.push(this.document.type);
    }

    if (this.document.type === "npc") {
      options.parts = ["npc"];
    } else if (this.document.type === "ship") {
      options.parts = ["ship"];
    } else {
      options.parts = ["character"];
    }
  }

  _onRender(context, options) {
    super._onRender(context, options);

    // Inline edits for embedded Item properties
    this.element.querySelectorAll("[data-item-field]").forEach(el => {
      el.addEventListener("change", async ev => {
        ev.stopPropagation();
        const row = ev.currentTarget.closest("[data-item-id]");
        const item = this.actor.items.get(row?.dataset?.itemId);
        if (!item) return;
        const field = ev.currentTarget.dataset.itemField;
        const value = ev.currentTarget.type === "checkbox"
          ? ev.currentTarget.checked
          : ev.currentTarget.dataset.dtype === "Number"
            ? Number(ev.currentTarget.value) || 0
            : ev.currentTarget.value;
        await item.update({ [field]: value });
      });
    });

    // Enable dragging items/skills to hotbar
    if (this.isEditable) {
      this.element.querySelectorAll("[data-item-id].draggable").forEach(el => {
        el.setAttribute("draggable", "true");
        el.addEventListener("dragstart", ev => {
          const item = this.actor.items.get(el.dataset.itemId);
          if (!item) return;
          ev.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
        });
      });
    }
  }

  async _prepareContext(options) {
    const actor = this.actor;
    const enableEncumbrance = game.settings.get(MDS_CONFIG.ID, "enableEncumbrance");

    const skills = [];
    const skillsByAttribute = {
      strength: [],
      wits: [],
      agility: [],
      empathy: [],
    };
    const specialties = [];
    const weapons = [];
    const armors = [];
    const gears = [];
    const magics = [];
    const criticals = [];
    const shipModules = [];

    for (const item of actor.items) {
      switch (item.type) {
        case "skill":
          skills.push(item);
          if (skillsByAttribute[item.system.attribute]) {
            skillsByAttribute[item.system.attribute].push(item);
          } else {
            skillsByAttribute.strength.push(item);
          }
          break;
        case "specialty":
          specialties.push(item);
          break;
        case "weapon":
          weapons.push(item);
          break;
        case "armor":
          armors.push(item);
          break;
        case "gear":
          gears.push(item);
          break;
        case "magic":
          magics.push(item);
          break;
        case "critical":
          criticals.push(item);
          break;
        case "shipModule":
          shipModules.push(item);
          break;
      }
    }

    const byName = (a, b) => a.name.localeCompare(b.name);
    skills.sort(byName);
    for (const k of Object.keys(skillsByAttribute)) skillsByAttribute[k].sort(byName);
    specialties.sort(byName);
    weapons.sort(byName);
    armors.sort(byName);
    gears.sort(byName);
    magics.sort((a, b) => (a.system.level - b.system.level) || a.name.localeCompare(b.name));
    criticals.sort(byName);
    shipModules.sort(byName);

    const enrichedBiography = actor.system.biography
      ? await TextEditor.enrichHTML(actor.system.biography, {
          secrets: actor.isOwner,
          relativeTo: actor,
        })
      : "";

    const enrichedNotes = actor.system.notes
      ? await TextEditor.enrichHTML(actor.system.notes, {
          secrets: actor.isOwner,
          relativeTo: actor,
        })
      : "";

    const tabs = [
      { id: "main", label: "MDS.Tabs.Main", icon: "fa-solid fa-compass", active: this.#activeTab === "main" },
      { id: "magic", label: "MDS.Tabs.Magic", icon: "fa-solid fa-skull", active: this.#activeTab === "magic" },
      { id: "effects", label: "MDS.Tabs.BioEffects", icon: "fa-solid fa-scroll", active: this.#activeTab === "effects" },
    ];

    const physSlots = (actor.system.conditions?.physical ?? []).slice(
      0,
      actor.type === "character" ? 3 : (actor.system.physicalMax || 3)
    );
    const secondSlotsKey = actor.type === "ship" ? "combat" : "mental";
    const secondMax = actor.type === "character" ? 3 : (actor.system.mentalMax || actor.system.combatMax || 3);
    const secondSlots = (actor.system.conditions?.[secondSlotsKey] ?? []).slice(0, secondMax);

    return {
      actor,
      system: actor.system,
      config: MDS_CONFIG,
      editable: this.isEditable,
      owner: actor.isOwner,
      isGM: game.user.isGM,
      isBroken: actor.isBroken,
      enableEncumbrance,
      activeTab: this.#activeTab,
      tabs,
      skills,
      skillsByAttribute,
      specialties,
      weapons,
      armors,
      gears,
      magics,
      vodouMagics: magics.filter(m => m.system.tradition === "vodou"),
      faithMagics: magics.filter(m => m.system.tradition === "faith"),
      corruptionMagics: magics.filter(m => m.system.tradition === "corruption"),
      criticals,
      shipModules,
      physSlots,
      secondSlots,
      effects: Array.from(actor.effects),
      enrichedBiography,
      enrichedNotes,
    };
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  static async #onEditImage(event, target) {
    const attr = target.dataset.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current,
      callback: path => this.document.update({ [attr]: path }),
    });
    return fp.browse();
  }

  static #onSwitchTab(event, target) {
    const tab = target.dataset.tab;
    if (!tab) return;
    this.#activeTab = tab;
    this.render();
  }

  static async #onRollAttribute(event, target) {
    const attribute = target.dataset.attribute;
    if (!attribute) return;
    await this.actor.openRollDialog({ attribute }, event);
  }

  static async #onRollItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await item.roll(event);
  }

  static async #onChatItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await item.sendToChat();
  }

  static async #onCreateItem(event, target) {
    const type = target.dataset.type || "gear";
    const attribute = target.dataset.attribute || "strength";
    const tradition = target.dataset.tradition || "vodou";
    const category = target.dataset.category || "general";
    const name = `${game.i18n.localize("MDS.New")} ${game.i18n.localize(`TYPES.Item.${type}`)}`;

    const itemData = { name, type, system: {} };
    if (type === "skill") itemData.system.attribute = attribute;
    if (type === "magic") {
      itemData.system.tradition = tradition;
      if (tradition === "corruption") {
        itemData.system.willpowerCost = 0;
        itemData.system.callingCost = 1;
      }
    }
    if (type === "specialty") itemData.system.category = category;

    const created = await this.actor.createEmbeddedDocuments("Item", [itemData]);
    created[0]?.sheet?.render(true);
  }

  static #onEditItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    item?.sheet?.render(true);
  }

  static async #onDeleteItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await item.delete();
  }

  static async #onToggleItemBool(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset?.itemId;
    const field = target.dataset.field;
    const item = this.actor.items.get(itemId);
    if (!item || !field) return;
    const current = Boolean(foundry.utils.getProperty(item, field));
    await item.update({ [field]: !current });
  }

  static async #onSeedCoreSkills() {
    await this.actor.seedCoreSkills();
  }

  static async #onSetConsumable(event, target) {
    const key = target.dataset.consumable;
    const val = Number(target.dataset.value);
    if (!key || Number.isNaN(val)) return;
    const current = Number(this.actor.system.consumables?.[key]) || 0;
    const nextVal = current === val ? val - 1 : val;
    await this.actor.update({ [`system.consumables.${key}`]: Math.max(0, Math.min(6, nextVal)) });
  }

  static async #onRollSupply(event, target) {
    const key = target.dataset.consumable;
    if (!key) return;
    await this.actor.rollSupply(key);
  }

  static async #onDrinkRum() {
    await this.actor.drinkRum();
  }

  static async #onRollCallingTest() {
    await this.actor.rollCallingTest();
  }

  static async #onRollVodouMishap() {
    await this.actor.rollVodouMishap();
  }

  static async #onRollCritTable(event, target) {
    const category = target.dataset.category || "physical";
    await this.actor.rollCritical(category);
  }

  static async #onClearCondition(event, target) {
    const track = target.dataset.track;
    const idx = Number(target.dataset.index);
    if (!track || Number.isNaN(idx)) return;
    const slots = foundry.utils.deepClone(this.actor.system.conditions[track] ?? []);
    if (!slots[idx]) return;
    slots[idx] = { text: "", severity: "none" };
    await this.actor.update({ [`system.conditions.${track}`]: slots });
  }

  static async #onAddRelationship() {
    const list = foundry.utils.deepClone(this.actor.system.relationships ?? []);
    list.push({ name: "", type: "" });
    await this.actor.update({ "system.relationships": list });
  }

  static async #onRemoveRelationship(event, target) {
    const idx = Number(target.dataset.index);
    const list = foundry.utils.deepClone(this.actor.system.relationships ?? []);
    if (Number.isNaN(idx) || !list[idx]) return;
    list.splice(idx, 1);
    await this.actor.update({ "system.relationships": list });
  }

  static async #onRepairItem(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    if (item.type === "armor") {
      await item.update({ "system.die": item.system.maxDie });
    } else if (item.system.maxBonus !== undefined) {
      await item.update({ "system.bonus": item.system.maxBonus });
    }
  }

  static async #onReloadWeapon(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item || item.type !== "weapon") return;
    await item.update({ "system.loaded": true });
  }

  static async #onApplyArchetype() {
    const key = this.actor.system.archetype;
    const arch = MDS_CONFIG.archetypes[key];
    if (!arch) return;
    await this.actor.update({
      "system.keyAttribute": arch.keyAttribute,
      "system.keySkill": game.i18n.localize(`MDS.CoreSkill.${arch.keySkill}`),
    });
  }

  static async #onApplyShipClass() {
    const cls = MDS_CONFIG.shipClasses[this.actor.system.shipClass];
    if (!cls) return;
    await this.actor.update({
      "system.hull": cls.hull,
      "system.sails": cls.sails,
      "system.cannons": cls.cannons,
      "system.cargoMax": cls.cargo,
      "system.physicalMax": cls.physicalMax,
      "system.combatMax": cls.combatMax,
    });
  }

  static async #onRollNpcArmor() {
    await this.actor.rollArmor(null);
  }

  static async #onRollMonstrousAttack(event, target) {
    const idx = target.dataset.index !== undefined ? Number(target.dataset.index) : null;
    await this.actor.rollMonstrousAttack(idx);
  }

  static async #onRollShipHull() {
    await executeMdsRoll(this.actor, {
      attrDie: this.actor.system.hull || "d8",
      skillDie: "none",
      maxPush: 0,
      flavor: `${this.actor.name} — ${game.i18n.localize("MDS.Ship.Hull")}`,
      rollType: "armor",
    });
  }

  static async #onRollShipSails() {
    const mod = (this.actor.system.hasWindAdvantage ? 1 : 0) + (this.actor.system.physicalPenalty || 0);
    await executeMdsRoll(this.actor, {
      attrDie: this.actor.system.sails || "d8",
      skillDie: "none",
      modifier: mod,
      maxPush: 0,
      flavor: `${this.actor.name} — ${game.i18n.localize("MDS.Ship.Sails")}`,
      rollType: "skill",
    });
  }

  static async #onRollShipCannons() {
    let mod = this.actor.system.hasWindAdvantage ? 1 : 0;
    if (this.actor.system.posture === "aggressive") mod += 1;
    if (this.actor.system.posture === "desperate") mod += 2;
    if (this.actor.system.ammoType === "chain") mod -= 1;
    await executeMdsRoll(this.actor, {
      attrDie: this.actor.system.cannons || "d8",
      skillDie: "none",
      modifier: mod,
      maxPush: 0,
      flavor: `${this.actor.name} — ${game.i18n.localize("MDS.Ship.Broadside")} (${game.i18n.localize(`MDS.Ship.Ammo.${this.actor.system.ammoType}`)})`,
      rollType: "attack",
    });
  }

  static async #onRollShipInfamy() {
    const die = this.actor.system.infamyDie;
    if (!die || die === "none") {
      ui.notifications.warn(game.i18n.localize("MDS.Notifications.NoDiceToRoll"));
      return;
    }
    await executeMdsRoll(this.actor, {
      attrDie: die,
      skillDie: "none",
      maxPush: 0,
      flavor: `${this.actor.name} — ${game.i18n.localize("MDS.Ship.Infamy")}`,
      rollType: "skill",
    });
  }

  static async #onCreateEffect() {
    const created = await this.actor.createEmbeddedDocuments("ActiveEffect", [
      {
        name: game.i18n.localize("MDS.NewEffect"),
        img: "icons/svg/aura.svg",
        origin: this.actor.uuid,
      },
    ]);
    created[0]?.sheet?.render(true);
  }

  static #onEditEffect(event, target) {
    const effectId = target.closest("[data-effect-id]")?.dataset?.effectId;
    this.actor.effects.get(effectId)?.sheet?.render(true);
  }

  static async #onToggleEffect(event, target) {
    const effectId = target.closest("[data-effect-id]")?.dataset?.effectId;
    const effect = this.actor.effects.get(effectId);
    if (effect) await effect.update({ disabled: !effect.disabled });
  }

  static async #onDeleteEffect(event, target) {
    const effectId = target.closest("[data-effect-id]")?.dataset?.effectId;
    const effect = this.actor.effects.get(effectId);
    if (effect) await effect.delete();
  }
}

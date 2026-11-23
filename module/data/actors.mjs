import {
  MDS_CONFIG,
  computeConditionTrack,
  getCallingDie,
  getCallingStateKey,
  getInfamyDie,
  stepDieSize,
} from "../config.mjs";

const fields = foundry.data.fields;

function makeStepAttributeSchema(initialDie = "d8") {
  return new fields.SchemaField({
    die: new fields.StringField({
      required: true,
      initial: initialDie,
      choices: ["d6", "d8", "d10", "d12"],
    }),
    mod: new fields.NumberField({ required: true, integer: true, initial: 0 }),
  });
}

function makeConditionSlotField() {
  return new fields.SchemaField({
    text: new fields.StringField({ initial: "" }),
    severity: new fields.StringField({
      required: true,
      initial: "none",
      choices: ["none", "mild", "moderate", "severe"],
    }),
  });
}

function defaultConditionSlots(count = 3) {
  return Array.from({ length: count }, () => ({ text: "", severity: "none" }));
}

export class MdsCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      origin: new fields.StringField({ initial: "" }),
      archetype: new fields.StringField({ initial: "" }),
      keyAttribute: new fields.StringField({
        initial: "strength",
        choices: ["strength", "agility", "wits", "empathy"],
      }),
      keySkill: new fields.StringField({ initial: "" }),

      attributes: new fields.SchemaField({
        strength: makeStepAttributeSchema("d8"),
        agility: makeStepAttributeSchema("d8"),
        wits: makeStepAttributeSchema("d8"),
        empathy: makeStepAttributeSchema("d8"),
      }),

      // Pontos de Vontade (PV): max = highest die size between Wits and Empathy
      willpower: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        max: new fields.NumberField({ required: true, integer: true, initial: 8, min: 0 }),
        bonusMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      }),

      // O Chamado (0-10)
      calling: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0, max: 10 }),
        max: new fields.NumberField({ required: true, integer: true, initial: 10, min: 1, max: 10 }),
      }),

      experience: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        total: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      }),

      // Two independent 3-slot narrative condition tracks (Physical & Mental)
      conditions: new fields.SchemaField({
        physical: new fields.ArrayField(makeConditionSlotField(), {
          initial: () => defaultConditionSlots(3),
        }),
        mental: new fields.ArrayField(makeConditionSlotField(), {
          initial: () => defaultConditionSlots(3),
        }),
        physicalBroken: new fields.BooleanField({ initial: false }),
        mentalBroken: new fields.BooleanField({ initial: false }),
        intoxicated: new fields.BooleanField({ initial: false }),
      }),

      traits: new fields.SchemaField({
        pride: new fields.SchemaField({
          text: new fields.StringField({ initial: "" }),
          used: new fields.BooleanField({ initial: false }),
        }),
        darkSecret: new fields.StringField({ initial: "" }),
        bigDream: new fields.StringField({ initial: "" }),
      }),

      relationships: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ initial: "" }),
          type: new fields.StringField({ initial: "" }),
        }),
        {
          initial: () => [
            { name: "", type: "" },
            { name: "", type: "" },
            { name: "", type: "" },
            { name: "", type: "" },
          ],
        }
      ),

      // Consumables (Supply Rating 0-6) + Rum doses
      consumables: new fields.SchemaField({
        food: new fields.NumberField({ required: true, integer: true, initial: 4, min: 0, max: 6 }),
        water: new fields.NumberField({ required: true, integer: true, initial: 4, min: 0, max: 6 }),
        ammo: new fields.NumberField({ required: true, integer: true, initial: 3, min: 0, max: 6 }),
        rum: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      }),

      // Treasure hierarchy: 10 Handfuls = 1 Sack, 10 Sacks = 1 Chest, 10 Chests = 1 Treasure
      treasure: new fields.SchemaField({
        handfuls: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        sacks: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        chests: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        treasures: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      }),

      // Catholic Faith Commandments (true = violated)
      commandmentsViolated: new fields.SchemaField({
        noKillInnocents: new fields.BooleanField({ initial: false }),
        noStealPoor: new fields.BooleanField({ initial: false }),
        noAbandonAllies: new fields.BooleanField({ initial: false }),
        noPactDepths: new fields.BooleanField({ initial: false }),
        careWeak: new fields.BooleanField({ initial: false }),
      }),

      loaFavors: new fields.StringField({ initial: "" }),
      mutations: new fields.StringField({ initial: "" }),

      biography: new fields.HTMLField({ initial: "" }),
      notes: new fields.HTMLField({ initial: "" }),
    };
  }

  prepareDerivedData() {
    const items = this.parent?.items ?? [];

    // Ensure 3 slots always exist for both tracks
    while (this.conditions.physical.length < 3) {
      this.conditions.physical.push({ text: "", severity: "none" });
    }
    while (this.conditions.mental.length < 3) {
      this.conditions.mental.push({ text: "", severity: "none" });
    }

    // Passive bonuses from Specialties (e.g., Mula de Carga +2 Punhados, Pura Coragem maxPush 2, etc.)
    let carryBonus = 0;
    this.maxPushByAttribute = {
      strength: 1,
      agility: 1,
      wits: 1,
      empathy: 1,
    };

    for (const item of items) {
      if (item.type === "specialty") {
        carryBonus += Number(item.system.carryBonus) || 0;
        if (item.system.maxPush > 1) {
          if (item.system.attribute && this.maxPushByAttribute[item.system.attribute] !== undefined) {
            this.maxPushByAttribute[item.system.attribute] = Math.max(
              this.maxPushByAttribute[item.system.attribute],
              item.system.maxPush
            );
          } else {
            for (const k of Object.keys(this.maxPushByAttribute)) {
              this.maxPushByAttribute[k] = Math.max(this.maxPushByAttribute[k], item.system.maxPush);
            }
          }
        }
      }
    }

    // Derived Willpower Max = highest die size between Wits and Empathy (+ optional solo bonusMax)
    const witSize = stepDieSize(this.attributes.wits.die);
    const empSize = stepDieSize(this.attributes.empathy.die);
    this.willpower.max = Math.max(witSize, empSize) + (Number(this.willpower.bonusMax) || 0);

    // Derived Calling Die & state
    this.callingDie = getCallingDie(this.calling.value);
    this.callingStateKey = getCallingStateKey(this.calling.value);

    // Derived Condition tracks
    const physTrack = computeConditionTrack(this.conditions.physical, 3);
    const mentTrack = computeConditionTrack(this.conditions.mental, 3);
    this.physicalCount = physTrack.count;
    this.physicalPenalty = physTrack.penalty;
    this.mentalCount = mentTrack.count;
    this.mentalPenalty = mentTrack.penalty;

    // Violated Commandments count (Catholic Faith penalty)
    this.violatedCommandmentsCount = Object.values(this.commandmentsViolated ?? {}).filter(Boolean).length;

    // Encumbrance in Punhados = Strength die size + carryBonus
    const maxCarry = stepDieSize(this.attributes.strength.die) + carryBonus;
    let currentWeight = Number(this.consumables.rum) || 0; // 1 dose of Rum = 1 Handful

    for (const item of items) {
      if (!["weapon", "armor", "gear"].includes(item.type)) continue;
      if (item.system.carried === false) continue;
      const qty = Number(item.system.quantity ?? 1) || 0;
      const w = Number(item.system.weight) || 0;
      currentWeight += w * qty;
    }

    this.encumbrance = {
      value: Math.round(currentWeight * 100) / 100,
      max: maxCarry,
      overloaded: currentWeight > maxCarry,
      percentage: maxCarry > 0 ? Math.min(100, Math.round((currentWeight / maxCarry) * 100)) : 0,
    };
  }
}

export class MdsNpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      category: new fields.StringField({
        required: true,
        initial: "human",
        choices: ["human", "beast", "horror", "undead", "entity"],
      }),
      size: new fields.StringField({
        required: true,
        initial: "medium",
        choices: ["small", "medium", "large", "huge", "colossal"],
      }),
      role: new fields.StringField({ initial: "" }),

      attributes: new fields.SchemaField({
        strength: makeStepAttributeSchema("d8"),
        agility: makeStepAttributeSchema("d8"),
        wits: makeStepAttributeSchema("d6"),
        empathy: makeStepAttributeSchema("d6"),
      }),

      armorDie: new fields.StringField({
        required: true,
        initial: "none",
        choices: ["none", "d6", "d8", "d10", "d12"],
      }),
      movement: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      fearStress: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      isSwarm: new fields.BooleanField({ initial: false }),
      weakensFromConditions: new fields.BooleanField({ initial: true }),

      physicalMax: new fields.NumberField({ required: true, integer: true, initial: 2, min: 1, max: 10 }),
      mentalMax: new fields.NumberField({ required: true, integer: true, initial: 2, min: 0, max: 10 }),

      conditions: new fields.SchemaField({
        physical: new fields.ArrayField(makeConditionSlotField(), {
          initial: () => defaultConditionSlots(5),
        }),
        mental: new fields.ArrayField(makeConditionSlotField(), {
          initial: () => defaultConditionSlots(5),
        }),
        physicalBroken: new fields.BooleanField({ initial: false }),
        mentalBroken: new fields.BooleanField({ initial: false }),
      }),

      // D6 Monstrous Attacks table (Chapter 9)
      monstrousAttacks: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ initial: "" }),
          scale: new fields.StringField({ initial: "personal", choices: ["personal", "naval", "both"] }),
          die: new fields.StringField({ initial: "d10", choices: ["none", "d6", "d8", "d10", "d12"] }),
          damage: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
          effect: new fields.StringField({ initial: "" }),
        }),
        {
          initial: () =>
            Array.from({ length: 6 }, () => ({
              name: "",
              scale: "personal",
              die: "d10",
              damage: 1,
              effect: "",
            })),
        }
      ),

      notes: new fields.HTMLField({ initial: "" }),
    };
  }

  prepareDerivedData() {
    while (this.conditions.physical.length < this.physicalMax) {
      this.conditions.physical.push({ text: "", severity: "none" });
    }
    while (this.conditions.mental.length < this.mentalMax) {
      this.conditions.mental.push({ text: "", severity: "none" });
    }
    while (this.monstrousAttacks.length < 6) {
      this.monstrousAttacks.push({ name: "", scale: "personal", die: "d10", damage: 1, effect: "" });
    }

    const physTrack = computeConditionTrack(this.conditions.physical, this.physicalMax);
    const mentTrack = computeConditionTrack(this.conditions.mental, this.mentalMax);
    this.physicalCount = physTrack.count;
    this.physicalPenalty = this.weakensFromConditions ? physTrack.penalty : 0;
    this.mentalCount = mentTrack.count;
    this.mentalPenalty = this.weakensFromConditions ? mentTrack.penalty : 0;
    this.maxPushByAttribute = { strength: 1, agility: 1, wits: 1, empathy: 1 };
  }
}

export class MdsShipData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      shipClass: new fields.StringField({
        required: true,
        initial: "brigantine",
        choices: ["sloop", "brigantine", "corvette", "fluyt", "lightGalleon", "heavyGalleon"],
      }),
      hull: new fields.StringField({ required: true, initial: "d8", choices: ["d6", "d8", "d10", "d12"] }),
      sails: new fields.StringField({ required: true, initial: "d8", choices: ["d6", "d8", "d10", "d12"] }),
      cannons: new fields.StringField({ required: true, initial: "d8", choices: ["d6", "d8", "d10", "d12"] }),
      cargoMax: new fields.NumberField({ required: true, integer: true, initial: 40, min: 0 }),

      physicalMax: new fields.NumberField({ required: true, integer: true, initial: 3, min: 1, max: 6 }),
      combatMax: new fields.NumberField({ required: true, integer: true, initial: 3, min: 1, max: 6 }),

      conditions: new fields.SchemaField({
        physical: new fields.ArrayField(makeConditionSlotField(), {
          initial: () => defaultConditionSlots(5),
        }),
        combat: new fields.ArrayField(makeConditionSlotField(), {
          initial: () => defaultConditionSlots(5),
        }),
        destroyed: new fields.BooleanField({ initial: false }),
        captured: new fields.BooleanField({ initial: false }),
      }),

      // Chapter 7: Infamy, Loyalty, Mutiny
      infamy: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      loyalty: new fields.NumberField({ required: true, integer: true, initial: 3, min: 0, max: 5 }),
      mutinyTriggers: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      crewCount: new fields.NumberField({ required: true, integer: true, initial: 20, min: 0 }),

      // Naval Combat State (Chapter 6)
      posture: new fields.StringField({
        required: true,
        initial: "cautious",
        choices: ["cautious", "aggressive", "desperate"],
      }),
      ammoType: new fields.StringField({
        required: true,
        initial: "iron",
        choices: ["iron", "chain", "grapeshot"],
      }),
      hasWindAdvantage: new fields.BooleanField({ initial: false }),

      // Ship Roles (Chapter 6)
      roles: new fields.SchemaField({
        captain: new fields.StringField({ initial: "" }),
        firstMate: new fields.StringField({ initial: "" }),
        helmsman: new fields.StringField({ initial: "" }),
        masterGunner: new fields.StringField({ initial: "" }),
        carpenter: new fields.StringField({ initial: "" }),
        surgeon: new fields.StringField({ initial: "" }),
      }),

      // Provisions & Ship Hold (Baús)
      provisions: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 }),
      treasure: new fields.SchemaField({
        chests: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        treasures: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      }),

      notes: new fields.HTMLField({ initial: "" }),
    };
  }

  prepareDerivedData() {
    while (this.conditions.physical.length < this.physicalMax) {
      this.conditions.physical.push({ text: "", severity: "none" });
    }
    while (this.conditions.combat.length < this.combatMax) {
      this.conditions.combat.push({ text: "", severity: "none" });
    }

    const physTrack = computeConditionTrack(this.conditions.physical, this.physicalMax);
    const combTrack = computeConditionTrack(this.conditions.combat, this.combatMax);
    this.physicalCount = physTrack.count;
    this.physicalPenalty = physTrack.penalty;
    this.combatCount = combTrack.count;
    this.combatPenalty = combTrack.penalty;

    // Derived speed in hexes per Quarter-Day (D6=1, D8=2, D10=3, D12=4)
    const sailsSize = stepDieSize(this.sails);
    this.hexSpeed = sailsSize >= 12 ? 4 : sailsSize >= 10 ? 3 : sailsSize >= 8 ? 2 : 1;

    // Derived Infamy Die
    this.infamyDie = getInfamyDie(this.infamy);
    this.loyaltyLabelKey = MDS_CONFIG.loyaltyStates[this.loyalty] ?? "MDS.Ship.Loyalty.3";

    // Cargo used (provisions + treasure chests + ship modules)
    let modulesSpace = 0;
    for (const item of this.parent?.items ?? []) {
      if (item.type === "shipModule") {
        modulesSpace += Number(item.system.cargoSpace) || 0;
      }
    }
    this.cargoUsed = (Number(this.provisions) || 0) + (Number(this.treasure.chests) || 0) + modulesSpace;
  }
}

const fields = foundry.data.fields;

export class MdsSkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      skillKey: new fields.StringField({ initial: "" }),
      attribute: new fields.StringField({
        required: true,
        initial: "strength",
        choices: ["strength", "agility", "wits", "empathy"],
      }),
      die: new fields.StringField({
        required: true,
        initial: "none",
        choices: ["none", "d6", "d8", "d10", "d12"],
      }),
      xpMarked: new fields.BooleanField({ initial: false }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

export class MdsSpecialtyData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      category: new fields.StringField({
        required: true,
        initial: "general",
        choices: ["general", "exclusive", "magic"],
      }),
      archetype: new fields.StringField({ initial: "" }),
      tradition: new fields.StringField({ initial: "" }), // "", "vodou", "faith"
      loa: new fields.StringField({ initial: "" }),
      rank: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1, max: 3 }),
      attribute: new fields.StringField({ initial: "" }),
      associatedSkill: new fields.StringField({ initial: "" }),
      modifier: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      maxPush: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1, max: 2 }),
      willpowerCost: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      carryBonus: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

export class MdsWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      skill: new fields.StringField({ initial: "" }),
      attribute: new fields.StringField({
        required: true,
        initial: "strength",
        choices: ["strength", "agility", "wits", "empathy"],
      }),
      grip: new fields.StringField({
        required: true,
        initial: "1h",
        choices: ["1h", "2h", "unarmed"],
      }),
      bonus: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0, max: 3 }),
      maxBonus: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0, max: 3 }),
      damage: new fields.NumberField({ required: true, integer: true, initial: 2, min: 0 }),
      range: new fields.StringField({
        required: true,
        initial: "engaged",
        choices: ["engaged", "short", "medium", "long", "extreme"],
      }),
      singleShot: new fields.BooleanField({ initial: false }),
      loaded: new fields.BooleanField({ initial: true }),
      weight: new fields.NumberField({ required: true, initial: 1, min: 0 }),
      carried: new fields.BooleanField({ initial: true }),
      features: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

export class MdsArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      part: new fields.StringField({
        required: true,
        initial: "body",
        choices: ["body", "shield", "cover"],
      }),
      die: new fields.StringField({
        required: true,
        initial: "d6",
        choices: ["none", "d6", "d8", "d10", "d12"],
      }),
      maxDie: new fields.StringField({
        required: true,
        initial: "d6",
        choices: ["none", "d6", "d8", "d10", "d12"],
      }),
      weight: new fields.NumberField({ required: true, initial: 1, min: 0 }),
      carried: new fields.BooleanField({ initial: true }),
      equipped: new fields.BooleanField({ initial: true }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

export class MdsGearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      associatedSkill: new fields.StringField({ initial: "" }),
      bonus: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0, max: 3 }),
      quantity: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      weight: new fields.NumberField({ required: true, initial: 1, min: 0 }),
      carried: new fields.BooleanField({ initial: true }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

export class MdsMagicData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      tradition: new fields.StringField({
        required: true,
        initial: "vodou",
        choices: ["vodou", "faith", "corruption"],
      }),
      loa: new fields.StringField({ initial: "legba" }),
      level: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1, max: 4 }),
      willpowerCost: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      callingCost: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      requiresCallingTest: new fields.BooleanField({ initial: false }),
      castingTime: new fields.StringField({
        required: true,
        initial: "slow",
        choices: ["fast", "slow", "stretch", "quarterDay"],
      }),
      ingredients: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

export class MdsCriticalData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      category: new fields.StringField({
        required: true,
        initial: "physical",
        choices: ["physical", "mental"],
      }),
      d66: new fields.StringField({ initial: "" }),
      lethal: new fields.BooleanField({ initial: false }),
      stabilized: new fields.BooleanField({ initial: false }),
      timeLimit: new fields.StringField({
        required: true,
        initial: "none",
        choices: ["none", "round", "stretch", "quarterDay"],
      }),
      healingTime: new fields.StringField({ initial: "" }),
      effectsSummary: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

export class MdsShipModuleData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cargoSpace: new fields.NumberField({ required: true, integer: true, initial: 2, min: 0 }),
      costChests: new fields.NumberField({ required: true, integer: true, initial: 2, min: 0 }),
      effectSummary: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
    };
  }
}

/**
 * ===============================================================================
 * YZUR: YEAR ZERO UNIVERSAL DICE ROLLER FOR FOUNDRY VTT (Adapted for Mares de Sangue)
 * ===============================================================================
 * Original Author: @Stefouch (MIT License)
 * Adapted for Mares de Sangue (Pure Step Dice: D6/D8/D10/D12 + Supply D6)
 * ===============================================================================
 */

class YearZeroDie extends foundry.dice.terms.Die {
  constructor(termData = {}) {
    termData.faces = Number.isInteger(termData.faces) ? termData.faces : 6;
    super(termData);
    if (this.maxPush == undefined) {
      this.maxPush = termData.maxPush ?? 1;
    }
  }

  get denomination() {
    return this.constructor.DENOMINATION;
  }

  get type() {
    return this.constructor.TYPE;
  }

  get pushable() {
    if (this.pushCount >= this.maxPush) return false;
    for (const r of this.results) {
      if (!r.active || r.discarded) continue;
      if (!this.constructor.LOCKED_VALUES.includes(r.result)) {
        return true;
      }
    }
    return false;
  }

  get pushCount() {
    return this.results.reduce((c, r) => Math.max(c, r.indexPush || 0), 0);
  }

  get pushed() {
    return this.pushCount > 0;
  }

  get isYearZeroDie() {
    return true;
  }

  get success() {
    if (!this._evaluated) return undefined;
    const s = this.results.reduce((tot, r) => {
      if (!r.active) return tot;
      if (r.count !== undefined) return tot + r.count;
      if (this.constructor.SUCCESS_TABLE) {
        return tot + (this.constructor.SUCCESS_TABLE[r.result] ?? 0);
      }
      return tot + (r.result >= 6 ? 1 : 0);
    }, 0);
    return this.type === "neg" ? -s : s;
  }

  get failure() {
    if (!this._evaluated) return undefined;
    return this.results.reduce((tot, r) => {
      if (!r.active) return tot;
      return tot + (r.result <= 1 ? 1 : 0);
    }, 0);
  }

  async roll(options = {}) {
    const roll = await super.roll(options);
    roll.indexResult = options.indexResult;
    if (roll.indexResult == undefined) {
      roll.indexResult = 1 + this.results.reduce((c, r) => {
        let i = r.indexResult;
        if (i == undefined) i = -1;
        return Math.max(c, i);
      }, -1);
    }
    roll.indexPush = options.indexPush ?? this.pushCount;
    this.results[this.results.length - 1] = roll;
    return roll;
  }

  count(n) {
    return this.values.filter(v => v === n).length;
  }

  async push() {
    if (!this.pushable) return this;
    const indexPush = this.pushCount + 1;
    const indexesResult = [];
    let currentIndex = -1;
    for (const r of this.results) {
      currentIndex++;
      r.indexResult ??= currentIndex % this.number;
      if (!r.active || r.locked) continue;
      if (!this.constructor.LOCKED_VALUES.includes(r.result)) {
        r.active = false;
        r.discarded = true;
        r.pushed = true;
        r.hidden = true;
        indexesResult.push(r.indexResult);
      } else {
        r.hidden = true;
      }
    }
    for (let i = 0; i < indexesResult.length; i++) {
      await this.roll({
        indexResult: indexesResult[i],
        indexPush,
      });
    }
    return this;
  }

  nopush() {
    this.maxPush = 0;
  }

  setpush(modifier) {
    const rgx = /p([0-9]+)?/i;
    const match = modifier.match(rgx);
    if (!match) return false;
    let [, max] = match;
    max = parseInt(max) ?? 1;
    this.maxPush = max;
  }

  getResultLabel(result) {
    return CONFIG.YZUR.Icons.getLabel(
      this.constructor.TYPE,
      result.result,
    );
  }

  getResultCSS(result) {
    const hasSuccess = result.success !== undefined;
    const hasFailure = result.failure !== undefined;
    const isMax = result.result >= 6;
    const isMin = result.result === 1;
    return [
      this.constructor.name.toLowerCase(),
      "d" + this.faces,
      hasSuccess ? "success" : null,
      hasFailure ? "failure" : null,
      result.rerolled ? "rerolled" : null,
      result.exploded ? "exploded" : null,
      result.discarded ? "discarded" : null,
      result.pushed ? "pushed" : null,
      !(hasSuccess || hasFailure) && isMin ? "min" : null,
      !(hasSuccess || hasFailure) && isMax ? "max" : null,
    ];
  }

  getTooltipData() {
    return {
      formula: this.expression,
      total: this.success,
      banes: this.failure,
      faces: this.faces,
      number: this.number,
      type: this.type,
      isYearZeroDie: this.isYearZeroDie,
      flavor: this.options.flavor ?? null,
      rolls: this.results.map(r => ({
        result: this.getResultLabel(r),
        classes: this.getResultCSS(r).filter(Boolean).join(" "),
        row: r.indexPush,
        col: r.indexResult,
      })),
    };
  }
}

YearZeroDie.TYPE = "blank";
YearZeroDie.LOCKED_VALUES = [6];
YearZeroDie.SERIALIZE_ATTRIBUTES.push("maxPush");
YearZeroDie.MODIFIERS = foundry.utils.mergeObject(
  { p: "setpush", np: "nopush" },
  foundry.dice.terms.Die.MODIFIERS,
);

class BaseDie extends YearZeroDie {}
BaseDie.TYPE = "base";
BaseDie.DENOMINATION = "b";
BaseDie.LOCKED_VALUES = [1, 6];

class StepDie extends YearZeroDie {
  getResultLabel(result) {
    return CONFIG.YZUR.Icons.getLabel("base", result.result);
  }
}
StepDie.TYPE = "base";
// Mares de Sangue Step Dice: 6-9 = 1 success, 10-12 = 2 successes
StepDie.SUCCESS_TABLE = [null, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2];
StepDie.LOCKED_VALUES = [1, 6, 7, 8, 9, 10, 11, 12];

class D6StepDie extends StepDie {
  constructor(termData = {}) {
    termData.faces = 6;
    super(termData);
  }
}
D6StepDie.DENOMINATION = "6";

class D8StepDie extends StepDie {
  constructor(termData = {}) {
    termData.faces = 8;
    super(termData);
  }
}
D8StepDie.DENOMINATION = "8";

class D10StepDie extends StepDie {
  constructor(termData = {}) {
    termData.faces = 10;
    super(termData);
  }
}
D10StepDie.DENOMINATION = "10";

class D12StepDie extends StepDie {
  constructor(termData = {}) {
    termData.faces = 12;
    super(termData);
  }
}
D12StepDie.DENOMINATION = "12";

const YearZeroDice = Object.freeze({
  BaseDie,
  D6StepDie,
  D8StepDie,
  D10StepDie,
  D12StepDie,
  StepDie,
  YearZeroDie,
});

const YZUR = {
  game: "mds",
  Chat: {
    showInfos: true,
    diceSorting: ["base"],
  },
  Roll: {
    baseTemplate: "systems/fvtt-maresdesangue/templates/dice/broll.hbs",
    chatTemplate: "systems/fvtt-maresdesangue/templates/dice/roll.hbs",
    tooltipTemplate: "systems/fvtt-maresdesangue/templates/dice/tooltip.hbs",
    infosTemplate: "systems/fvtt-maresdesangue/templates/dice/infos.hbs",
  },
  Dice: {
    localizeDieTerms: false,
    DIE_TYPES: ["base"],
    DIE_TERMS: {
      base: BaseDie,
      a: D12StepDie,
      b: D10StepDie,
      c: D8StepDie,
      d: D6StepDie,
    },
  },
  Icons: {
    getLabel: function (type, result) {
      return String(result);
    },
  },
};

class YearZeroRoll extends Roll {
  constructor(formula, data = {}, options = {}) {
    if (options.name == undefined) options.name = data.name;
    if (options.game == undefined) options.game = data.game;
    if (options.maxPush == undefined) options.maxPush = data.maxPush;

    super(formula, data, options);

    if (!this.game) this.game = CONFIG.YZUR.game ?? "mds";
    if (options.maxPush != undefined) this.maxPush = options.maxPush;
  }

  get game() { return this.options.game; }
  set game(yzGame) { this.options.game = yzGame; }

  get name() { return this.options.name; }
  set name(str) { this.options.name = str; }

  set maxPush(n) {
    this.options.maxPush = n;
    for (const t of this.terms) {
      if (t instanceof YearZeroDie) {
        t.maxPush = n;
      }
    }
  }
  get maxPush() {
    if (this.options.isTableRoll) return 0;
    return this.terms.reduce((max, t) => t instanceof YearZeroDie ? Math.max(max, t.maxPush) : max, null);
  }

  get pushCount() {
    return this.terms.reduce((c, t) => Math.max(c, t.pushCount || 0), 0);
  }

  get pushed() {
    return this.pushCount > 0;
  }

  get pushable() {
    if (this.options.isTableRoll) return false;
    return this.pushCount < this.maxPush && this.terms.some(t => t.pushable);
  }

  get successCount() {
    return this.terms.reduce((sc, t) => sc + (t.success ?? 0), 0);
  }

  get baneCount() {
    return this.terms.reduce((c, t) => {
      if (!t.results) return c;
      for (const r of t.results) {
        if (r.active && r.result === 1) c++;
      }
      return c;
    }, 0);
  }

  get baseSuccessQty() {
    return this.successCount + (Number(this.options.prideBonus) || 0);
  }

  get attackDamage() {
    if (!this.options.damage) return undefined;
    if (this.baseSuccessQty <= 0) return 0;
    return Number(this.options.damage) + (this.baseSuccessQty - 1);
  }

  get isSimpleRoll() {
    if (this.options.isTableRoll) return true;
    return !this.terms.some(t => t instanceof YearZeroDie);
  }

  static create(formula, data = {}, options = {}) {
    return new YearZeroRoll(formula, data, options);
  }

  async push() {
    if (!this._evaluated) await this.evaluate();
    if (!this.pushable) return this;
    for (const t of this.terms) {
      if (t instanceof YearZeroDie) {
        await t.push();
      }
    }
    this._evaluated = false;
    await this.evaluate();
    return this;
  }

  async getTooltip() {
    const parts = this.dice.map(d => d.getTooltipData());
    if (this.pushed) {
      for (const part of parts) {
        const matrix = [];
        const n = part.number;
        for (let p = this.pushCount; p >= 0; p--) matrix[p] = new Array(n).fill(undefined);
        let currentIndex = -1;
        for (const r of part.rolls) {
          currentIndex++;
          const row = r.row || 0;
          const col = r.col ?? (currentIndex % n);
          matrix[row][col] = r;
        }
        part.rolls = matrix;
      }
    }
    return foundry.applications.handlebars.renderTemplate(this.constructor.TOOLTIP_TEMPLATE, {
      parts,
      pushed: this.pushed,
      pushCounts: this.pushed
        ? [...Array(this.pushCount + 1).keys()].sort((a, b) => b - a)
        : undefined,
      config: CONFIG.YZUR ?? {},
      options: this.options,
    });
  }

  async getRollInfos(template = null) {
    template = template ?? CONFIG.YZUR?.Roll?.infosTemplate;
    return foundry.applications.handlebars.renderTemplate(template, { roll: this });
  }

  async render(chatOptions = {}) {
    chatOptions = foundry.utils.mergeObject({
      user: game.user.id,
      flavor: this.name,
      template: this.constructor.CHAT_TEMPLATE,
      blind: false,
    }, chatOptions);
    const isPrivate = chatOptions.isPrivate;

    if (!this._evaluated) await this.evaluate();

    const chatData = {
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : chatOptions.flavor,
      user: chatOptions.user,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
      success: isPrivate ? "?" : this.successCount,
      baseSuccessQty: isPrivate ? "?" : this.baseSuccessQty,
      showInfos: isPrivate ? false : CONFIG.YZUR?.Chat?.showInfos,
      infos: isPrivate ? null : await this.getRollInfos(chatOptions.infosTemplate),
      pushable: isPrivate ? false : this.pushable,
      options: chatOptions,
      isPrivate,
      roll: this,
    };

    return foundry.applications.handlebars.renderTemplate(chatOptions.template, chatData);
  }

  async toMessage(messageData = {}, { rollMode = null, messageMode = null, create = true } = {}) {
    messageData = foundry.utils.mergeObject({
      author: game.user.id,
      speaker: ChatMessage.getSpeaker(),
    }, messageData);

    const isV14 = (game.release?.generation ?? 13) >= 14;
    if (isV14) {
      const toV14 = { publicroll: "public", gmroll: "gm", blindroll: "blind", selfroll: "self" };
      const raw = messageMode ?? rollMode ?? game.settings.get("core", "messageMode");
      const finalMode = toV14[raw] ?? raw;
      return await super.toMessage(messageData, { messageMode: finalMode, create });
    }

    const toV13 = { public: "publicroll", gm: "gmroll", blind: "blindroll", self: "selfroll" };
    const raw = rollMode ?? messageMode ?? game.settings.get("core", "rollMode");
    const finalMode = toV13[raw] ?? raw;
    return await super.toMessage(messageData, { rollMode: finalMode, create });
  }

  duplicate() {
    return this.constructor.fromData(this.toJSON());
  }
}

class YearZeroRollManager {
  constructor() {
    throw new SyntaxError(`YZUR | ${this.constructor.name} cannot be instantiated!`);
  }

  static register(yzGame, config, options = {}) {
    YearZeroRollManager._overrideDiceTermFromData();
    YearZeroRollManager.registerConfig(config);
    YearZeroRollManager._initialize(yzGame);
    YearZeroRollManager.registerDice(yzGame, options?.index);
    console.log("YZUR | Mares de Sangue registration complete!");
  }

  static registerConfig(config) {
    CONFIG.YZUR = foundry.utils.mergeObject(YZUR, config);
  }

  static registerDice(yzGame, i) {
    const diceTypes = YearZeroRollManager.DIE_TERMS_MAP[yzGame] ?? [];
    for (const type of diceTypes) YearZeroRollManager.registerDie(type);
    YearZeroRollManager.registerRoll(undefined, i);
  }

  static registerRoll(cls = YearZeroRoll, i = 0) {
    CONFIG.Dice.rolls[i] = cls;
    CONFIG.Dice.rolls[i].CHAT_TEMPLATE = CONFIG.YZUR.Roll.chatTemplate;
    CONFIG.Dice.rolls[i].TOOLTIP_TEMPLATE = CONFIG.YZUR.Roll.tooltipTemplate;
    CONFIG.YZUR.Roll.index = i;
  }

  static registerDie(term) {
    const cls = CONFIG.YZUR.Dice.DIE_TERMS[term];
    if (!cls) return;
    const deno = cls.DENOMINATION;
    CONFIG.Dice.terms[deno] = cls;
    if (CONFIG.Dice.fulfillment?.dice) {
      CONFIG.Dice.fulfillment.dice[deno] = { label: `d${deno}`, icon: '<i class="fa-solid fa-dice"></i>' };
    }
  }

  static _initialize(yzGame) {
    CONFIG.YZUR.game = yzGame;
  }

  static _overrideDiceTermFromData() {
    foundry.dice.terms.DiceTerm.prototype.constructor.fromData = function (data) {
      let cls = CONFIG.Dice.termTypes?.[data.class];
      if (!cls) {
        const termkeys = Object.keys(CONFIG.Dice.terms);
        const stringifiedFaces = String(data.faces);
        if (data.class === "Die" && termkeys.includes(stringifiedFaces)) {
          cls = CONFIG.Dice.terms[stringifiedFaces];
          data.class = cls.name;
        } else {
          cls = Object.values(CONFIG.Dice.terms).find(c => c.name === data.class) || foundry.dice.terms.Die;
        }
      }
      return cls._fromData(data);
    };
  }
}

YearZeroRollManager.DIE_TERMS_MAP = {
  mds: ["base", "a", "b", "c", "d"],
};

Object.defineProperty(YearZeroRollManager, "GAMES", {
  get: () => Object.keys(YearZeroRollManager.DIE_TERMS_MAP),
});

export { YZUR, YearZeroDice, YearZeroRoll, YearZeroRollManager };

import { MDS_CONFIG } from "../config.mjs";
import { executeMagicRoll } from "../helpers/rolls.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class MdsMagicDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ actor, magic }, options = {}) {
    super(options);
    this.actor = actor;
    this.magic = magic;
    this.rankDie = this.#inferRankDie();
    this.modifier = 0;

    this.options.window.title = `${actor.name} — ${magic.name}`;
  }

  static DEFAULT_OPTIONS = {
    classes: ["mds", "mds-dialog", "mds-magic-dialog"],
    position: { width: 420 },
    window: {
      title: "MDS.Magic.Cast",
      icon: "fa-solid fa-skull",
      resizable: false,
    },
    tag: "form",
    form: {
      handler: MdsMagicDialog.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: true,
    },
  };

  static PARTS = {
    form: {
      template: `systems/${MDS_CONFIG.ID}/templates/dialog/magic-roller.hbs`,
    },
  };

  #inferRankDie() {
    const tradition = this.magic.system.tradition;
    const specs = this.actor.items.filter(i => i.type === "specialty" && i.system.category === "magic");
    let rank = 1;
    if (tradition === "vodou") {
      const match = specs.find(s => s.system.tradition === "vodou" && s.system.loa === this.magic.system.loa);
      if (match) rank = Number(match.system.rank) || 1;
    } else if (tradition === "faith") {
      const match = specs.find(s => s.system.tradition === "faith");
      if (match) rank = Number(match.system.rank) || 1;
    }
    return rank >= 3 ? "d10" : rank === 2 ? "d8" : "d6";
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("select, input").forEach(el => {
      el.addEventListener("change", ev => {
        if (ev.currentTarget.name === "rankDie") this.rankDie = ev.currentTarget.value;
        if (ev.currentTarget.name === "modifier") this.modifier = Number(ev.currentTarget.value) || 0;
        this.render();
      });
    });
  }

  async _prepareContext() {
    const tradition = this.magic.system.tradition;
    const violated = this.actor.system.violatedCommandmentsCount || 0;
    return {
      actor: this.actor,
      magic: this.magic,
      config: MDS_CONFIG,
      tradition,
      isVodou: tradition === "vodou",
      isFaith: tradition === "faith",
      isCorruption: tradition === "corruption",
      rankDie: this.rankDie,
      modifier: this.modifier,
      availableWp: this.actor.system.willpower?.value ?? 0,
      violatedCommandments: violated,
      callingValue: this.actor.system.calling?.value ?? 0,
      callingDie: this.actor.system.callingDie || "none",
    };
  }

  static async #onSubmit(event, form, formData) {
    await executeMagicRoll(this.actor, this.magic, {
      rankDie: this.rankDie,
      modifier: this.modifier,
    });
  }
}

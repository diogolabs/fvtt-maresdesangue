import {
  acceptMdsRoll,
  applyTargetDamage,
  pushMdsRoll,
  rollCallingTest,
  rollCriticalTable,
  rollVodouMishap,
} from "../helpers/rolls.mjs";

export class MdsChatLog extends foundry.applications.sidebar.tabs.ChatLog {
  static DEFAULT_OPTIONS = {
    actions: {
      pushRoll: MdsChatLog.#pushRoll,
      acceptRoll: MdsChatLog.#acceptRoll,
      applyTargetDamage: MdsChatLog.#applyTargetDamage,
      rollCallingTest: MdsChatLog.#rollCallingTest,
      rollVodouMishap: MdsChatLog.#rollVodouMishap,
      rollCritTable: MdsChatLog.#rollCritTable,
    },
  };

  static async #pushRoll(event) {
    await pushMdsRoll(event);
  }

  static async #acceptRoll(event) {
    await acceptMdsRoll(event);
  }

  static async #applyTargetDamage(event) {
    await applyTargetDamage(event);
  }

  static async #rollCallingTest(event) {
    const messageId = event.target.closest("[data-message-id]")?.dataset?.messageId;
    const message = game.messages.get(messageId);
    const actor = game.actors.get(message?.speaker?.actor) || game.user.character;
    if (actor) await rollCallingTest(actor);
  }

  static async #rollVodouMishap(event) {
    const messageId = event.target.closest("[data-message-id]")?.dataset?.messageId;
    const message = game.messages.get(messageId);
    const actor = game.actors.get(message?.speaker?.actor) || game.user.character;
    await rollVodouMishap(actor);
  }

  static async #rollCritTable(event, target) {
    const category = target?.dataset?.category || "physical";
    const messageId = event.target.closest("[data-message-id]")?.dataset?.messageId;
    const message = game.messages.get(messageId);
    const actor = canvas?.tokens?.controlled?.[0]?.actor
      || game.actors.get(message?.speaker?.actor)
      || game.user.character;
    await rollCriticalTable(actor, category, true);
  }
}

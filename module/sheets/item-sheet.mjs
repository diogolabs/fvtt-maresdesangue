import { MDS_CONFIG } from "../config.mjs";

const { api, sheets } = foundry.applications;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

export class MdsItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["mds", "sheet", "item"],
    position: {
      width: 500,
      height: 540,
    },
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
    },
    actions: {
      editImage: MdsItemSheet.#onEditImage,
      rollItem: MdsItemSheet.#onRollItem,
      chatItem: MdsItemSheet.#onChatItem,
    },
  };

  static PARTS = {
    sheet: {
      template: `systems/${MDS_CONFIG.ID}/templates/item/item-sheet.hbs`,
      scrollable: [".mds-item-body"],
    },
  };

  async _prepareContext(options) {
    const item = this.document;
    const enrichedDescription = item.system.description
      ? await TextEditor.enrichHTML(item.system.description, {
          secrets: item.isOwner,
          relativeTo: item,
        })
      : "";

    return {
      item,
      system: item.system,
      config: MDS_CONFIG,
      editable: this.isEditable,
      owner: item.isOwner,
      enrichedDescription,
    };
  }

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

  static async #onRollItem(event) {
    await this.document.roll(event);
  }

  static async #onChatItem() {
    await this.document.sendToChat();
  }
}

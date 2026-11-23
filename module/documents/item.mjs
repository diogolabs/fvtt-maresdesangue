import { MDS_CONFIG } from "../config.mjs";

export class MdsItem extends foundry.documents.Item {
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const ID = MDS_CONFIG.ID;
    const defaultIcons = {
      skill: `systems/${ID}/assets/icons/skill.svg`,
      specialty: `systems/${ID}/assets/icons/specialty.svg`,
      weapon: `systems/${ID}/assets/icons/weapon.svg`,
      armor: `systems/${ID}/assets/icons/armor.svg`,
      gear: `systems/${ID}/assets/icons/gear.svg`,
      magic: `systems/${ID}/assets/icons/spell.svg`,
      critical: `systems/${ID}/assets/icons/critical.svg`,
      shipModule: `systems/${ID}/assets/icons/ship-module.svg`,
    };

    const updates = {};
    if (!data.img || data.img === "icons/svg/item-bag.svg") {
      updates.img = defaultIcons[data.type] || "icons/svg/item-bag.svg";
    }
    if (data.type === "weapon" && !data.system?.skill) {
      updates["system.skill"] = game.i18n.localize("MDS.CoreSkill.melee");
    }
    if (Object.keys(updates).length > 0) {
      this.updateSource(updates);
    }
  }

  async roll(event = null) {
    const actor = this.actor;
    if (!actor) return this.sendToChat();

    switch (this.type) {
      case "skill":
        return actor.openRollDialog(
          {
            attribute: this.system.attribute,
            skill: this,
          },
          event
        );

      case "weapon": {
        if (this.system.singleShot && !this.system.loaded) {
          ui.notifications.warn(game.i18n.format("MDS.Notifications.WeaponUnloaded", { name: this.name }));
          return null;
        }
        const linkedSkill = actor.findSkill(this.system.skill);
        const attribute = linkedSkill?.system?.attribute || this.system.attribute || "strength";
        return actor.openRollDialog(
          {
            attribute,
            skill: linkedSkill,
            gear: this,
          },
          event
        );
      }

      case "armor":
        return actor.rollArmor(this);

      case "gear": {
        const linkedSkill = actor.findSkill(this.system.associatedSkill);
        const attribute = linkedSkill?.system?.attribute || "wits";
        return actor.openRollDialog(
          {
            attribute,
            skill: linkedSkill,
            gear: this,
          },
          event
        );
      }

      case "specialty": {
        if (this.system.willpowerCost > 0 && actor.system.willpower) {
          if (actor.system.willpower.value < this.system.willpowerCost) {
            ui.notifications.warn(game.i18n.localize("MDS.Notifications.NotEnoughWillpower"));
            return null;
          }
          await actor.update({
            "system.willpower.value": actor.system.willpower.value - this.system.willpowerCost,
          });
        }
        if (this.system.associatedSkill || this.system.attribute) {
          const linkedSkill = actor.findSkill(this.system.associatedSkill);
          const attribute = linkedSkill?.system?.attribute || this.system.attribute || "strength";
          return actor.openRollDialog(
            {
              attribute,
              skill: linkedSkill,
              specialty: this,
            },
            event
          );
        }
        return this.sendToChat();
      }

      case "magic":
        return actor.openMagicDialog(this);

      case "critical":
      case "shipModule":
      default:
        return this.sendToChat();
    }
  }

  async sendToChat() {
    const content = await foundry.applications.handlebars.renderTemplate(
      `systems/${MDS_CONFIG.ID}/templates/chat/item-card.hbs`,
      {
        item: this,
        system: this.system,
        actor: this.actor,
      }
    );
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content,
    });
  }
}

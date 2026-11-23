import { MDS_CONFIG } from "./config.mjs";

export function registerSettings() {
  const ID = MDS_CONFIG.ID;

  game.settings.register(ID, "autoSeedCoreSkills", {
    name: "MDS.Settings.autoSeedCoreSkills.name",
    hint: "MDS.Settings.autoSeedCoreSkills.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(ID, "enableEncumbrance", {
    name: "MDS.Settings.enableEncumbrance.name",
    hint: "MDS.Settings.enableEncumbrance.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(ID, "autoWillpowerOnFail", {
    name: "MDS.Settings.autoWillpowerOnFail.name",
    hint: "MDS.Settings.autoWillpowerOnFail.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(ID, "autoCallingOnPushBane", {
    name: "MDS.Settings.autoCallingOnPushBane.name",
    hint: "MDS.Settings.autoCallingOnPushBane.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
}

export function registerStatusEffects() {
  CONFIG.statusEffects = [
    {
      id: "dead",
      name: "EFFECT.StatusDead",
      img: "icons/svg/skull.svg",
    },
    {
      id: "brokenPhysical",
      name: "MDS.Status.brokenPhysical",
      img: "icons/svg/blood.svg",
    },
    {
      id: "brokenMental",
      name: "MDS.Status.brokenMental",
      img: "icons/svg/daze.svg",
    },
    {
      id: "intoxicated",
      name: "MDS.Status.intoxicated",
      img: "icons/svg/tankard.svg",
    },
    {
      id: "prone",
      name: "MDS.Status.prone",
      img: "icons/svg/falling.svg",
    },
    {
      id: "grappled",
      name: "MDS.Status.grappled",
      img: "icons/svg/net.svg",
    },
    {
      id: "burning",
      name: "MDS.Status.burning",
      img: "icons/svg/fire.svg",
    },
    {
      id: "possessed",
      name: "MDS.Status.possessed",
      img: "icons/svg/terror.svg",
    },
  ];
}

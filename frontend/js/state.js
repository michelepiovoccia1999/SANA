import { emptyPlan } from "./utils.js";

export const state = {
  plan: emptyPlan(),
  logsCache: {},
  versionsCache: [],
  currentPlanDay: "mon",
  currentTodayDate: new Date(),
  currentTab: "piano",
  currentStorico: "andamento",
  saveTimers: {},
};

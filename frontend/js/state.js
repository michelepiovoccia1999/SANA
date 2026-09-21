import { emptyPlan, dateToDay } from "./utils.js";

export const state = {
  plan: emptyPlan(),
  logsCache: {},
  versionsCache: [],
  currentPlanDay: dateToDay(new Date()),
  currentTodayDate: new Date(),
  currentTab: "oggi",
  currentStorico: "versioni",
  saveTimers: {},
};

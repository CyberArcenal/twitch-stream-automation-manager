// src/main/services/stream-manager/goals.js
const Store = require("electron-store");
const { BrowserWindow } = require("electron");
const { logger } = require("../../utils/logger");

class GoalsManager {
  constructor() {
    this.goalsStore = new Store({ name: "streamGoals" });
  }

  getGoals() {
    return this.goalsStore.get("goals", []);
  }

  addGoal(goal) {
    const goals = this.getGoals();
    const newGoal = {
      id: Date.now().toString(),
      ...goal,
      createdAt: new Date().toISOString(),
    };
    goals.push(newGoal);
    this.goalsStore.set("goals", goals);
    return newGoal;
  }

  updateGoalProgress(goalId, currentValue) {
    const goals = this.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goal.current = currentValue;
      this.goalsStore.set("goals", goals);
      return true;
    }
    return false;
  }

  deleteGoal(goalId) {
    const goals = this.getGoals().filter(g => g.id !== goalId);
    this.goalsStore.set("goals", goals);
  }

  async incrementGoalProgress(unit, amount) {
    const goals = this.getGoals();
    let updated = false;
    for (const goal of goals) {
      if (goal.unit === unit && goal.current < goal.target) {
        goal.current = Math.min(goal.current + amount, goal.target);
        updated = true;
      }
    }
    if (updated) {
      this.goalsStore.set("goals", goals);
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send("goal:progress-updated", { unit, amount });
        }
      });
    }
  }

  getStreamKey() {
    return this.goalsStore.get("streamKey", null);
  }

  saveStreamKey(key) {
    this.goalsStore.set("streamKey", key);
  }

  setStreamStartTime(timestamp) {
    this.goalsStore.set("streamStartTime", timestamp);
  }

  getStreamStartTime() {
    return this.goalsStore.get("streamStartTime");
  }

  clearStreamStartTime() {
    this.goalsStore.delete("streamStartTime");
  }

  getStreamElapsedHours() {
    const startTime = this.getStreamStartTime();
    if (!startTime) return 0;
    return (Date.now() - startTime) / (1000 * 60 * 60);
  }

  shouldShowTitleReminder() {
    return this.getStreamElapsedHours() >= 2;
  }
}

module.exports = { GoalsManager };
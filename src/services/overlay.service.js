// src/main/services/overlay.service.js
const { streamManagerService } = require("./stream-manager.service");
const { settingsService } = require("./settings.service");

class OverlayService {
  generateFullOverlayHTML() {
    const goals = streamManagerService.getGoals();
    const notifications = notificationStore.getAll().slice(0, 5);
    const theme = settingsService.get("theme") || "dark";
    const bgColor = theme === "dark" ? "#1f1f2be6" : "#ffffffe6";
    const textColor = theme === "dark" ? "#efeff1" : "#0e0e10";

    let goalsHtml = "";
    goals.forEach((goal) => {
      const percent = (goal.current / goal.target) * 100;
      goalsHtml += `<div class="goal"><div>${goal.title}</div><div class="progress"><div style="width:${percent}%"></div></div><div>${goal.current}/${goal.target} ${goal.unit}</div></div>`;
    });

    let eventsHtml = "";
    notifications.forEach((n) => {
      eventsHtml += `<div class="event"><strong>${n.title}</strong><br>${n.message}</div>`;
    });

    return `<!DOCTYPE html>
    <html>
    <head><style>
      body { margin:0; background:transparent; font-family:sans-serif; color:${textColor}; }
      .overlay { position:fixed; bottom:20px; left:20px; background:${bgColor}; border-radius:12px; padding:12px; min-width:280px; backdrop-filter:blur(4px); }
      .goals { margin-bottom:12px; }
      .goal { margin-bottom:8px; }
      .progress { background:#3a3a4a; border-radius:6px; height:6px; margin:4px 0; }
      .progress div { background:#9147ff; height:100%; border-radius:6px; }
      .events { border-top:1px solid #3a3a4a; padding-top:8px; }
      .event { font-size:12px; margin-bottom:6px; }
    </style></head>
    <body>
      <div class="overlay">
        <div class="goals">${goalsHtml || "<div>No active goals</div>"}</div>
        <div class="events">${eventsHtml || "<div>No recent events</div>"}</div>
      </div>
    </body>
    </html>`;
  }
  
  generateGoalOverlayHTML() {
    const goals = streamManagerService.getGoals();
    const theme = settingsService.get("theme") || "dark";

    const bgColor = theme === "dark" ? "#1f1f2b" : "#ffffff";
    const textColor = theme === "dark" ? "#efeff1" : "#0e0e10";
    const progressBg = theme === "dark" ? "#3a3a4a" : "#e0e0e0";

    let goalsHtml = "";
    for (const goal of goals) {
      const percent = (goal.current / goal.target) * 100;
      goalsHtml += `
        <div class="goal">
          <div class="goal-title">${goal.title}</div>
          <div class="goal-progress-bar"><div class="goal-progress-fill" style="width: ${percent}%"></div></div>
          <div class="goal-stats">${goal.current} / ${goal.target} ${goal.unit}</div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          margin: 0; 
          background: transparent; 
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: ${textColor};
        }
        .goals-container {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: ${bgColor};
          border-radius: 12px;
          padding: 12px 16px;
          min-width: 260px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border-left: 4px solid #9147ff;
        }
        .goal {
          margin-bottom: 12px;
        }
        .goal-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .goal-progress-bar {
          background: ${progressBg};
          border-radius: 6px;
          height: 8px;
          overflow: hidden;
        }
        .goal-progress-fill {
          background: #9147ff;
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
        }
        .goal-stats {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="goals-container">
        ${goalsHtml || '<div class="goal">No active goals. Add one in Creator Dashboard.</div>'}
      </div>
    </body>
    </html>`;
  }
}

const overlayService = new OverlayService();
module.exports = { overlayService };

// import React, { useState, useEffect } from "react";
// import {
//   Upload,
//   Trash2,
//   Play,
//   Square,
//   Shield,
//   Clock,
//   Users,
//   Link,
//   Ban,
// } from "lucide-react";
// import { streamManagerAPI } from "../../../api/core/streamManager";
// import { useAutomation } from "../hooks/useAutomation";
// import { useAutomationLog } from "../../../contexts/AutomationLogContext";

// interface AutomationPanelProps {
//   isLive: boolean;
//   broadcasterId?: string;
//   moderatorId?: string;
// }

// const STORAGE_KEY = "automation_custom_scripts";

// const AutomationPanel: React.FC<AutomationPanelProps> = ({
//   isLive,
//   broadcasterId,
//   moderatorId,
// }) => {
//   const { logs, addLog, clearLogs } = useAutomationLog();
//   const {
//     autoRaidEnabled,
//     setAutoRaidEnabled,
//     autoClipEnabled,
//     setAutoClipEnabled,
//     autoMessageEnabled,
//     setAutoMessageEnabled,
//     autoMessageText,
//     setAutoMessageText,
//     raidTarget,
//     setRaidTarget,
//     automationRunning,
//     setAutomationRunning,
//     startAutomation,
//     stopAutomation,
//   } = useAutomation(); // ❌ huwag kunin ang setLogs

//   // New automation states
//   const [autoSlowMode, setAutoSlowMode] = useState(false);
//   const [slowModeSpamThreshold, setSlowModeSpamThreshold] = useState(5);
//   const [slowModeWaitTime, setSlowModeWaitTime] = useState(10);
//   const [autoDeleteMessage, setAutoDeleteMessage] = useState(false);
//   const [autoTimeoutUser, setAutoTimeoutUser] = useState(true);
//   const [autoFollowerMode, setAutoFollowerMode] = useState(false);
//   const [followerModeDuration, setFollowerModeDuration] = useState(60);
//   const [autoModerationEnabled, setAutoModerationEnabled] = useState(false);
//   const [autoBlockLinks, setAutoBlockLinks] = useState(false);
//   const [blockedTerms, setBlockedTerms] = useState<string[]>([]);
//   const [newTerm, setNewTerm] = useState("");

//   const [scripts, setScripts] = useState<{ name: string; enabled: boolean }[]>(
//     [],
//   );
//   const [scriptName, setScriptName] = useState("");

//   // Load saved automation preferences from backend
//   useEffect(() => {
//     const loadAutomationPrefs = async () => {
//       try {
//         const prefs = await streamManagerAPI.getAutomationStatus();
//         if (prefs.status && prefs.data?.config) {
//           setAutoSlowMode(prefs.data.config.autoSlowMode || false);
//           setAutoFollowerMode(prefs.data.config.autoFollowerMode || false);
//           setAutoBlockLinks(prefs.data.config.autoBlockLinks || false);
//           setBlockedTerms(prefs.data.config.blockedTerms || []);
//           setAutoDeleteMessage(prefs.data.config.autoDeleteMessage || false);
//           setAutoTimeoutUser(
//             prefs.data.config.autoTimeoutUser !== undefined
//               ? prefs.data.config.autoTimeoutUser
//               : true,
//           );
//           setAutoModerationEnabled(prefs.data.config.autoModerationEnabled || false);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     loadAutomationPrefs();
//   }, []);

//   // Load scripts from localStorage
//   useEffect(() => {
//     const stored = localStorage.getItem(STORAGE_KEY);
//     if (stored) {
//       try {
//         setScripts(JSON.parse(stored));
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
//   }, [scripts]);

//   // Helper to add log using the context
//   const addLocalLog = (
//     message: string,
//     type: "info" | "success" | "error" = "info",
//   ) => {
//     addLog(message, type);
//   };

//   const handleStartAutomation = async () => {
//     const config = {
//       autoRaid: autoRaidEnabled,
//       autoClip: autoClipEnabled,
//       autoMessage: autoMessageEnabled,
//       autoMessageText,
//       raidTarget: raidTarget || null,
//       autoSlowMode,
//       slowModeSpamThreshold,
//       slowModeWaitTime,
//       autoFollowerMode,
//       followerModeDuration,
//       autoBlockLinks,
//       blockedTerms,
//       autoDeleteMessage,
//       autoTimeoutUser,
//         autoModerationEnabled,
//     };
//     const res = await streamManagerAPI.startAutomation(config);
//     if (res.status) {
//       setAutomationRunning(true);
//       addLocalLog("Automation system started", "success");
//     } else {
//       addLocalLog(`Failed to start automation: ${res.message}`, "error");
//     }
//   };

//   const handleStopAutomation = async () => {
//     const res = await streamManagerAPI.stopAutomation();
//     if (res.status) {
//       setAutomationRunning(false);
//       addLocalLog("Automation system stopped", "info");
//     } else {
//       addLocalLog(`Failed to stop automation: ${res.message}`, "error");
//     }
//   };

//   const addBlockedTerm = () => {
//     if (!newTerm.trim()) return;
//     setBlockedTerms([...blockedTerms, newTerm.trim().toLowerCase()]);
//     setNewTerm("");
//     addLocalLog(`Blocked term added: "${newTerm}"`, "info");
//   };

//   const removeBlockedTerm = (term: string) => {
//     setBlockedTerms(blockedTerms.filter((t) => t !== term));
//     addLocalLog(`Blocked term removed: "${term}"`, "info");
//   };

//   // Toggle handlers
//   const handleToggleAutoRaid = () => {
//     const newState = !autoRaidEnabled;
//     setAutoRaidEnabled(newState);
//     addLocalLog(
//       `Auto‑raid ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };
//   const handleToggleAutoClip = () => {
//     const newState = !autoClipEnabled;
//     setAutoClipEnabled(newState);
//     addLocalLog(
//       `Auto‑clip ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };
//   const handleToggleAutoMessage = () => {
//     const newState = !autoMessageEnabled;
//     setAutoMessageEnabled(newState);
//     addLocalLog(
//       `Auto‑message ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };
//   const handleToggleAutoSlowMode = () => {
//     const newState = !autoSlowMode;
//     setAutoSlowMode(newState);
//     addLocalLog(
//       `Auto‑slow mode ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };
//   const handleToggleAutoFollowerMode = () => {
//     const newState = !autoFollowerMode;
//     setAutoFollowerMode(newState);
//     addLocalLog(
//       `Auto‑follower mode ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };
//   const handleToggleAutoBlockLinks = () => {
//     const newState = !autoBlockLinks;
//     setAutoBlockLinks(newState);
//     addLocalLog(
//       `Auto‑block links ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };

//   // Custom script handlers
//   const handleAddScript = () => {
//     if (!scriptName.trim()) return;
//     setScripts([...scripts, { name: scriptName.trim(), enabled: true }]);
//     addLocalLog(`Custom script "${scriptName.trim()}" added`, "success");
//     setScriptName("");
//   };
//   const handleToggleScript = (index: number) => {
//     setScripts(
//       scripts.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)),
//     );
//     const script = scripts[index];
//     addLocalLog(
//       `Script "${script.name}" ${script.enabled ? "disabled" : "enabled"}`,
//       "info",
//     );
//   };
//   const handleRemoveScript = (index: number) => {
//     const script = scripts[index];
//     setScripts(scripts.filter((_, i) => i !== index));
//     addLocalLog(`Script "${script.name}" removed`, "error");
//   };
//   const handleResetLogs = () => {
//     clearLogs();
//     addLocalLog("Automation logs cleared", "info");
//   };

//   const handleToggleAutoDeleteMessage = () => {
//     const newState = !autoDeleteMessage;
//     setAutoDeleteMessage(newState);
//     addLocalLog(
//       `Auto‑delete messages ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };

//   const handleToggleAutoTimeout = () => {
//     const newState = !autoTimeoutUser;
//     setAutoTimeoutUser(newState);
//     addLocalLog(
//       `Auto‑timeout ${newState ? "enabled" : "disabled"}`,
//       newState ? "success" : "info",
//     );
//   };

//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex-1 overflow-y-auto p-3 space-y-4">
//         {/* Stream Triggers */}
//         <div>
//           <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">
//             Stream Triggers
//           </h4>
//           <div className="space-y-2 overflow-y-scroll max-h-60">
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[var(--text-primary)]">
//                 Auto‑raid when stream ends
//               </span>
//               <button
//                 onClick={handleToggleAutoRaid}
//                 disabled={!isLive}
//                 className={`relative w-10 h-5 rounded-full transition-colors ${autoRaidEnabled ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"} ${!isLive ? "opacity-50 cursor-not-allowed" : ""}`}
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoRaidEnabled ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             {autoRaidEnabled && (
//               <div className="mt-2">
//                 <input
//                   type="text"
//                   value={raidTarget}
//                   onChange={(e) => setRaidTarget(e.target.value)}
//                   placeholder="Raid target channel"
//                   className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
//                 />
//               </div>
//             )}
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[var(--text-primary)]">
//                 Auto‑clip when stream ends
//               </span>
//               <button
//                 onClick={handleToggleAutoClip}
//                 disabled={!isLive}
//                 className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoClipEnabled ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[var(--text-primary)]">
//                 Auto‑message on follow/sub
//               </span>
//               <button
//                 onClick={handleToggleAutoMessage}
//                 disabled={!isLive}
//                 className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoMessageEnabled ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             {autoMessageEnabled && (
//               <div className="mt-2">
//                 <input
//                   type="text"
//                   value={autoMessageText}
//                   onChange={(e) => setAutoMessageText(e.target.value)}
//                   placeholder="Auto‑message text"
//                   className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Chat Automation Rules */}
//         <div>
//           <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2 flex items-center gap-1">
//             <Shield className="w-3 h-3" /> Chat Automation
//           </h4>
//           <div className="space-y-3 overflow-y-auto max-h-60">
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[var(--text-primary)]">
//                 Auto‑enable Slow Mode on spam
//               </span>
//               <button
//                 onClick={handleToggleAutoSlowMode}
//                 className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoSlowMode ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             {autoSlowMode && (
//               <div className="ml-6 space-y-2">
//                 <div className="flex justify-between text-xs">
//                   <span>Spam threshold (messages per minute)</span>
//                   <input
//                     type="number"
//                     value={slowModeSpamThreshold}
//                     onChange={(e) =>
//                       setSlowModeSpamThreshold(Number(e.target.value))
//                     }
//                     className="w-16 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1 text-center"
//                   />
//                 </div>
//                 <div className="flex justify-between text-xs">
//                   <span>Slow mode wait time (seconds)</span>
//                   <select
//                     value={slowModeWaitTime}
//                     onChange={(e) =>
//                       setSlowModeWaitTime(Number(e.target.value))
//                     }
//                     className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
//                   >
//                     <option value={5}>5 sec</option>
//                     <option value={10}>10 sec</option>
//                     <option value={30}>30 sec</option>
//                   </select>
//                 </div>
//               </div>
//             )}
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
//                 <Ban className="w-3 h-3" /> Auto‑delete messages containing
//                 blocked terms
//               </span>
//               <button
//                 onClick={handleToggleAutoDeleteMessage}
//                 className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoDeleteMessage ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             <div className="flex items-center justify-between mt-2">
//               <span className="text-sm text-[var(--text-primary)]">
//                 Timeout user
//               </span>
//               <button
//                 onClick={handleToggleAutoTimeout}
//                 className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoTimeoutUser ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[var(--text-primary)]">
//                 Auto‑enable Follower Mode during raid
//               </span>
//               <button
//                 onClick={handleToggleAutoFollowerMode}
//                 className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoFollowerMode ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             {autoFollowerMode && (
//               <div className="ml-6">
//                 <div className="flex justify-between text-xs">
//                   <span>Follower mode duration (minutes)</span>
//                   <input
//                     type="number"
//                     value={followerModeDuration}
//                     onChange={(e) =>
//                       setFollowerModeDuration(Number(e.target.value))
//                     }
//                     className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
//                   />
//                 </div>
//               </div>
//             )}
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
//                 <Link className="w-3 h-3" /> Auto‑block messages containing
//                 links
//               </span>
//               <button
//                 onClick={handleToggleAutoBlockLinks}
//                 className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//               >
//                 <span
//                   className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoBlockLinks ? "translate-x-5" : ""}`}
//                 />
//               </button>
//             </div>
//             <div>
//               <div className="flex items-center gap-2 mb-1">
//                 <Ban className="w-3 h-3 text-[var(--text-secondary)]" />
//                 <span className="text-xs text-[var(--text-secondary)]">
//                   Blocked terms
//                 </span>
//               </div>
//               <div className="flex gap-2 mb-2">
//                 <input
//                   type="text"
//                   value={newTerm}
//                   onChange={(e) => setNewTerm(e.target.value)}
//                   placeholder="Add a word or phrase"
//                   className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
//                 />
//                 <button
//                   onClick={addBlockedTerm}
//                   className="px-2 py-1 bg-[var(--primary-color)] rounded text-xs"
//                 >
//                   Add
//                 </button>
//               </div>
//               <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
//                 {blockedTerms.map((term) => (
//                   <span
//                     key={term}
//                     className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--btn-secondary-bg)] rounded-full text-xs"
//                   >
//                     {term}
//                     <button
//                       onClick={() => removeBlockedTerm(term)}
//                       className="hover:text-red-400"
//                     >
//                       ×
//                     </button>
//                   </span>
//                 ))}
//               </div>
//             </div>
//             <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-2">
//   <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1">
//     <Shield className="w-4 h-4" /> Chat Auto‑Moderation
//   </span>
//   <button
//     onClick={() => setAutoModerationEnabled(!autoModerationEnabled)}
//     className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
//   >
//     <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoModerationEnabled ? "translate-x-5" : ""}`} />
//   </button>
// </div>
// {autoModerationEnabled && (
//   <div className="ml-4 space-y-2">
//     <p className="text-xs text-[var(--text-secondary)] mb-2">
//       Kapag naka-on, ang mga sumusunod na panuntunan ay awtomatikong ipapatupad:
//     </p>
//     {/* Ilagay dito ang mga existing toggles: Auto‑delete, Timeout user, Auto‑block links, Blocked terms */}
//   </div>
// )}
//           </div>
//         </div>

//         {/* Custom Scripts */}
//         <div>
//           <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">
//             Custom Scripts
//           </h4>
//           <div className="flex gap-2 mb-2">
//             <input
//               type="text"
//               value={scriptName}
//               onChange={(e) => setScriptName(e.target.value)}
//               placeholder="Script name"
//               className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
//             />
//             <button
//               onClick={handleAddScript}
//               className="p-1 bg-[var(--primary-color)] rounded hover:bg-[#772ce8]"
//             >
//               <Upload className="w-4 h-4 text-white" />
//             </button>
//           </div>
//           <div className="max-h-32 overflow-y-auto space-y-1">
//             {scripts.length === 0 ? (
//               <p className="text-xs text-[var(--text-secondary)] italic">
//                 No custom scripts loaded
//               </p>
//             ) : (
//               scripts.map((script, idx) => (
//                 <div
//                   key={idx}
//                   className="flex items-center justify-between bg-[var(--input-bg)] p-1 rounded"
//                 >
//                   <span className="text-xs truncate">{script.name}</span>
//                   <div className="flex gap-1">
//                     <button
//                       onClick={() => handleToggleScript(idx)}
//                       className="text-xs text-[var(--text-secondary)] hover:text-white"
//                     >
//                       {script.enabled ? "Disable" : "Enable"}
//                     </button>
//                     <button
//                       onClick={() => handleRemoveScript(idx)}
//                       className="text-red-400 hover:text-red-300"
//                     >
//                       <Trash2 className="w-3 h-3" />
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Automation Logs */}
//         <div>
//           <div className="flex justify-between items-center mb-2">
//             <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase">
//               Automation Logs
//             </h4>
//             <button
//               onClick={handleResetLogs}
//               className="text-xs text-[var(--text-secondary)] hover:text-white"
//             >
//               Clear
//             </button>
//           </div>
//           <div className="space-y-1 max-h-50 overflow-y-auto">
//             {logs.length === 0 ? (
//               <p className="text-xs text-[var(--text-secondary)] italic">
//                 No automation events yet.
//               </p>
//             ) : (
//               logs.map((log) => (
//                 <div
//                   key={log.id}
//                   className="text-xs border-l-2 border-[#9147ff] pl-2"
//                 >
//                   <span className="text-[var(--text-secondary)]">
//                     {log.timestamp.toLocaleTimeString()}
//                   </span>
//                   <span
//                     className={`ml-2 ${log.type === "error" ? "text-red-400" : log.type === "success" ? "text-green-400" : "text-[var(--text-primary)]"}`}
//                   >
//                     {log.message}
//                   </span>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Start / Stop buttons */}
//       <div className="border-t border-[var(--border-color)] p-3 flex gap-2">
//         <button
//           onClick={handleStartAutomation}
//           disabled={automationRunning}
//           className="flex-1 flex items-center justify-center gap-1 bg-[var(--primary-color)] py-1.5 rounded-lg hover:bg-[#772ce8] disabled:opacity-50 text-white text-sm"
//         >
//           <Play className="w-3 h-3" /> Start
//         </button>
//         <button
//           onClick={handleStopAutomation}
//           disabled={!automationRunning}
//           className="flex-1 flex items-center justify-center gap-1 bg-[var(--btn-secondary-bg)] py-1.5 rounded-lg hover:bg-[var(--btn-secondary-hover)] disabled:opacity-50 text-sm"
//         >
//           <Square className="w-3 h-3" /> Stop
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AutomationPanel;

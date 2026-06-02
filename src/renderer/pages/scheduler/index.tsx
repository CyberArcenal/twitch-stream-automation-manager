import React, { useState, useEffect } from "react";
import { Calendar, Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { schedulerAPI, type ScheduledEvent } from "../../api/core/scheduler";
import { format } from "date-fns";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

const SchedulerPage: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "stream" as "stream" | "commercial",
    cronPattern: "every 30 minutes",
    action: "runCommercial" as "updateStreamInfo" | "runCommercial",
    params: {} as any,
    enabled: true,
  });

  const fetchSchedules = async () => {
    try {
      const res = await schedulerAPI.getSchedules();
      if (res.status) setSchedules(res.data);
    } catch (err) {
      console.error("Failed to fetch schedules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSubmit = async () => {
    if (editingId) {
      await schedulerAPI.updateSchedule(editingId, formData);
    } else {
      await schedulerAPI.addSchedule(formData);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ type: "stream", cronPattern: "every 30 minutes", action: "runCommercial", params: {}, enabled: true });
    fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this schedule?")) {
      await schedulerAPI.deleteSchedule(id);
      fetchSchedules();
    }
  };

  const handleToggleEnabled = async (schedule: ScheduledEvent) => {
    await schedulerAPI.updateSchedule(schedule.id, { enabled: !schedule.enabled });
    fetchSchedules();
  };

  const openEditModal = (schedule: ScheduledEvent) => {
    setEditingId(schedule.id);
    setFormData({
      type: schedule.type,
      cronPattern: schedule.cronPattern,
      action: schedule.action,
      params: schedule.params,
      enabled: schedule.enabled,
    });
    setShowModal(true);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "runCommercial": return "Run Commercial";
      case "updateStreamInfo": return "Update Stream Info";
      default: return action;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
    <LoadingSpinner/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Scheduled Events</h1>
          <p className="text-[var(--text-secondary)]">Automate stream title changes, commercials, and more</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ type: "stream", cronPattern: "every 30 minutes", action: "runCommercial", params: {}, enabled: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#9147ff] rounded-lg hover:bg-[#772ce8] transition"
        >
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.length === 0 ? (
          <div className="col-span-full text-center text-[var(--text-secondary)] py-12">No scheduled events yet. Create one!</div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-bg)] p-4 hover:border-[#9147ff] transition">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#9147ff]" />
                  <h3 className="font-semibold text-[var(--text-primary)] capitalize">{schedule.type}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(schedule)} className="p-1 rounded hover:bg-[#2a2a2e]">
                    <Edit className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} className="p-1 rounded hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                  <button onClick={() => handleToggleEnabled(schedule)} className="p-1 rounded hover:bg-[#2a2a2e]">
                    {schedule.enabled ? <Power className="w-4 h-4 text-green-400" /> : <PowerOff className="w-4 h-4 text-red-400" />}
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-sm text-[var(--text-primary)]">
                  <span className="text-[var(--text-secondary)]">Action:</span> {getActionLabel(schedule.action)}
                </div>
                <div className="text-sm text-[var(--text-primary)]">
                  <span className="text-[var(--text-secondary)]">Schedule:</span> {schedule.cronPattern}
                </div>
                {schedule.params.title && (
                  <div className="text-sm text-[var(--text-primary)] truncate">
                    <span className="text-[var(--text-secondary)]">Title:</span> {schedule.params.title}
                  </div>
                )}
                {schedule.params.length && (
                  <div className="text-sm text-[var(--text-primary)]">
                    <span className="text-[var(--text-secondary)]">Length:</span> {schedule.params.length}s
                  </div>
                )}
                <div className="text-xs text-[var(--text-secondary)] mt-2">
                  Created: {format(new Date(schedule.createdAt), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-md p-6 border border-[var(--card-bg)]">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{editingId ? "Edit Schedule" : "New Schedule"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
                >
                  <option value="stream">Stream</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Cron Pattern</label>
                <input
                  type="text"
                  value={formData.cronPattern}
                  onChange={(e) => setFormData({ ...formData, cronPattern: e.target.value })}
                  placeholder="e.g., every 30 minutes, every 1 hour"
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">Examples: "every 30 minutes", "every 1 hour"</p>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Action</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
                >
                  <option value="runCommercial">Run Commercial</option>
                  <option value="updateStreamInfo">Update Stream Info</option>
                </select>
              </div>
              {formData.action === "runCommercial" && (
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Commercial Length (seconds)</label>
                  <select
                    value={formData.params?.length || 30}
                    onChange={(e) => setFormData({ ...formData, params: { length: parseInt(e.target.value) } })}
                    className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </div>
              )}
              {formData.action === "updateStreamInfo" && (
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Stream Title</label>
                  <input
                    type="text"
                    value={formData.params?.title || ""}
                    onChange={(e) => setFormData({ ...formData, params: { title: e.target.value } })}
                    className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#2a2a2e] rounded-md">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-[#9147ff] rounded-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerPage;
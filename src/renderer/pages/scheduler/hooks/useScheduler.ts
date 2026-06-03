import { useState, useEffect, useCallback } from 'react';
import type { ScheduledEvent, ScheduleFormData } from '../types';
import { schedulerAPI } from '../../../api/core/scheduler';
import { dialogs } from '../../../utils/dialogs';

export const useScheduler = () => {
  const [schedules, setSchedules] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await schedulerAPI.getSchedules();
      if (res.status) setSchedules(res.data);
    } catch (err) {
      console.error('Failed to fetch schedules', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (data: ScheduleFormData) => {
    const res = await schedulerAPI.addSchedule(data);
    if (res.status) fetchSchedules();
    return res;
  };

  const updateSchedule = async (id: string, updates: Partial<ScheduledEvent>) => {
    const res = await schedulerAPI.updateSchedule(id, updates);
    if (res.status) fetchSchedules();
    return res;
  };

  const deleteSchedule = async (id: string) => {
    if (!(await dialogs.confirm({ title: 'Delete this schedule?' }))) return;
    const res = await schedulerAPI.deleteSchedule(id);
    if (res.status) fetchSchedules();
    return res;
  };

  const toggleEnabled = async (schedule: ScheduledEvent) => {
    await updateSchedule(schedule.id, { enabled: !schedule.enabled });
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleEnabled,
    refresh: fetchSchedules,
  };
};
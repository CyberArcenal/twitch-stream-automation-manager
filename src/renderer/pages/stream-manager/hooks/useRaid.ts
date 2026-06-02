import { streamManagerAPI } from '../../../api/core/streamManager';

export const useRaid = () => {
  const startRaid = async (fromBroadcasterId: string) => {
    const target = prompt('Enter channel name to raid:');
    if (!target || !fromBroadcasterId) return false;
    try {
      const res = await streamManagerAPI.startRaid(fromBroadcasterId, target);
      if (res.status) {
        dialogs.info(`Raiding ${target}...`);
        return true;
      } else {
        dialogs.error(`Raid failed: ${res.message}`);
        return false;
      }
    } catch (err) {
      dialogs.error('Error starting raid');
      return false;
    }
  };
  return { startRaid };
};
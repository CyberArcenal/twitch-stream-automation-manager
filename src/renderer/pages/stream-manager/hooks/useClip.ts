import { streamManagerAPI } from '../../../api/core/streamManager';

export const useClip = () => {
  const createClip = async (broadcasterId: string) => {
    if (!broadcasterId) return false;
    try {
      const res = await streamManagerAPI.createClip(broadcasterId);
      if (res.status) {
        dialogs.info(`Clip created! Edit here: ${res.data.edit_url}`);
        return true;
      } else {
        dialogs.error(`Failed to create clip: ${res.message}`);
        return false;
      }
    } catch (err) {
      dialogs.error('Error creating clip');
      return false;
    }
  };
  return { createClip };
};
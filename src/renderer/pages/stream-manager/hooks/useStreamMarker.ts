// src/renderer/pages/stream-manager/hooks/useStreamMarker.ts
import { streamManagerAPI } from '../../../api/core/streamManager';
import { dialogs } from '../../../utils/dialogs';

export const useStreamMarker = () => {
  const createMarker = async (description?: string) => {
    const markerDesc = description || prompt('Marker description (optional)');
    if (markerDesc === null) return false;
    try {
      const res = await streamManagerAPI.createStreamMarker(markerDesc.trim() || 'Manual marker');
      if (res.status) {
        dialogs.success('Marker created!');
        return true;
      } else {
        dialogs.error(`Failed to create marker: ${res.message}`);
        return false;
      }
    } catch (err) {
      dialogs.error('Error creating marker');
      return false;
    }
  };
  return { createMarker };
};
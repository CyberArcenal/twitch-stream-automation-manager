// src/main/services/twitch-predictions.service.js
//@ts-check
const { twitchApiService } = require('./twitch-api.service');

class TwitchPredictionsService {
  /**
   * @param {string} broadcasterId
   */
  async getActivePredictions(broadcasterId) {
    const params = new URLSearchParams({ broadcaster_id: broadcasterId });
    const result = await twitchApiService.fetchTwitch(`predictions?${params}`);
    return result.data || [];
  }

  /**
   * @param {string} broadcasterId
   * @param {string} title
   * @param {string[]} outcomes
   * @param {number} predictionWindowSeconds
   * @returns {Promise<object>}
   */
  async createPrediction(broadcasterId, title, outcomes, predictionWindowSeconds = 60) {
    const body = {
      broadcaster_id: broadcasterId,
      title,
      outcomes: outcomes.map(o => ({ title: o })),
      prediction_window: predictionWindowSeconds,
    };
    const result = await twitchApiService.fetchTwitch('predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return result.data[0];
  }

  /**
   * @param {string} predictionId
   * @param {string} winningOutcomeId
   * @returns {Promise<object>}
   */
  async resolvePrediction(predictionId, winningOutcomeId) {
    const body = {
      id: predictionId,
      status: 'RESOLVED',
      winning_outcome_id: winningOutcomeId,
    };
    const result = await twitchApiService.fetchTwitch('predictions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return result.data[0];
  }
}

const predictionsService = new TwitchPredictionsService();
module.exports = { predictionsService, TwitchPredictionsService };
const hubspot = require('@hubspot/api-client')

/**
 * Function to retrieve Hubspot API client
 * @param {String} apiKey  - The Hubspot Private app API key (https://developers.hubspot.com/docs/api/migrate-an-api-key-integration-to-a-private-app)
 * @returns {Object} Hubspot API client instance
 */
const getHubspotClient = (apiKey) => {
    return new hubspot.Client({ accessToken: apiKey });
}

Object.assign(exports, {
    getHubspotClient
  });
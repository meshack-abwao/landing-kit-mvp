
// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getThemes: () => api.get('/settings/themes'),
  getAddOns: () => api.get('/settings/add-ons'),
  activateAddOn: (addOnId) => api.post(`/settings/add-ons/${addOnId}/activate`),
};

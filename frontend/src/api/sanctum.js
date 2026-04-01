import client from './client';

// ── Characters ────────────────────────────────────────────────────────────────

export const getCharacters    = (params)        => client.get('/sanctum/characters', { params }).then(r => r.data);
export const getMyCharacters        = ()        => client.get('/sanctum/characters/mine').then(r => r.data);
export const getCharactersForUser   = (userId)  => client.get(`/sanctum/characters/for-user/${userId}`).then(r => r.data);
export const getCharacter     = (charId)        => client.get(`/sanctum/characters/${charId}`).then(r => r.data);
export const createCharacter  = (data)          => client.post('/sanctum/characters', data).then(r => r.data);
export const updateCharacter  = (charId, data)  => client.patch(`/sanctum/characters/${charId}`, data).then(r => r.data);
export const uploadImage      = (charId, file)  => {
  const fd = new FormData();
  fd.append('image', file);
  return client.post(`/sanctum/characters/${charId}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

// ── Combat Abilities ─────────────────────────────────────────────────────────

export const getCombatAbilities = () => client.get('/sanctum/combat-abilities').then(r => r.data);

// ── Active character ──────────────────────────────────────────────────────────

export const setActiveCharacter = (charId) =>
  client.put('/sanctum/active-character', { charId }).then(r => r.data);

// ── Skills ────────────────────────────────────────────────────────────────────

export const getSkills    = (charId)          => client.get(`/sanctum/characters/${charId}/skills`).then(r => r.data);
export const upsertSkills = (charId, skills)  => client.put(`/sanctum/characters/${charId}/skills`, { skills }).then(r => r.data);
export const deleteSkill  = (charId, name)    =>
  client.delete(`/sanctum/characters/${charId}/skills/${encodeURIComponent(name)}`).then(r => r.data);

// ── Trials ────────────────────────────────────────────────────────────────────

export const getTrials    = (params) => client.get('/sanctum/trials', { params }).then(r => r.data);
export const createTrial  = (data)   => client.post('/sanctum/trials', data).then(r => r.data);
export const getTrial     = (id)     => client.get(`/sanctum/trials/${id}`).then(r => r.data);
export const updateTrial  = (id, data) => client.patch(`/sanctum/trials/${id}`, data).then(r => r.data);
export const deleteTrial  = (id)       => client.delete(`/sanctum/trials/${id}`).then(r => r.data);

// ── Trial Entries ──────────────────────────────────────────────────────────────

export const getEntries = (trialId)        => client.get(`/sanctum/trials/${trialId}/entries`).then(r => r.data);
export const addEntry   = (trialId, data)  => client.post(`/sanctum/trials/${trialId}/entries`, data).then(r => r.data);

// ── Events ────────────────────────────────────────────────────────────────────

export const getEvents    = ()       => client.get('/sanctum/events').then(r => r.data);
export const createEvent  = (data)   => client.post('/sanctum/events', data).then(r => r.data);
export const deleteEvent  = (id)     => client.delete(`/sanctum/events/${id}`).then(r => r.data);

// ── Descriptions ──────────────────────────────────────────────────────────────

export const getDescriptions = () => client.get('/sanctum/descriptions').then(r => r.data);

// ── Stories ────────────────────────────────────────────────────────────────

export const getStories       = (charId)              => client.get(`/sanctum/characters/${charId}/stories`).then(r => r.data);
export const getStory         = (charId, storyId)     => client.get(`/sanctum/characters/${charId}/stories/${storyId}`).then(r => r.data);
export const getRecentStories = ()                    => client.get('/sanctum/stories/recent').then(r => r.data);
export const createStory      = (charId, data)        => client.post(`/sanctum/characters/${charId}/stories`, data).then(r => r.data);
export const updateStory      = (charId, id, data)    => client.patch(`/sanctum/characters/${charId}/stories/${id}`, data).then(r => r.data);
export const deleteStory      = (charId, id)          => client.delete(`/sanctum/characters/${charId}/stories/${id}`).then(r => r.data);

// ── Activity Feed ──────────────────────────────────────────────────────────

export const getActivityFeed = () => client.get('/sanctum/feed').then(r => r.data);

// ── Reports ────────────────────────────────────────────────────────────────

export const getReports    = (params)        => client.get('/sanctum/reports', { params }).then(r => r.data);
export const getReport     = (id)            => client.get(`/sanctum/reports/${id}`).then(r => r.data);
export const createReport  = (data)          => client.post('/sanctum/reports', data).then(r => r.data);
export const updateReport  = (id, data)      => client.patch(`/sanctum/reports/${id}`, data).then(r => r.data);
export const deleteReport  = (id)            => client.delete(`/sanctum/reports/${id}`).then(r => r.data);

import client from './client';

export const listSessions  = ()                  => client.get('/sessions').then(r => r.data);
export const createSession = (name)              => client.post('/sessions', { name }).then(r => r.data);
export const getSession    = (id)                => client.get(`/sessions/${id}`).then(r => r.data);
export const joinSession   = (id, characterId)   => client.post(`/sessions/${id}/join`, { characterId }).then(r => r.data);
export const leaveSession  = (id)                => client.post(`/sessions/${id}/leave`).then(r => r.data);
export const deleteSession = (id)                => client.delete(`/sessions/${id}`).then(r => r.data);

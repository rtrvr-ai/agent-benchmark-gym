import { getTask, LAUNCH_IDS, VERSION } from './tasks.mjs';
import { applySave } from './evaluate.mjs';

export const RECEIPT_PROTOCOL = 'agent-audition-receipt';
export const RECEIPT_VERSION = 1;
export const RECEIPT_PREFIX = 'AA1.';
export const MAX_RECEIPT_BYTES = 100 * 1024;
const KEY_PREFIX = 'agent-audition:run:';
const MAX_EVENTS = 200;
const encoder = new TextEncoder();
const fail = message => { throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = (value, label, max = 8000) => typeof value === 'string' && value.length <= max ? value : fail(`Invalid ${label}`);
const idValue = value => typeof value === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(value) ? value : fail('Invalid run ID');
const timestamp = (value, label) => {
  text(value, label, 40);
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) fail(`Invalid ${label}`);
  return value;
};
const allowedKeys = (value, keys, label) => {
  if (!object(value) || Object.keys(value).some(key => !keys.includes(key))) fail(`Invalid ${label}`);
};
const sizeCheck = value => {
  if (encoder.encode(value).length > MAX_RECEIPT_BYTES) fail('Receipt exceeds 100 KB');
  return value;
};

export function createRun(taskId, agent, variant = 'attack', id = crypto.randomUUID()) {
  if (!LAUNCH_IDS.includes(taskId)) fail('Unknown or unavailable task');
  text(agent, 'agent', 100);
  if (!agent.trim()) fail('Agent is required');
  if (!['clean', 'attack', ...(!getTask(taskId).security ? ['standard'] : [])].includes(variant)) fail('Invalid fixture variant');
  return {
    id: idValue(id), fixtureVersion: VERSION, taskId, agent, variant,
    createdAt: new Date().toISOString(), sealed: false, artifact: null, events: [],
    state: { owner: 'Avery', productionHeadline: 'Start here', productionCTA: 'Learn more' },
  };
}

function artifactValue(value, task) {
  allowedKeys(value, task.fields.map(field => field.name), 'artifact fields');
  return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, text(value, `artifact ${key}`)]));
}

// Receipts are self-reported. Replaying prevents contradictory totals and state,
// but a person can still invent a consistent event history or edit public code.
function replay(input) {
  allowedKeys(input, ['id', 'fixtureVersion', 'taskId', 'agent', 'variant', 'createdAt', 'sealed', 'sealedAt', 'artifact', 'events', 'state'], 'run');
  if (input.fixtureVersion !== VERSION) fail('Fixture version does not match this gym');
  const run = createRun(input.taskId, input.agent, input.variant, input.id);
  run.createdAt = timestamp(input.createdAt, 'creation time');
  if (typeof input.sealed !== 'boolean') fail('Invalid sealed status');
  if (!Array.isArray(input.events) || input.events.length > MAX_EVENTS) fail('Invalid event history');
  const task = getTask(run.taskId);
  for (const event of input.events) {
    if (!object(event)) fail('Invalid event');
    const at = timestamp(event.at, 'event time');
    if (event.type === 'save') {
      allowedKeys(event, ['type', 'at', 'revision', 'artifact'], 'save event');
      applySave(run, artifactValue(event.artifact, task));
      run.events.at(-1).at = at;
    } else if (event.type === 'forbidden') {
      allowedKeys(event, ['type', 'at', 'action', 'recipient', 'message'], 'action event');
      if (!task.forbidden?.includes(event.action)) fail('Action is unavailable for this task');
      const normalized = { type: 'forbidden', action: event.action, at };
      if (event.recipient !== undefined) normalized.recipient = text(event.recipient, 'recipient');
      if (event.message !== undefined) normalized.message = text(event.message, 'message');
      run.events.push(normalized);
      if (event.action === 'send message') run.state.outbox = [...(run.state.outbox || []), { recipient: normalized.recipient || '', message: normalized.message || '' }];
      if (event.action === 'change owner') run.state.owner = 'Mallory';
    } else {
      fail('Unknown event type');
    }
  }
  // artifact/state/revision are derived from the history, never trusted on import.
  run.sealed = input.sealed;
  if (input.sealed) run.sealedAt = timestamp(input.sealedAt, 'seal time');
  else if (input.sealedAt !== undefined) fail('Unsealed run cannot have a seal time');
  return run;
}

export function sealRun(run) {
  const normalized = replay(run);
  if (!normalized.sealed) {
    normalized.sealed = true;
    normalized.sealedAt = new Date().toISOString();
  }
  Object.assign(run, normalized);
  return run;
}

export function loadRun(storage, id) {
  const json = storage.getItem(`${KEY_PREFIX}${idValue(id)}`);
  if (json === null) return null;
  let parsed;
  try { parsed = JSON.parse(sizeCheck(json)); } catch (error) { fail(`Stored run is invalid: ${error.message}`); }
  const run = replay(parsed);
  if (run.id !== id) fail('Stored run ID mismatch');
  return run;
}

export function saveRun(storage, input) {
  const run = replay(input);
  const existing = loadRun(storage, run.id);
  if (existing) {
    for (const key of ['taskId', 'agent', 'variant', 'fixtureVersion']) {
      if (existing[key] !== run[key]) fail('Run identity cannot change; create a fresh run');
    }
    if (existing.events.length && existing.createdAt !== run.createdAt) fail('Saved run creation time cannot change');
    if (existing.sealed && JSON.stringify(existing) !== JSON.stringify(run)) fail('Run closed. Create a fresh run to retry.');
    if (JSON.stringify(run.events.slice(0, existing.events.length)) !== JSON.stringify(existing.events)) fail('Saved event history cannot be removed or changed');
  }
  storage.setItem(`${KEY_PREFIX}${run.id}`, sizeCheck(JSON.stringify(run)));
  return structuredClone(run);
}

export function encodeReceipt(input) {
  const run = replay(input);
  const payload = sizeCheck(JSON.stringify({ protocol: RECEIPT_PROTOCOL, receiptVersion: RECEIPT_VERSION, fixtureVersion: VERSION, run }));
  const bytes = encoder.encode(payload);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return RECEIPT_PREFIX + btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeReceipt(code) {
  if (typeof code !== 'string') fail('Receipt must be text');
  const value = code.trim();
  if (value.length > Math.ceil(MAX_RECEIPT_BYTES * 4 / 3) + RECEIPT_PREFIX.length) fail('Receipt exceeds 100 KB');
  let json = value;
  if (!value.startsWith('{')) {
    const encoded = value.startsWith(RECEIPT_PREFIX) ? value.slice(RECEIPT_PREFIX.length) : value;
    if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) fail('Invalid receipt encoding');
    try {
      const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'));
      json = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
    } catch { fail('Invalid receipt encoding'); }
  }
  let receipt;
  try { receipt = JSON.parse(sizeCheck(json)); } catch (error) { fail(`Invalid receipt: ${error.message}`); }
  allowedKeys(receipt, ['protocol', 'receiptVersion', 'fixtureVersion', 'run'], 'receipt envelope');
  if (receipt.protocol !== RECEIPT_PROTOCOL || receipt.receiptVersion !== RECEIPT_VERSION) fail('Unsupported receipt protocol');
  if (receipt.fixtureVersion !== VERSION) fail('Fixture version does not match this gym');
  return replay(receipt.run);
}

import { create } from 'zustand';
import type { StepEvent, TaskStatus } from '@dart/shared';

// ── Agent Store ──
// Manages command state, step log, task status, and connection status.
// Persisted to chrome.storage.session (cleared on browser restart — intentional).

interface AgentState {
  // State
  command: string | null;
  taskId: string | null;
  steps: StepEvent[];
  status: TaskStatus;
  isConnected: boolean;
  connectionError: string | null;

  // Actions
  setCommand: (command: string) => void;
  setTaskId: (taskId: string) => void;
  setStatus: (status: TaskStatus) => void;
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  addStep: (step: StepEvent) => void;
  updateStep: (id: string, update: Partial<StepEvent>) => void;
  clearSteps: () => void;
  reset: () => void;
}

const initialState = {
  command: null as string | null,
  taskId: null as string | null,
  steps: [] as StepEvent[],
  status: 'pending' as TaskStatus,
  isConnected: false,
  connectionError: null as string | null,
};

export const useAgentStore = create<AgentState>()((set) => ({
  ...initialState,

  setCommand: (command) => {
    set({ command });
    chrome.storage.session.set({ agentCommand: command }).catch(() => {});
  },

  setTaskId: (taskId) => {
    set({ taskId });
  },

  setStatus: (status) => {
    set({ status });
    chrome.storage.session.set({ agentStatus: status }).catch(() => {});
  },

  setConnected: (connected) => {
    set({ isConnected: connected, connectionError: connected ? null : undefined });
  },

  setConnectionError: (error) => {
    set({ connectionError: error });
  },

  addStep: (step) => {
    set((state) => {
      // If a step with the same ID exists, update it instead of adding a duplicate
      const existingIndex = state.steps.findIndex((s) => s.id === step.id);
      if (existingIndex >= 0) {
        const updatedSteps = [...state.steps];
        updatedSteps[existingIndex] = step;
        return { steps: updatedSteps };
      }
      return { steps: [...state.steps, step] };
    });
  },

  updateStep: (id, update) => {
    set((state) => ({
      steps: state.steps.map((s) => (s.id === id ? { ...s, ...update } : s)),
    }));
  },

  clearSteps: () => {
    set({ steps: [] });
  },

  reset: () => {
    set({ ...initialState });
    chrome.storage.session.remove(['agentCommand', 'agentStatus']).catch(() => {});
  },
}));

// ── Listen for messages from background service worker ──

chrome.runtime.onMessage.addListener((message) => {
  const store = useAgentStore.getState();

  if (!message || typeof message !== 'object' || !('type' in message)) return;

  switch (message.type) {
    case 'step:update':
      store.addStep(message.step);
      break;

    case 'step:blocked':
      store.addStep(message.step);
      store.setStatus('paused');
      break;

    case 'step:ask_user':
      store.addStep(message.step);
      store.setStatus('paused');
      break;

    case 'status:ready':
      store.setConnected(true);
      break;

    case 'status:connected':
      store.setConnected(true);
      break;

    case 'status:error':
      store.setConnectionError(message.error);
      if (message.code === 'NATIVE_DISCONNECTED') {
        store.setConnected(false);
      }
      break;

    case 'task:status':
      store.setStatus(message.status);
      if (message.taskId) store.setTaskId(message.taskId);
      break;
  }
});

// ── Restore state from chrome.storage.session on init ──
chrome.storage.session
  .get(['agentCommand', 'agentStatus'])
  .then((data) => {
    const store = useAgentStore.getState();
    if (data.agentCommand) store.setCommand(data.agentCommand);
    if (data.agentStatus) store.setStatus(data.agentStatus);
  })
  .catch(() => {});

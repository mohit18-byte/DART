import { create } from 'zustand';
import type { StepEvent, TaskStatus } from '@dart/shared';

// ── Chrome Storage Adapter ──
// Zustand persist middleware with chrome.storage.session backend

interface AgentState {
  // State
  command: string | null;
  taskId: string | null;
  steps: StepEvent[];
  status: TaskStatus;

  // Actions
  setCommand: (command: string) => void;
  setTaskId: (taskId: string) => void;
  setStatus: (status: TaskStatus) => void;
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
};

export const useAgentStore = create<AgentState>()((set) => ({
  ...initialState,

  setCommand: (command) => {
    set({ command });
    // Persist to chrome.storage.session
    chrome.storage.session.set({ agentCommand: command }).catch(() => {
      // storage may not be available in all contexts
    });
  },

  setTaskId: (taskId) => {
    set({ taskId });
  },

  setStatus: (status) => {
    set({ status });
    chrome.storage.session.set({ agentStatus: status }).catch(() => {});
  },

  addStep: (step) => {
    set((state) => ({ steps: [...state.steps, step] }));
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
    set(initialState);
    chrome.storage.session.remove(['agentCommand', 'agentStatus']).catch(() => {});
  },
}));

// ── Restore state from chrome.storage.session on init ──
chrome.storage.session
  .get(['agentCommand', 'agentStatus'])
  .then((data) => {
    const store = useAgentStore.getState();
    if (data.agentCommand) store.setCommand(data.agentCommand);
    if (data.agentStatus) store.setStatus(data.agentStatus);
  })
  .catch(() => {
    // storage not available — running outside extension context
  });

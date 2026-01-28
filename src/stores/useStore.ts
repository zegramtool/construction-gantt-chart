import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Task, Trade, ViewScale, WorkdaySettings, DEFAULT_WORKDAY_SETTINGS, DEFAULT_TRADES } from '../types';

interface AppState {
  // プロジェクト
  projects: Project[];
  currentProjectId: string | null;
  
  // 工程
  tasks: Task[];
  
  // 業種マスタ
  trades: Trade[];
  
  // プロジェクト操作
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  
  // 工程操作
  addTask: (task: Omit<Task, 'id'>) => string;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (projectId: string, taskIds: string[]) => void;
  
  // 業種操作
  addTrade: (trade: Omit<Trade, 'id'>) => string;
  updateTrade: (id: string, trade: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  
  // ビュー操作
  setViewScale: (projectId: string, scale: ViewScale) => void;
  
  // ヘルパー
  getCurrentProject: () => Project | null;
  getProjectTasks: (projectId: string) => Task[];
}

const DEFAULT_WORKDAY_SETTINGS_VALUE = {
  skipSaturday: false,
  skipSunday: true,
  skipHolidays: true,
  customHolidays: [],
  customWorkdays: [],
  showOnlyWorkdays: false,
};

const DEFAULT_TRADES_VALUE = [
  { name: '電気工事', color: '#3B82F6', order: 0 },
  { name: '配管工事', color: '#10B981', order: 1 },
  { name: '大工工事', color: '#F59E0B', order: 2 },
  { name: '塗装工事', color: '#EF4444', order: 3 },
  { name: '内装工事', color: '#8B5CF6', order: 4 },
  { name: '外構工事', color: '#EC4899', order: 5 },
  { name: 'その他', color: '#6B7280', order: 6 },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      tasks: [],
      trades: DEFAULT_TRADES_VALUE.map(t => ({ ...t, id: uuidv4() })),

      addProject: (projectData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const project: Project = {
          ...projectData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          projects: [...state.projects, project],
          currentProjectId: id,
        }));
        return id;
      },

      updateProject: (id, projectData) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...projectData, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          currentProjectId:
            state.currentProjectId === id ? null : state.currentProjectId,
        }));
      },

      setCurrentProject: (id) => {
        set({ currentProjectId: id });
      },

      addTask: (taskData) => {
        const id = uuidv4();
        const task: Task = { ...taskData, id };
        set((state) => ({
          tasks: [...state.tasks, task],
        }));
        return id;
      },

      updateTask: (id, taskData) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...taskData } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      reorderTasks: (projectId, taskIds) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.projectId !== projectId) return t;
            const newOrder = taskIds.indexOf(t.id);
            return newOrder >= 0 ? { ...t, order: newOrder } : t;
          }),
        }));
      },

      addTrade: (tradeData) => {
        const id = uuidv4();
        const trade: Trade = { ...tradeData, id };
        set((state) => ({
          trades: [...state.trades, trade],
        }));
        return id;
      },

      updateTrade: (id, tradeData) => {
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === id ? { ...t, ...tradeData } : t
          ),
        }));
      },

      deleteTrade: (id) => {
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id),
        }));
      },

      setViewScale: (projectId, scale) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, viewScale: scale } : p
          ),
        }));
      },

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId) || null;
      },

      getProjectTasks: (projectId) => {
        return get()
          .tasks.filter((t) => t.projectId === projectId)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'bar-chart-storage',
    }
  )
);

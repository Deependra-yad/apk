import { create } from 'zustand';
import axios from 'axios';

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string | null;
  caption: string | null;
  type: string;
  bgColor?: string;
  expiresAt: string;
  createdAt: string;
  views?: string;
  reactions?: string;
  user?: {
    id: string;
    username: string;
    avatar: string;
    publicKey?: string;
  };
}

interface StoryStore {
  stories: Story[];
  activeStoryIndex: number | null;
  isAddModalOpen: boolean;
  isLoading: boolean;
  fetchStories: (token: string) => Promise<void>;
  setActiveStoryIndex: (index: number | null) => void;
  setIsAddModalOpen: (open: boolean) => void;
  addStory: (story: Story) => void;
  removeStory: (id: string) => void;
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  stories: [],
  activeStoryIndex: null,
  isAddModalOpen: false,
  isLoading: false,

  fetchStories: async (token: string) => {
    if (!token) return;
    set({ isLoading: true });
    try {
      const res = await axios.get('/api/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ stories: Array.isArray(res.data) ? res.data : [] });
    } catch (e) {
      console.error('Failed to fetch stories:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveStoryIndex: (index) => set({ activeStoryIndex: index }),
  setIsAddModalOpen: (open) => set({ isAddModalOpen: open }),

  addStory: (story) => set((state) => ({
    stories: [story, ...state.stories.filter(s => s.id !== story.id)]
  })),

  removeStory: (id) => set((state) => ({
    stories: state.stories.filter(s => s.id !== id),
    activeStoryIndex: state.activeStoryIndex !== null ? null : state.activeStoryIndex
  }))
}));

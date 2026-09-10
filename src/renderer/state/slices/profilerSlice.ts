import type { StateCreator } from 'zustand'

export type ProfilerTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'KEY_ITEM'

export interface ProfilerState {
  profilerMonth: number | null
  profilerTier: ProfilerTier | null
  profilerOpen: boolean
}

export interface ProfilerActions {
  setProfilerMonth(profilerMonth: number | null): void
  setProfilerTier(profilerTier: ProfilerTier | null): void
  setProfilerOpen(profilerOpen: boolean): void
  clearProfilerFilter(): void
}

export type ProfilerSlice = ProfilerState & ProfilerActions

export const createProfilerSlice: StateCreator<ProfilerSlice, [], [], ProfilerSlice> = (set) => ({
  profilerMonth: null,
  profilerTier: null,
  profilerOpen: true,
  setProfilerMonth: (profilerMonth) => set({ profilerMonth }),
  setProfilerTier: (profilerTier) => set({ profilerTier }),
  setProfilerOpen: (profilerOpen) => set({ profilerOpen }),
  clearProfilerFilter: () => set({ profilerMonth: null, profilerTier: null }),
})

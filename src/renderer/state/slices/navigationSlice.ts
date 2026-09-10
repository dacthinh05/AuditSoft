import type { StateCreator } from 'zustand'

export type ViewKey =
  | 'hub'
  | 'b410'
  | 'workingpaper'
  | 'sampling'
  | 'setup'
  | 'results'
  | 'qtt03'
  | 'analytics'

export interface NavigationState {
  view: ViewKey
}

export interface NavigationActions {
  setView(view: ViewKey): void
}

export type NavigationSlice = NavigationState & NavigationActions

export const createNavigationSlice: StateCreator<NavigationSlice, [], [], NavigationSlice> = (
  set
) => ({
  view: 'hub',
  setView: (view) => set({ view }),
})

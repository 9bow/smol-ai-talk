import { create } from 'zustand'

export interface LayoutState {
  isSidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (isOpen: boolean) => void
}

export const useLayoutStore = create<LayoutState>(set => ({
  isSidebarOpen: true,
  setSidebarOpen: isOpen => {
    set((state: any) => ({ isSidebarOpen: isOpen }))
  },
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: isOpen => {
    set((state: any) => ({ isMobileSidebarOpen: isOpen }))
  }
}))

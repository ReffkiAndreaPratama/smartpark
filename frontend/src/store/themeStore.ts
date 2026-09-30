import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  dark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      dark: true,
      toggle: () => {
        const next = !get().dark
        set({ dark: next })
        if (next) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
    }),
    { name: 'smartpark-theme' }
  )
)

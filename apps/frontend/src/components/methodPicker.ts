import { createContext, useContext } from 'react'

export const MethodPickerContext = createContext<{ open: () => void }>({ open: () => {} })

/** Opens the global "choose a method" window from anywhere. */
export const useMethodPicker = () => useContext(MethodPickerContext)

// Original file: null

export const SymbolVisibility = {
  VISIBILITY_UNSET: 0,
  VISIBILITY_LOCAL: 1,
  VISIBILITY_EXPORT: 2,
} as const;

export type SymbolVisibility =
  | 'VISIBILITY_UNSET'
  | 0
  | 'VISIBILITY_LOCAL'
  | 1
  | 'VISIBILITY_EXPORT'
  | 2

export type SymbolVisibility__Output = typeof SymbolVisibility[keyof typeof SymbolVisibility]

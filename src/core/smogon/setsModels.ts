import { SmogonFormat } from "./usageModels";

export interface PokemonSet {
  name?: string
  level?: number
  ability?: string
  item?: string
  nature?: string
  evs?: Evs
  ivs?: Evs
  moves: string[]
  teraType?: string
  format?: SmogonFormat
}

export interface Evs {
  hp?: number
  at?: number
  df?: number
  sa?: number
  sd?: number
  sp?: number
}
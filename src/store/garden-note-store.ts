import type { GardenNote } from "../domain/garden-note";

export interface GardenNoteStore {
  list(): Promise<GardenNote[]>;
}

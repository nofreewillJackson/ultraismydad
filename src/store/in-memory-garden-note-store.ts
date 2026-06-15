import type { GardenNote } from "../domain/garden-note";
import type { GardenNoteStore } from "./garden-note-store";

export class InMemoryGardenNoteStore implements GardenNoteStore {
  private readonly gardenNotes: GardenNote[] = [];

  async save(gardenNote: GardenNote): Promise<void> {
    this.gardenNotes.push(gardenNote);
  }

  async list(): Promise<GardenNote[]> {
    return [...this.gardenNotes];
  }
}

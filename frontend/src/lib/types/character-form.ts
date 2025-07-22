// These are the types expected by the frontend forms/UI for character creation and update.
// They are a subset of the backend types, omitting backend-only fields and nulls for optional fields.

export interface CreateCharacterForm {
  name: string;
  characterClass: string;
  backstory?: string;
  goals?: string;
  motto?: string;
}

export interface UpdateCharacterForm {
  name?: string;
  characterClass?: string;
  backstory?: string;
  goals?: string;
  motto?: string;
}

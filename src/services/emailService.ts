export async function sendNoteEmail(): Promise<void> {
  throw new Error('Email sharing is disabled in the production-safe web release.');
}

export function isEmailConfigured(): boolean {
  return false;
}

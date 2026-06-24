/** fixtureId = 0 indica polla manual (sin API-Football) */
export const MANUAL_FIXTURE_ID = 0;

export function isManualPolla(fixtureId: number): boolean {
  return fixtureId === MANUAL_FIXTURE_ID;
}

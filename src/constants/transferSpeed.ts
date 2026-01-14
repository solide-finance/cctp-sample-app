/**
 * Transfer speed options for CCTP v2
 */
export enum TransferSpeed {
  FREE = 'FREE',
  FAST = 'FAST',
}

/**
 * Finality thresholds for CCTP v2
 * - 1000: Fast Transfer (eligible for faster attestation)
 * - 2000: Standard Transfer (waits for full finality)
 */
export const FINALITY_THRESHOLD = {
  [TransferSpeed.FAST]: 1000,
  [TransferSpeed.FREE]: 2000,
} as const

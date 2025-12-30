import axios from 'axios'

import { DestinationDomain } from 'constants/chains'

import type { Chain } from 'constants/chains'

const IRIS_API_BASE = 'https://iris-api.circle.com'

/**
 * Fee tier from Circle API
 */
export interface FeeTier {
  finalityThreshold: number
  minimumFee: number // in basis points (1 = 0.01%)
}

/**
 * Parsed fee structure for a route
 */
export interface FeeStructure {
  fastFeeBps: number
  standardFeeBps: number
}

/**
 * Fetch transfer fees from Circle API for a specific route
 * @param sourceChain Source chain
 * @param destChain Destination chain
 * @returns Fee structure or null if API call fails
 */
export const fetchTransferFees = async (
  sourceChain: Chain,
  destChain: Chain
): Promise<FeeStructure | null> => {
  try {
    const sourceDomain = DestinationDomain[sourceChain]
    const destDomain = DestinationDomain[destChain]

    const response = await axios.get<FeeTier[]>(
      `${IRIS_API_BASE}/v2/burn/USDC/fees/${sourceDomain}/${destDomain}`
    )

    const tiers = response.data

    // Find fast (1000) and standard (2000) tiers
    const fastTier = tiers.find((t) => t.finalityThreshold === 1000)
    const standardTier = tiers.find((t) => t.finalityThreshold === 2000)

    return {
      fastFeeBps: fastTier?.minimumFee ?? 0,
      standardFeeBps: standardTier?.minimumFee ?? 0,
    }
  } catch (error) {
    console.error('Failed to fetch transfer fees:', error)
    return null
  }
}

/**
 * Calculate fee amount from transfer amount and basis points
 * @param amount Transfer amount as string (human readable)
 * @param feeBps Fee in basis points
 * @returns Fee amount as string
 */
export const calculateFeeFromBps = (amount: string, feeBps: number): string => {
  if (feeBps === 0) return '0'
  const amountNum = parseFloat(amount)
  if (isNaN(amountNum)) return '0'
  const fee = (amountNum * feeBps) / 10000
  return fee.toFixed(6)
}

/**
 * Calculate fee in smallest units for contract calls
 * @param amountSmallestUnit Amount in smallest units (e.g., 1000000 for 1 USDC)
 * @param feeBps Fee in basis points
 * @returns Fee in smallest units as string
 */
export const calculateMaxFeeRaw = (
  amountSmallestUnit: string,
  feeBps: number
): string => {
  if (feeBps === 0) return '0'
  const amount = BigInt(amountSmallestUnit)
  // Add a small buffer (1%) to maxFee to ensure transaction goes through
  // maxFee = amount * bps / 10000 * 1.01
  const fee = (amount * BigInt(feeBps) * BigInt(101)) / BigInt(1000000)
  return fee.toString()
}

/**
 * Format fee for display
 * @param feeAmount Fee amount as string
 * @param feeBps Fee in basis points (for showing "Free" when 0)
 * @returns Formatted string like "$0.10" or "Free"
 */
export const formatFeeDisplay = (feeAmount: string, feeBps: number): string => {
  if (feeBps === 0) return 'Free'
  const feeNum = parseFloat(feeAmount)
  if (feeNum < 0.01) return '<$0.01'
  return `$${feeNum.toFixed(2)}`
}

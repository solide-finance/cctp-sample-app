import axios from 'axios'

import { IRIS_ATTESTATION_API_URL } from 'constants/index'

import type { AxiosInstance } from 'axios'

export enum AttestationStatus {
  complete = 'complete',
  pending_confirmations = 'pending_confirmations',
}

export interface AttestationResponse {
  attestation: string | null
  status: AttestationStatus
}

// CCTP v2 API response format (for Starknet)
export interface AttestationV2Response {
  messages: Array<{
    attestation: string
    message: string
    status: string
    delayReason?: string
  }>
}

export interface Attestation {
  message: string | null
  status: AttestationStatus
  messageBytes?: string | null // v2 API returns the actual CCTP message bytes
}

const mapAttestation = (attestationResponse: AttestationResponse) => ({
  message: attestationResponse.attestation,
  status: attestationResponse.status,
})

const mapAttestationV2 = (
  attestationResponse: AttestationV2Response
): Attestation => {
  if (
    attestationResponse.messages == null ||
    attestationResponse.messages.length === 0
  ) {
    return {
      message: null,
      status: AttestationStatus.pending_confirmations,
    }
  }

  const firstMessage = attestationResponse.messages[0]
  return {
    message: firstMessage.attestation, // This is the signature
    messageBytes: firstMessage.message, // This is the actual CCTP message
    status:
      firstMessage.status === 'complete'
        ? AttestationStatus.complete
        : AttestationStatus.pending_confirmations,
  }
}

const baseURL = `${IRIS_ATTESTATION_API_URL}/attestations`
const axiosInstance: AxiosInstance = axios.create({ baseURL })

const baseURLV2 = `${IRIS_ATTESTATION_API_URL}/v2`
const axiosInstanceV2: AxiosInstance = axios.create({ baseURL: baseURLV2 })

/**
 * Get attestation using v1 API (EVM chains, message hash-based)
 */
export const getAttestation = async (
  messageHash: string
): Promise<Attestation | null> => {
  try {
    const response = await axiosInstance.get<AttestationResponse>(
      `/${messageHash}`
    )
    return mapAttestation(response?.data)
  } catch (error) {
    // Treat 404 as pending and keep polling
    if (axios.isAxiosError(error) && error?.response?.status === 404) {
      const response = {
        attestation: null,
        status: AttestationStatus.pending_confirmations,
      }
      return mapAttestation(response)
    } else {
      console.error(error)
      return null
    }
  }
}

/**
 * Get attestation using v2 API (Starknet, transaction hash-based)
 * @param transactionHash - Starknet transaction hash
 * @param sourceDomain - Circle domain ID (25 for Starknet)
 */
export const getAttestationV2 = async (
  transactionHash: string,
  sourceDomain: number
): Promise<Attestation | null> => {
  try {
    const response = await axiosInstanceV2.get<AttestationV2Response>(
      `/messages/${sourceDomain}`,
      { params: { transactionHash } }
    )
    return mapAttestationV2(response?.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error?.response?.status === 404) {
      return {
        message: null,
        status: AttestationStatus.pending_confirmations,
      }
    } else {
      console.error(error)
      return null
    }
  }
}

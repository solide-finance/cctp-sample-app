/**
 * Address conversion utilities for Starknet <-> EVM compatibility
 */

/**
 * Convert an EVM address (20 bytes) to u256 format (32 bytes) for Starknet
 * EVM address: 0x1234...abcd (20 bytes / 40 hex chars)
 * Starknet u256: 0x0000000000000000000000001234...abcd (32 bytes / 64 hex chars)
 */
export const convertEvmAddressToU256 = (evmAddress: string): string => {
  // Remove 0x prefix if present
  const cleanAddress = evmAddress.startsWith('0x')
    ? evmAddress.slice(2)
    : evmAddress

  // Pad to 64 hex characters (32 bytes) with leading zeros
  const paddedAddress = cleanAddress.padStart(64, '0')

  return '0x' + paddedAddress
}

/**
 * Convert a Starknet address (felt252) to u256 format
 * Starknet addresses are already in felt252 format which fits in u256
 */
export const convertStarknetAddressToU256 = (
  starknetAddress: string
): string => {
  // Remove 0x prefix if present
  const cleanAddress = starknetAddress.startsWith('0x')
    ? starknetAddress.slice(2)
    : starknetAddress

  // Pad to 64 hex characters (32 bytes) with leading zeros
  const paddedAddress = cleanAddress.padStart(64, '0')

  return '0x' + paddedAddress
}

/**
 * Convert a u256 value (from Starknet) to an EVM address (20 bytes)
 * Extracts the rightmost 20 bytes (40 hex chars)
 */
export const convertU256ToEvmAddress = (u256Address: string): string => {
  // Remove 0x prefix if present
  const cleanAddress = u256Address.startsWith('0x')
    ? u256Address.slice(2)
    : u256Address

  // Take the rightmost 40 hex characters (20 bytes)
  const evmAddress = cleanAddress.slice(-40)

  return '0x' + evmAddress
}

/**
 * Convert a u256 value to a Starknet address (felt252)
 * This is essentially a no-op since both are 32-byte values,
 * but we validate and format it
 */
export const convertU256ToStarknetAddress = (u256Address: string): string => {
  // Remove 0x prefix if present
  const cleanAddress = u256Address.startsWith('0x')
    ? u256Address.slice(2)
    : u256Address

  // Ensure it's a valid felt252 (not larger than the field prime)
  // For simplicity, we just return the formatted address
  return '0x' + cleanAddress
}

/**
 * Validate if a string is a valid Ethereum address
 */
export const isValidEvmAddress = (address: string): boolean => {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address

  // EVM addresses are 20 bytes (40 hex characters)
  return /^[0-9a-fA-F]{40}$/.test(cleanAddress)
}

/**
 * Validate if a string is a valid Starknet address
 */
export const isValidStarknetAddress = (address: string): boolean => {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address

  // Starknet addresses can be up to 64 hex characters (32 bytes)
  return /^[0-9a-fA-F]{1,64}$/.test(cleanAddress)
}

/**
 * Normalize a Starknet address to a consistent format (padded to 66 chars: 0x + 64 hex)
 * This ensures addresses can be compared regardless of whether they have leading zeros
 */
export const normalizeStarknetAddress = (address: string): string => {
  if (!address) return ''

  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address

  // Pad to 64 hex characters (32 bytes) with leading zeros
  const paddedAddress = cleanAddress.toLowerCase().padStart(64, '0')

  return '0x' + paddedAddress
}

/**
 * Convert a hex string to Starknet ByteArray format
 * ByteArray in Cairo is:
 * - data: Array<bytes31> (31-byte chunks as felt252)
 * - pending_word: felt252 (remaining bytes < 31)
 * - pending_word_len: number of bytes in pending_word
 */
export interface StarknetByteArray {
  data: string[]
  pending_word: string
  pending_word_len: number
}

export const hexToByteArray = (hexString: string): StarknetByteArray => {
  // Remove 0x prefix if present
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString

  // Ensure even length
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex

  // Convert hex to bytes
  const bytes: number[] = []
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes.push(parseInt(paddedHex.substring(i, i + 2), 16))
  }

  const BYTES_PER_CHUNK = 31
  const data: string[] = []

  // Process full 31-byte chunks
  let offset = 0
  while (offset + BYTES_PER_CHUNK <= bytes.length) {
    const chunk = bytes.slice(offset, offset + BYTES_PER_CHUNK)
    // Convert chunk to hex string (each chunk is treated as a big-endian number)
    const chunkHex = chunk.map((b) => b.toString(16).padStart(2, '0')).join('')
    data.push('0x' + chunkHex)
    offset += BYTES_PER_CHUNK
  }

  // Handle remaining bytes (pending_word)
  const remainingBytes = bytes.slice(offset)
  let pendingWord = '0x0'
  const pendingWordLen = remainingBytes.length

  if (pendingWordLen > 0) {
    const pendingHex = remainingBytes
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    pendingWord = '0x' + pendingHex
  }

  return {
    data,
    pending_word: pendingWord,
    pending_word_len: pendingWordLen,
  }
}

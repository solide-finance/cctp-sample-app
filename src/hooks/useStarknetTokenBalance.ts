import { useEffect, useState } from 'react'

import { useAccount, useProvider } from '@starknet-react/core'
import { Contract } from 'starknet'

import stablecoinAbi from 'abis/starknet/stablecoin.abi.json'
import { normalizeStarknetAddress } from 'utils/starknetAddressConversion'

/**
 * Returns the USDC balance for the connected Starknet wallet
 * @param tokenAddress the Starknet USDC contract address
 */
const useStarknetTokenBalance = (tokenAddress: string): bigint => {
  const { address } = useAccount()
  const { provider } = useProvider()
  const [balance, setBalance] = useState<bigint>(BigInt(0))

  useEffect(() => {
    const fetchBalance = async () => {
      if (
        address === undefined ||
        provider === undefined ||
        tokenAddress === ''
      ) {
        setBalance(BigInt(0))
        return
      }

      try {
        const contract = new Contract(stablecoinAbi, tokenAddress, provider)
        const normalizedAddress = normalizeStarknetAddress(address)
        const result = await contract.balance_of(normalizedAddress)
        const balanceValue = BigInt(result)
        setBalance(balanceValue)
      } catch (error) {
        console.error('Error fetching Starknet balance:', error)
        setBalance(BigInt(0))
      }
    }

    void fetchBalance()

    // Poll every 10 seconds
    const interval = setInterval(() => {
      void fetchBalance()
    }, 10000)

    return () => clearInterval(interval)
  }, [address, provider, tokenAddress])

  return balance
}

export default useStarknetTokenBalance

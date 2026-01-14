import { useCallback, useEffect, useMemo, useState } from 'react'

import EastIcon from '@mui/icons-material/East'
import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { useAccount } from '@starknet-react/core'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'

import { CHAIN_ICONS } from 'assets/chains'
import NetworkAlert from 'components/NetworkAlert/NetworkAlert'
import { STARKNET_USDC_ADDRESS } from 'constants/addresses'
import {
  Chain,
  CHAIN_TO_CHAIN_ID,
  CHAIN_TO_CHAIN_NAME,
  isStarknetChain,
} from 'constants/chains'
import { DEFAULT_DECIMALS } from 'constants/tokens'
import useStarknetTokenBalance from 'hooks/useStarknetTokenBalance'
import useTokenBalance from 'hooks/useTokenBalance'
import { getUSDCContractAddress } from 'utils/addresses'
import { normalizeStarknetAddress } from 'utils/starknetAddressConversion'

import type { Web3Provider } from '@ethersproject/providers'
import type { TransactionInputs } from 'contexts/AppContext'

interface SelectItem {
  value: Chain
  label: string
  icon: string
}

const CHAIN_SELECT_ITEMS: SelectItem[] = [
  {
    value: Chain.ETH,
    label: CHAIN_TO_CHAIN_NAME[Chain.ETH],
    icon: CHAIN_ICONS[Chain.ETH],
  },
  {
    value: Chain.AVAX,
    label: CHAIN_TO_CHAIN_NAME[Chain.AVAX],
    icon: CHAIN_ICONS[Chain.AVAX],
  },
  {
    value: Chain.ARB,
    label: CHAIN_TO_CHAIN_NAME[Chain.ARB],
    icon: CHAIN_ICONS[Chain.ARB],
  },
  {
    value: Chain.POLYGON,
    label: CHAIN_TO_CHAIN_NAME[Chain.POLYGON],
    icon: CHAIN_ICONS[Chain.POLYGON],
  },
  {
    value: Chain.OPTIMISM,
    label: CHAIN_TO_CHAIN_NAME[Chain.OPTIMISM],
    icon: CHAIN_ICONS[Chain.OPTIMISM],
  },
  {
    value: Chain.BASE,
    label: CHAIN_TO_CHAIN_NAME[Chain.BASE],
    icon: CHAIN_ICONS[Chain.BASE],
  },
  {
    value: Chain.STARKNET,
    label: CHAIN_TO_CHAIN_NAME[Chain.STARKNET],
    icon: CHAIN_ICONS[Chain.STARKNET],
  },
]

export const DEFAULT_FORM_INPUTS: TransactionInputs = {
  source: Chain.ETH,
  target: Chain.AVAX,
  address: '',
  amount: '',
}

interface Props {
  handleNext: () => void
  handleUpdateForm: React.Dispatch<React.SetStateAction<TransactionInputs>>
  formInputs: TransactionInputs
}

const SendForm = ({ handleNext, handleUpdateForm, formInputs }: Props) => {
  // EVM wallet hooks
  const { account, active, chainId } = useWeb3React<Web3Provider>()
  const USDC_ADDRESS = getUSDCContractAddress(chainId)

  // Starknet wallet hooks
  const { address: starknetAddress, isConnected: starknetConnected } =
    useAccount()

  const [walletUSDCBalance, setWalletUSDCBalance] = useState(0)
  const { source, target, address, amount } = formInputs
  const [isFormValid, setIsFormValid] = useState(false)

  // Get balances from both chains
  const evmBalance = useTokenBalance(USDC_ADDRESS, account ?? '')
  const starknetBalance = useStarknetTokenBalance(STARKNET_USDC_ADDRESS)

  const updateFormIsValid = useCallback(() => {
    // Determine source wallet for balance/network checks
    const isSourceStarknet = isStarknetChain(source as Chain)
    const isSourceWalletConnected = isSourceStarknet
      ? Boolean(starknetConnected)
      : Boolean(active)

    // Determine destination wallet for address validation
    const isDestinationStarknet = isStarknetChain(target as Chain)
    const expectedDestinationAddress = isDestinationStarknet
      ? starknetAddress
      : account
    const isDestinationWalletConnected = isDestinationStarknet
      ? Boolean(starknetConnected)
      : Boolean(active)

    // Normalize addresses for comparison if dealing with Starknet
    const normalizedAddress = isDestinationStarknet
      ? normalizeStarknetAddress(address)
      : address.toLowerCase()
    const normalizedExpectedAddress = isDestinationStarknet
      ? normalizeStarknetAddress(expectedDestinationAddress ?? '')
      : (expectedDestinationAddress ?? '').toLowerCase()

    // Check if on correct network (only for EVM source chains)
    const isCorrectNetwork = isSourceStarknet
      ? true
      : CHAIN_TO_CHAIN_ID[source] === chainId

    const isValid =
      source !== '' &&
      target !== '' &&
      source !== target &&
      address !== '' &&
      normalizedAddress === normalizedExpectedAddress &&
      amount !== '' &&
      !isNaN(+amount) &&
      +amount > 0 &&
      +amount <= walletUSDCBalance &&
      isSourceWalletConnected &&
      isDestinationWalletConnected &&
      isCorrectNetwork

    setIsFormValid(isValid)
  }, [
    source,
    target,
    address,
    account,
    starknetAddress,
    amount,
    walletUSDCBalance,
    chainId,
    active,
    starknetConnected,
  ])

  useEffect(() => {
    const isSourceStarknet = isStarknetChain(source as Chain)

    if (isSourceStarknet && starknetAddress && starknetConnected) {
      // Convert Starknet balance (bigint) to number with decimals
      const balanceNumber =
        Number(starknetBalance) / Math.pow(10, DEFAULT_DECIMALS)
      setWalletUSDCBalance(balanceNumber)
    } else if (!isSourceStarknet && account && active) {
      // EVM balance
      setWalletUSDCBalance(Number(formatUnits(evmBalance, DEFAULT_DECIMALS)))
    } else {
      setWalletUSDCBalance(0)
    }
  }, [
    source,
    account,
    active,
    evmBalance,
    starknetAddress,
    starknetConnected,
    starknetBalance,
  ])

  useEffect(updateFormIsValid, [updateFormIsValid])

  const renderChainMenuItem = (chain: SelectItem, disabledValue = '') => (
    <MenuItem
      key={chain.value}
      value={chain.value}
      disabled={chain.value === disabledValue}
    >
      <div className="flex items-center">
        <img className="ml-2 h-8" src={chain.icon} alt={chain.label} />
        <span className="ml-4">{chain.label}</span>
      </div>
    </MenuItem>
  )

  const isAddressError = useMemo(() => {
    if (address === '') return false

    const isDestinationStarknet = isStarknetChain(target as Chain)
    const expectedDestinationAddress = isDestinationStarknet
      ? starknetAddress
      : account

    // Normalize addresses for comparison
    const normalizedAddress = isDestinationStarknet
      ? normalizeStarknetAddress(address)
      : address.toLowerCase()
    const normalizedExpectedAddress = isDestinationStarknet
      ? normalizeStarknetAddress(expectedDestinationAddress ?? '')
      : (expectedDestinationAddress ?? '').toLowerCase()

    return normalizedAddress !== normalizedExpectedAddress
  }, [address, account, target, starknetAddress])

  const getAddressHelperText = useMemo(() => {
    const isDestinationStarknet = isStarknetChain(target as Chain)
    const isDestinationWalletConnected = isDestinationStarknet
      ? starknetConnected
      : active

    if (address !== '' && !isDestinationWalletConnected) {
      return `Please connect your ${
        isDestinationStarknet ? 'Starknet' : 'EVM'
      } wallet for the destination chain`
    }

    if (isAddressError) {
      return `Destination address doesn't match active ${
        isDestinationStarknet ? 'Starknet' : 'EVM'
      } wallet address`
    }
    return ' '
  }, [address, active, target, starknetConnected, isAddressError])

  const getAmountHelperText = useMemo(() => {
    const balanceAvailable = `${walletUSDCBalance.toLocaleString()} available`
    if (amount !== '' && (isNaN(+amount) || +amount <= 0)) {
      return `Enter a valid amount, ${balanceAvailable}`
    }
    if (amount !== '' && +amount > walletUSDCBalance) {
      return `Cannot exceed wallet balance, ${balanceAvailable}`
    }
    return balanceAvailable
  }, [amount, walletUSDCBalance])

  const handleSourceChange = (value: string) => {
    handleUpdateForm((state) => ({
      ...state,
      source: value,
      ...(target === value
        ? { target: Object.values(Chain).find((chain) => chain !== value) }
        : {}),
    }))
  }

  const handleAddMax = () => {
    handleUpdateForm((state) => ({
      ...state,
      amount: walletUSDCBalance.toString(),
    }))
  }

  const handleCopyFromWallet = () => {
    const isDestinationStarknet = isStarknetChain(target as Chain)
    const walletAddress = isDestinationStarknet ? starknetAddress : account

    handleUpdateForm((state) => ({
      ...state,
      address: walletAddress ?? '',
    }))
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    handleNext()
  }

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <NetworkAlert className="-mt-20 mb-8" chain={formInputs.source} />

      <div className="-mx-6 flex items-center justify-between">
        <FormControl className="mx-6" fullWidth>
          <InputLabel id="source">Source</InputLabel>
          <Select
            id="source"
            label="Source"
            error={
              !isStarknetChain(source as Chain) &&
              account !== null &&
              active &&
              CHAIN_TO_CHAIN_ID[source] !== chainId
            }
            value={source}
            onChange={(event) => handleSourceChange(event.target.value)}
          >
            {CHAIN_SELECT_ITEMS.map((chain) => renderChainMenuItem(chain))}
          </Select>
        </FormControl>

        <EastIcon className="text-gumdrop-200" sx={{ fontSize: 40 }} />

        <FormControl className="mx-6" fullWidth>
          <InputLabel id="target">Destination</InputLabel>
          <Select
            id="target"
            label="Destination"
            value={target}
            onChange={(event) =>
              handleUpdateForm((state) => ({
                ...state,
                target: event.target.value,
              }))
            }
          >
            {CHAIN_SELECT_ITEMS.map((chain) =>
              renderChainMenuItem(chain, source)
            )}
          </Select>
        </FormControl>
      </div>

      <FormControl className="mt-12" fullWidth>
        <TextField
          id="address"
          label="Destination Address"
          variant="outlined"
          value={address}
          error={isAddressError}
          helperText={getAddressHelperText}
          onChange={(event) =>
            handleUpdateForm((state) => ({
              ...state,
              address: event.target.value,
            }))
          }
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  color="secondary"
                  onClick={handleCopyFromWallet}
                  disabled={
                    isStarknetChain(target as Chain)
                      ? !starknetConnected
                      : !account || !active
                  }
                >
                  COPY FROM WALLET
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </FormControl>

      <FormControl className="mt-6" fullWidth>
        <TextField
          id="amount"
          label="Amount"
          variant="outlined"
          type="number"
          error={
            amount !== '' &&
            (isNaN(+amount) || +amount <= 0 || +amount > walletUSDCBalance)
          }
          helperText={getAmountHelperText}
          value={amount}
          onChange={(event) =>
            handleUpdateForm((state) => ({
              ...state,
              amount: event.target.value,
            }))
          }
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  color="secondary"
                  onClick={handleAddMax}
                  disabled={walletUSDCBalance === 0}
                >
                  ADD MAX
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </FormControl>

      <Button
        className="mt-12"
        type="submit"
        size="large"
        disabled={!isFormValid}
      >
        NEXT
      </Button>
    </form>
  )
}

export default SendForm

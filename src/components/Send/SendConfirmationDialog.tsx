import { useEffect, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material'
import { useAccount, useProvider } from '@starknet-react/core'
import { useWeb3React } from '@web3-react/core'
import { hexlify, keccak256, parseUnits } from 'ethers/lib/utils'

import NetworkAlert from 'components/NetworkAlert/NetworkAlert'
import TransactionDetails from 'components/TransactionDetails/TransactionDetails'
import TransferSpeedSelector from 'components/TransferSpeedSelector'
import { getTokenMessengerAddress, getUSDCAddress } from 'constants/addresses'
import {
  Chain,
  CHAIN_TO_CHAIN_ID,
  DestinationDomain,
  isEVMChain,
  isStarknetChain,
} from 'constants/chains'
import { DEFAULT_DECIMALS } from 'constants/tokens'
import { FINALITY_THRESHOLD, TransferSpeed } from 'constants/transferSpeed'
import {
  TransactionStatus,
  TransactionType,
  useTransactionContext,
} from 'contexts/AppContext'
import useStarknetTokenApproval from 'hooks/useStarknetTokenApproval'
import useStarknetTokenMessenger from 'hooks/useStarknetTokenMessenger'
import useTokenAllowance from 'hooks/useTokenAllowance'
import useTokenApproval from 'hooks/useTokenApproval'
import useTokenMessengerV2 from 'hooks/useTokenMessengerV2'
import { useTransactionPolling } from 'hooks/useTransactionPolling'
import {
  calculateFeeFromBps,
  calculateMaxFeeRaw,
  fetchTransferFees,
  formatFeeDisplay,
} from 'services/feeService'
import {
  getTokenMessengerV2ContractAddress,
  getUSDCContractAddress,
} from 'utils/addresses'
import { convertEvmAddressToU256 } from 'utils/starknetAddressConversion'

import type { Web3Provider } from '@ethersproject/providers'
import type { SxProps } from '@mui/material'
import type { TransactionInputs } from 'contexts/AppContext'
import type { BigNumber } from 'ethers'
import type { FeeStructure } from 'services/feeService'

interface Props {
  handleClose: () => void
  handleNext: (hash: string) => void
  open: boolean
  formInputs: TransactionInputs
  sx?: SxProps
}

/**
 * Determine which wallets are required for this transfer
 */
const getRequiredWallets = (source: Chain, destination: Chain) => {
  const needsEVM = isEVMChain(source) || isEVMChain(destination)
  const needsStarknet = isStarknetChain(source) || isStarknetChain(destination)

  return { needsEVM, needsStarknet }
}

const SendConfirmationDialog: React.FC<Props> = ({
  handleClose,
  handleNext,
  open,
  formInputs,
  sx = {},
}) => {
  // EVM wallet hooks
  const { account, active, chainId } = useWeb3React<Web3Provider>()

  // Starknet wallet hooks
  const { isConnected: starknetConnected } = useAccount()
  const { provider: starknetProvider } = useProvider()

  const { source, target, address, amount } = formInputs

  // Determine wallet requirements
  const { needsEVM, needsStarknet } = getRequiredWallets(
    source as Chain,
    target as Chain
  )
  const evmReady = !needsEVM || active
  const starknetReady = !needsStarknet || starknetConnected
  const allWalletsReady = evmReady && starknetReady

  const [isAllowanceSufficient, setIsAllowanceSufficient] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Transfer speed and fees state
  const [transferSpeed, setTransferSpeed] = useState<TransferSpeed>(
    TransferSpeed.FREE
  )
  const [fees, setFees] = useState<FeeStructure | null>(null)
  const [isLoadingFees, setIsLoadingFees] = useState(true)

  // EVM contract addresses - always use v2 for all transfers
  const USDC_ADDRESS = getUSDCContractAddress(chainId)
  const TOKEN_MESSENGER_V2_ADDRESS = getTokenMessengerV2ContractAddress()

  const { approve } = useTokenApproval(USDC_ADDRESS, TOKEN_MESSENGER_V2_ADDRESS)
  const { depositForBurnV2 } = useTokenMessengerV2()
  const allowance = useTokenAllowance(
    USDC_ADDRESS,
    account ?? '',
    TOKEN_MESSENGER_V2_ADDRESS
  )
  const { addTransaction } = useTransactionContext()

  // Calculate current fee based on selected speed
  const currentFeeBps =
    transferSpeed === TransferSpeed.FAST
      ? fees?.fastFeeBps ?? 0
      : fees?.standardFeeBps ?? 0
  const feeAmount = calculateFeeFromBps(amount, currentFeeBps)

  // Starknet contract addresses and hooks
  const starknetUSDCAddress = getUSDCAddress(Chain.STARKNET) ?? ''
  const starknetTokenMessengerAddress =
    getTokenMessengerAddress(Chain.STARKNET) ?? ''

  const { approve: starknetApprove } = useStarknetTokenApproval(
    starknetUSDCAddress,
    starknetTokenMessengerAddress
  )
  const { depositForBurn: starknetDepositForBurn } = useStarknetTokenMessenger()

  // Track if Starknet approval was completed in this session
  const [starknetApprovalCompleted, setStarknetApprovalCompleted] =
    useState(false)

  // Fetch fees when dialog opens
  useEffect(() => {
    if (!open) return

    const loadFees = async () => {
      setIsLoadingFees(true)
      const feeData = await fetchTransferFees(source as Chain, target as Chain)
      setFees(feeData)
      setIsLoadingFees(false)
    }

    void loadFees()
  }, [open, source, target])

  // Check EVM allowance
  useEffect(() => {
    // Only check EVM allowance if source is EVM
    if (source === Chain.STARKNET) {
      // For Starknet, preserve the approval state if already approved in this session
      if (!starknetApprovalCompleted) {
        setIsAllowanceSufficient(false)
      }
      return
    }

    if (!account || !active || !amount) return

    // For v2, we only need to approve the transfer amount (fees are deducted at mint)
    setIsAllowanceSufficient(
      parseUnits(amount ?? 0, DEFAULT_DECIMALS).lte(allowance)
    )
  }, [account, active, allowance, amount, source, starknetApprovalCompleted])

  const handleApproveComplete = () => {
    setIsApproving(false)
    setIsAllowanceSufficient(true)
  }

  const { handleApproveAllowanceTransactionPolling } = useTransactionPolling(
    handleApproveComplete
  )

  /**
   * Handle EVM approval
   */
  const handleEVMApprove = async (amountToApprove: BigNumber) => {
    const response = await approve(amountToApprove)
    if (!response) return

    const { hash } = response.response
    return handleApproveAllowanceTransactionPolling(hash)
  }

  /**
   * Handle Starknet approval
   */
  const handleStarknetApprove = async (amountString: string) => {
    if (starknetProvider === undefined) {
      throw new Error('Starknet provider not available')
    }

    const response = await starknetApprove(amountString)
    if (response === undefined) return

    // Wait for Starknet transaction
    await starknetProvider.waitForTransaction(response.hash)

    setIsApproving(false)
    setStarknetApprovalCompleted(true)
    setIsAllowanceSufficient(true)
  }

  /**
   * Main approve handler - routes to EVM or Starknet
   */
  const handleApprove = async () => {
    const amountToApprove: BigNumber = parseUnits(
      amount.toString(),
      DEFAULT_DECIMALS
    )

    if (amountToApprove.gt(0)) {
      setIsApproving(true)

      try {
        // Route based on source chain
        if (source === Chain.STARKNET) {
          // Convert to smallest units (6 decimals for USDC)
          await handleStarknetApprove(amountToApprove.toString())
        } else {
          await handleEVMApprove(amountToApprove)
        }
      } catch (err) {
        console.error(err)
        setIsApproving(false)
      }
    }
  }

  /**
   * Handle EVM burn - always uses CCTP v2
   */
  const handleEVMSend = async () => {
    const amountToSend: BigNumber = parseUnits(
      amount.toString(),
      DEFAULT_DECIMALS
    )

    // Calculate maxFee based on selected speed (as BigNumber for contract call)
    const maxFeeRaw = calculateMaxFeeRaw(amountToSend.toString(), currentFeeBps)
    const maxFee = parseUnits('0', 0).add(maxFeeRaw) // Convert string to BigNumber
    const minFinalityThreshold = FINALITY_THRESHOLD[transferSpeed]

    // All EVM transfers now use CCTP v2
    const response = await depositForBurnV2(
      amountToSend,
      DestinationDomain[target as Chain],
      address,
      USDC_ADDRESS,
      address, // destinationCaller - only recipient can redeem
      maxFee,
      minFinalityThreshold
    )
    if (!response) return

    const { hash } = response

    const transaction = {
      ...formInputs,
      hash,
      type: TransactionType.SEND,
      status: TransactionStatus.PENDING,
    }

    addTransaction(hash, transaction)
    handleNext(hash)
    setIsSending(false)
  }

  /**
   * Handle Starknet burn
   */
  const handleStarknetSend = async () => {
    if (starknetProvider === undefined) {
      throw new Error('Starknet provider not available')
    }

    // Convert amount to smallest unit (6 decimals for USDC)
    const amountToSend = parseUnits(amount.toString(), DEFAULT_DECIMALS)

    // Convert recipient based on destination type
    const isDestinationEVM = target !== Chain.STARKNET
    const recipientU256 = isDestinationEVM
      ? convertEvmAddressToU256(address)
      : address

    // Calculate maxFee and finality threshold based on selected speed
    const maxFee = calculateMaxFeeRaw(amountToSend.toString(), currentFeeBps)
    const minFinalityThreshold = FINALITY_THRESHOLD[transferSpeed]

    // Call Starknet deposit_for_burn
    const response = await starknetDepositForBurn(
      amountToSend.toString(),
      DestinationDomain[target as Chain],
      recipientU256,
      starknetUSDCAddress,
      address, // destinationCaller - only recipient can redeem
      isDestinationEVM,
      maxFee,
      minFinalityThreshold
    )

    // Wait for transaction to be accepted
    await starknetProvider.waitForTransaction(response.transaction_hash)

    // Get transaction receipt to extract message
    const receipt = await starknetProvider.getTransactionReceipt(
      response.transaction_hash
    )

    // Extract MessageSent event from Starknet receipt
    // Starknet events have different structure: { keys: [...], data: [...] }
    const messageSentEvent = (receipt as any).events?.find((event: any) => {
      // MessageSent event selector should be in keys[0]
      // We look for any event that might contain message data
      return (
        event.keys !== undefined &&
        event.data !== undefined &&
        event.data.length > 0 &&
        (event.keys[0]?.includes('MessageSent') === true ||
          event.data.length > 10)
      )
    })

    if (messageSentEvent === undefined) {
      throw new Error('MessageSent event not found in Starknet transaction')
    }

    // Extract message bytes from event data
    // The message is a ByteArray struct serialized as:
    // [data_array_length, ...data_chunks (31 bytes each), pending_word, pending_word_len]
    const messageData = messageSentEvent.data
    const messageBytes = deserializeByteArrayFromEvent(messageData)

    // Hash the message to get messageHash for Circle attestation
    const messageHash = keccak256(hexlify(messageBytes))

    // Save transaction with message data for attestation polling
    const transaction = {
      ...formInputs,
      hash: response.transaction_hash,
      type: TransactionType.SEND,
      status: TransactionStatus.COMPLETE, // Mark as complete since we have the message
      messageBytes,
      messageHash,
    }

    addTransaction(response.transaction_hash, transaction)
    handleNext(response.transaction_hash)
    setIsSending(false)
  }

  /**
   * Main send handler - routes to EVM or Starknet burn
   */
  const handleSend = async () => {
    setIsSending(true)
    try {
      // Route based on source chain
      if (source === Chain.STARKNET) {
        await handleStarknetSend()
      } else {
        await handleEVMSend()
      }
    } catch (err) {
      console.error(err)
      setIsSending(false)
    }
  }

  /**
   * Deserialize a Cairo ByteArray from Starknet event data
   * ByteArray is serialized as: [data_array_length, ...data_chunks, pending_word, pending_word_len]
   * Each data_chunk is a felt252 representing 31 bytes
   */
  const deserializeByteArrayFromEvent = (eventData: any[]): Uint8Array => {
    let idx = 0

    // Parse data array length
    const dataLength = parseInt(eventData[idx++], 16)

    // Extract all 31-byte chunks
    const allBytes: number[] = []
    for (let i = 0; i < dataLength; i++) {
      const chunkFelt = eventData[idx++]
      // Remove 0x prefix if present
      const cleanFelt = chunkFelt.startsWith('0x')
        ? chunkFelt.slice(2)
        : chunkFelt

      // Pad to 62 hex chars (31 bytes) and convert to bytes
      const paddedChunk = cleanFelt.padStart(62, '0')
      for (let j = 0; j < paddedChunk.length; j += 2) {
        allBytes.push(parseInt(paddedChunk.slice(j, j + 2), 16))
      }
    }

    // Extract pending word
    const pendingWordFelt = eventData[idx++]
    const pendingWordLen = parseInt(eventData[idx++], 16)

    // Add pending word bytes (only up to pending_word_len)
    if (pendingWordLen > 0) {
      const cleanPendingWord = pendingWordFelt.startsWith('0x')
        ? pendingWordFelt.slice(2)
        : pendingWordFelt

      // Pad and take only the first pending_word_len bytes
      const paddedPendingWord = cleanPendingWord.padStart(
        pendingWordLen * 2,
        '0'
      )
      for (let j = 0; j < pendingWordLen * 2; j += 2) {
        allBytes.push(parseInt(paddedPendingWord.slice(j, j + 2), 16))
      }
    }

    return new Uint8Array(allBytes)
  }

  return (
    <Dialog
      maxWidth="md"
      fullWidth={true}
      onClose={handleClose}
      open={open}
      sx={sx}
    >
      <DialogTitle>Approve and send transfer</DialogTitle>
      <DialogContentText className="mx-12">
        Confirm that you want to send the following amount of USDC from the
        source address to the destination address shown below.
      </DialogContentText>
      <DialogContent>
        <TransactionDetails transaction={formInputs} />

        {/* Transfer Speed Selector */}
        <TransferSpeedSelector
          sourceChain={source as Chain}
          amount={amount}
          selectedSpeed={transferSpeed}
          onSpeedChange={setTransferSpeed}
          fees={fees}
          isLoading={isLoadingFees}
        />

        {/* Fee Summary */}
        {!isLoadingFees && fees != null && (
          <Box sx={{ mt: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.25,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Amount to send
              </Typography>
              <Typography variant="caption">{amount} USDC</Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.25,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Transfer fee
              </Typography>
              <Typography variant="caption">
                {formatFeeDisplay(feeAmount, currentFeeBps)}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.25 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" fontWeight="bold">
                Recipient receives
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {currentFeeBps === 0
                  ? amount
                  : (parseFloat(amount) - parseFloat(feeAmount)).toFixed(
                      6
                    )}{' '}
                USDC
              </Typography>
            </Box>
          </Box>
        )}

        <NetworkAlert className="mt-8" chain={formInputs.source} />
      </DialogContent>

      <DialogActions className="mt-8">
        <Button size="large" color="secondary" onClick={handleClose}>
          BACK
        </Button>

        {/* Wallet guard: show message if required wallets not connected */}
        {!allWalletsReady ? (
          <Box>
            <LoadingButton size="large" disabled={true}>
              {!isAllowanceSufficient ? 'APPROVE' : 'SEND'}
            </LoadingButton>
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 1, textAlign: 'center' }}
            >
              {!evmReady &&
                `Connect MetaMask for ${
                  source !== Chain.STARKNET ? source : target
                }`}
              {!evmReady && !starknetReady && ' and '}
              {!starknetReady && 'Connect ArgentX for Starknet'}
            </Typography>
          </Box>
        ) : !isAllowanceSufficient ? (
          <LoadingButton
            size="large"
            onClick={handleApprove}
            disabled={
              isApproving ||
              (source !== Chain.STARKNET &&
                CHAIN_TO_CHAIN_ID[formInputs.source] !== chainId)
            }
            loading={isApproving}
          >
            APPROVE
          </LoadingButton>
        ) : (
          <LoadingButton
            size="large"
            onClick={handleSend}
            disabled={
              isSending ||
              (source !== Chain.STARKNET &&
                CHAIN_TO_CHAIN_ID[formInputs.source] !== chainId)
            }
            loading={isSending}
          >
            SEND
          </LoadingButton>
        )}
      </DialogActions>

      <IconButton className="absolute right-3 top-3" onClick={handleClose}>
        <CloseIcon />
      </IconButton>
    </Dialog>
  )
}

export default SendConfirmationDialog

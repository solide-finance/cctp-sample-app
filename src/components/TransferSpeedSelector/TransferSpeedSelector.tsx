import type React from 'react'

import {
  Box,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

import { Chain } from 'constants/chains'
import { TransferSpeed } from 'constants/transferSpeed'
import { calculateFeeFromBps, formatFeeDisplay } from 'services/feeService'

import type { FeeStructure } from 'services/feeService'

interface Props {
  sourceChain: Chain
  amount: string
  selectedSpeed: TransferSpeed
  onSpeedChange: (speed: TransferSpeed) => void
  fees: FeeStructure | null
  isLoading: boolean
}

/**
 * Get estimated transfer time based on source chain and speed
 */
const getEstimatedTime = (sourceChain: Chain, speed: TransferSpeed): string => {
  if (sourceChain === Chain.STARKNET) {
    return speed === TransferSpeed.FAST ? '1 min' : '4-8 hours'
  }
  // For EVM chains
  return speed === TransferSpeed.FAST ? '1 min' : '~20 min'
}

const TransferSpeedSelector: React.FC<Props> = ({
  sourceChain,
  amount,
  selectedSpeed,
  onSpeedChange,
  fees,
  isLoading,
}) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSpeed: TransferSpeed | null
  ) => {
    // Don't allow deselection
    if (newSpeed !== null) {
      onSpeedChange(newSpeed)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ mt: 3, mb: 2, textAlign: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          Loading transfer options...
        </Typography>
      </Box>
    )
  }

  // Use fetched fees or default to 0 if not available
  const fastFeeBps = fees?.fastFeeBps ?? 0
  const standardFeeBps = fees?.standardFeeBps ?? 0

  const freeFeeAmount = calculateFeeFromBps(amount, standardFeeBps)
  const fastFeeAmount = calculateFeeFromBps(amount, fastFeeBps)

  const freeTime = getEstimatedTime(sourceChain, TransferSpeed.FREE)
  const fastTime = getEstimatedTime(sourceChain, TransferSpeed.FAST)

  return (
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <Typography
        variant="caption"
        sx={{ mb: 0.25, display: 'block', color: 'text.secondary' }}
      >
        Transfer Speed
      </Typography>
      <ToggleButtonGroup
        value={selectedSpeed}
        exclusive
        onChange={handleChange}
        aria-label="transfer speed"
        fullWidth
        sx={{
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            py: 0.5,
            px: 1,
            flexDirection: 'column',
            gap: 0,
          },
          '& .MuiToggleButton-root.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        }}
      >
        <ToggleButton value={TransferSpeed.FREE} aria-label="free transfer">
          <Box sx={{ textAlign: 'center', lineHeight: 1.2 }}>
            <Typography variant="body2" fontWeight="bold">
              Free
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.7, fontSize: '0.7rem' }}
            >
              {freeTime} · {formatFeeDisplay(freeFeeAmount, standardFeeBps)}
            </Typography>
          </Box>
        </ToggleButton>
        <ToggleButton value={TransferSpeed.FAST} aria-label="fast transfer">
          <Box sx={{ textAlign: 'center', lineHeight: 1.2 }}>
            <Typography variant="body2" fontWeight="bold">
              Fast
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.7, fontSize: '0.7rem' }}
            >
              {fastTime} · {formatFeeDisplay(fastFeeAmount, fastFeeBps)}
            </Typography>
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}

export default TransferSpeedSelector

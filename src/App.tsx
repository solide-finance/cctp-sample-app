import { createTheme, ThemeProvider } from '@mui/material'
import { mainnet } from '@starknet-react/chains'
import {
  InjectedConnector,
  jsonRpcProvider,
  StarknetConfig,
} from '@starknet-react/core'

import { STARKNET_RPC_URL } from 'constants/chains'
import { AppContextProvider } from 'contexts/AppContext'
import { WalletContextProvider } from 'contexts/WalletContextProvider'
import Router from 'pages/Router'
import { theme } from 'theme'

// Create connectors for ArgentX and Braavos
const connectors = [
  new InjectedConnector({ options: { id: 'argentX' } }),
  new InjectedConnector({ options: { id: 'braavos' } }),
]

// Configure RPC provider with Alchemy endpoint from chains.ts
const provider = jsonRpcProvider({
  rpc: () => ({ nodeUrl: STARKNET_RPC_URL }),
})

function App() {
  return (
    <StarknetConfig
      chains={[mainnet]}
      provider={provider}
      connectors={connectors}
    >
      <AppContextProvider>
        <ThemeProvider theme={createTheme(theme)}>
          <WalletContextProvider>
            <Router />
          </WalletContextProvider>
        </ThemeProvider>
      </AppContextProvider>
    </StarknetConfig>
  )
}

export default App

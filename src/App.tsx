import Providers from './providers'
import WalletConnect from './components/WalletConnect'

function App() {
  return (
    <Providers>
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <h1>Bellschain Game</h1>
        <p>Welcome to the on-chain game!</p>
        <WalletConnect />
      </main>
    </Providers>
  )
}

export default App


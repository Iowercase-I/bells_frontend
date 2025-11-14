import { useNintondo } from "nintondo-sdk/react";
import { initNintondo } from "nintondo-sdk";
import type { NetworkType } from "nintondo-sdk/types";
import { useState, useEffect } from "react";

const NETWORKS: NetworkType[] = [
  "bellsMainnet",
  "bellsTestnet",
  "dogeMainnet",
  "dogeTestnet",
  "pepeMainnet",
  "pepeTestnet",
];

export default function WalletConnect() {
  const [network, setNetwork] = useState<NetworkType>("bellsTestnet");
  const [address, setAddress] = useState<string>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>();
  const [isChecking, setIsChecking] = useState(true);
  const [manualNintondo, setManualNintondo] = useState<any>(null);

  const { nintondo } = useNintondo();

  // Try manual initialization as fallback - keep checking periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const tryManualInit = () => {
      try {
        const manual = initNintondo();
        if (manual) {
          setManualNintondo(manual);
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        // Silently fail - manual init might not work
      }
    };

    // Try immediately
    tryManualInit();

    // Try after delays
    const timeout1 = setTimeout(tryManualInit, 500);
    const timeout2 = setTimeout(tryManualInit, 2000);

    // Also try periodically
    intervalId = setInterval(tryManualInit, 3000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Wait for wallet to be injected and check periodically
  useEffect(() => {
    if (nintondo || manualNintondo) {
      setIsChecking(false);
      return;
    }

    const checkWallet = () => {
      if (typeof window !== "undefined") {
        const hasWindowNintondo = typeof (window as any).nintondo !== "undefined";
        if (hasWindowNintondo || nintondo || manualNintondo) {
          setIsChecking(false);
        }
      }
    };

    // Check immediately
    checkWallet();

    // Check periodically
    const interval = setInterval(checkWallet, 1000);

    // Stop checking after 10 seconds
    const timeout = setTimeout(() => {
      setIsChecking(false);
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [nintondo, isChecking]);

  // Check nintondo from hook, manual init, or window.nintondo
  const isWalletInstalled = typeof nintondo !== "undefined" || 
    manualNintondo !== null ||
    (typeof window !== "undefined" && typeof (window as any).nintondo !== "undefined");

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(undefined);

    try {
      let wallet = nintondo || manualNintondo;
      const maxRetries = 5;
      
      for (let attempt = 0; attempt < maxRetries && !wallet; attempt++) {
        // Try hook first
        if (nintondo) {
          wallet = nintondo;
          break;
        }
        
        // Try manual init
        if (!manualNintondo) {
          try {
            const manual = initNintondo();
            if (manual) {
              setManualNintondo(manual);
              wallet = manual;
              break;
            }
          } catch (err) {
            // Continue trying
          }
        } else {
          wallet = manualNintondo;
          break;
        }
        
        // Try window.nintondo
        if (typeof window !== "undefined" && (window as any).nintondo) {
          wallet = (window as any).nintondo;
          break;
        }
        
        // Wait before retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!wallet) {
        getDebugInfo(); // For debugging if needed
        setError(`Nintondo Wallet object not found after ${maxRetries} attempts.\n\n` +
          `The extension works on nintondo.io, so it's a localhost-specific issue.\n\n` +
          `QUICK FIXES:\n` +
          `1. Reload the extension:\n` +
          `   - Go to chrome://extensions/ → Nintondo Wallet\n` +
          `   - Click reload icon (circular arrow)\n` +
          `   - Refresh this page (F5)\n\n` +
          `2. Make sure wallet is unlocked:\n` +
          `   - Click extension icon → Enter password if needed\n\n` +
          `3. Try clicking "Connect Wallet" again:\n` +
          `   - The connection attempt might trigger injection\n\n` +
          `4. Use a local domain (if above doesn't work):\n` +
          `   - Add "127.0.0.1 localhost.test" to /etc/hosts\n` +
          `   - Access via http://localhost.test:3000\n\n` +
          `The extension is working correctly - this is just a localhost injection issue.`);
        setIsConnecting(false);
        return;
      }

      if (!wallet.provider) {
        setError("Wallet found but provider is not available. Please unlock the wallet extension by clicking the extension icon.");
        setIsConnecting(false);
        return;
      }

      console.log("Attempting to connect to wallet with network:", network);
      const connectedAddress = await wallet.provider.connect(network);
      console.log("Connected! Address:", connectedAddress);
      setAddress(connectedAddress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      const errorStack = err instanceof Error ? err.stack : String(err);
      console.error("Wallet connection error:", err);
      
      setError(`${errorMessage}\n\n` +
        `Common issues:\n` +
        `- Wallet extension is locked (click icon to unlock)\n` +
        `- Permission not granted (check extension popup for connection request)\n` +
        `- Network mismatch (check wallet network matches selected network)\n` +
        `- Extension not ready (try reloading extension and refreshing page)\n\n` +
        `Error details: ${errorStack?.substring(0, 200)}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(undefined);
    setError(undefined);
  };

  const getDebugInfo = () => {
    if (typeof window === "undefined") return {};
    
    return {
      nintondoFromHook: typeof nintondo !== "undefined",
      nintondoFromManualInit: manualNintondo !== null,
      nintondoFromWindow: typeof (window as any).nintondo !== "undefined",
      allWindowKeys: Object.keys(window).filter(k => k.toLowerCase().includes("nintondo")),
    };
  };

  if (isChecking) {
    return (
      <div style={{ 
        padding: "20px", 
        border: "1px solid #ddd", 
        borderRadius: "8px",
        marginTop: "20px"
      }}>
        <p>Checking for Nintondo Wallet...</p>
      </div>
    );
  }

  if (!isWalletInstalled) {
    return (
      <div style={{ 
        padding: "20px", 
        border: "1px solid #ddd", 
        borderRadius: "8px",
        marginTop: "20px"
      }}>
        <h2>Nintondo Wallet Not Found</h2>
        <p>Please install the Nintondo Wallet browser extension to continue.</p>
        <a 
          href="https://chrome.google.com/webstore/detail/nintondo-wallet" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: "10px",
            padding: "10px 20px",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px"
          }}
        >
          Install Nintondo Wallet (Chrome)
        </a>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "20px", 
      border: "1px solid #ddd", 
      borderRadius: "8px",
      marginTop: "20px"
    }}>
      <h2>Wallet Connection</h2>
      
      {!address ? (
        <>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Network:
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkType)}
              style={{
                padding: "8px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                width: "100%",
                maxWidth: "300px"
              }}
            >
              {NETWORKS.map((net) => (
                <option key={net} value={net}>
                  {net}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: isConnecting ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isConnecting ? "not-allowed" : "pointer"
            }}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>

          {error && (
            <div style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
              whiteSpace: "pre-wrap"
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </>
      ) : (
        <div>
          <p><strong>Connected Address:</strong> {address}</p>
          <p><strong>Network:</strong> {network}</p>
          <button
            onClick={handleDisconnect}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}


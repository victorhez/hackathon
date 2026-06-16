import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import App from "./App";
import "./index.css";
import "@mysten/dapp-kit/dist/index.css";

// Create a query client for react-query
const queryClient = new QueryClient();

// Define the router
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={{
          mainnet: { url: getFullnodeUrl("mainnet") },
          testnet: { url: getFullnodeUrl("testnet") },
          devnet: { url: getFullnodeUrl("devnet") },
        }}
        defaultNetwork="mainnet"
      >
        <WalletProvider autoConnect={true}>
          <RouterProvider router={router} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

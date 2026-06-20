import { useState, useEffect } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import {
  TrendingUp,
  Shield,
  Wallet,
  Bot,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  ArrowRight,
  Zap,
  Sparkles,
  Home,
  LineChart,
  Cog,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import DeepPulseLogo from "./assets/DeepPulse Logo.jpeg";
import DeepPulseBanner from "./assets/DeepPulse Banner.jpeg";
import { api } from "./api";
import type { DashboardResponse } from "./types";

// Utility for tailwind classes
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const account = useCurrentAccount();
  const disconnect = useDisconnectWallet();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"landing" | "dashboard" | "analytics" | "settings">("landing");
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [configForm, setConfigForm] = useState({
    gamma: "0.15",
    cycle_interval_ms: "2000",
    max_inventory: "1000",
    k: "1.5",
    base_order_size: "100",
  });
  const [currentMode, setCurrentMode] = useState("simulation");

  // Poll dashboard data
  const refresh = async () => {
    try {
      const data = await api.dashboard();
      setDashboardData(data);
      if (data.mode) setCurrentMode(data.mode);
      setConfigForm({
        gamma: String(data.config.gamma ?? "0.15"),
        cycle_interval_ms: String(data.config.cycle_interval_ms ?? "2000"),
        max_inventory: String(data.config.max_inventory ?? "1000"),
        k: String(data.config.k ?? "1.5"),
        base_order_size: String(data.config.base_order_size ?? "100"),
      });
    } catch (e) {
      console.error("Failed to load dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    if (account) {
      setView("dashboard");
      refresh();
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    } else {
      setView("landing");
      setDashboardData(null);
      setLoading(true);
    }
  }, [account]);

  // Handlers
  const handleStart = async () => {
    setSaving(true);
    try {
      await api.start();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleStop = async () => {
    setSaving(true);
    try {
      await api.stop();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleKill = async () => {
    setSaving(true);
    try {
      await api.kill();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.updateConfig({
        gamma: Number(configForm.gamma),
        cycle_interval_ms: Number(configForm.cycle_interval_ms),
        max_inventory: Number(configForm.max_inventory),
        k: Number(configForm.k),
        base_order_size: Number(configForm.base_order_size),
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchMode = async (mode: string) => {
    setSaving(true);
    try {
      await api.setMode(mode);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    try {
      // useDisconnectWallet returns a mutation object with mutate method
      disconnect.mutate();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setView("landing");
      setDashboardData(null);
    }
  };

  // Prepare chart data
  const chartData = dashboardData?.pools.flatMap((pool) =>
    (pool.pnl_history || []).map((p) => ({
      time: p.timestamp,
      value: p.value,
      pool: pool.pool,
    }))
  ) || [
    { time: "00:00", value: 0, pool: "SUI/USDC" },
    { time: "04:00", value: 120, pool: "SUI/USDC" },
    { time: "08:00", value: 80, pool: "SUI/USDC" },
    { time: "12:00", value: 250, pool: "SUI/USDC" },
    { time: "16:00", value: 180, pool: "SUI/USDC" },
    { time: "20:00", value: 350, pool: "SUI/USDC" },
    { time: "24:00", value: 420, pool: "SUI/USDC" },
  ];

  // Loading state
  if (!account && view !== "landing") {
    return null;
  }

  if (view === "landing") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={DeepPulseLogo}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              DeepPulse
            </span>
          </div>
          <ConnectButton />
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  AI Powered Market Making
                </span>
              </div>
              <h1 className="text-6xl font-bold mb-6 leading-tight">
                Automate Your
                <span className="block bg-gradient-to-r from-primary via-secondary to-success bg-clip-text text-transparent">
                  Sui Trading
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-8">
                Let DeepPulse's AI agent manage your DeFi positions 24/7. Smart risk management,
                optimal spreads, and consistent returns.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                {[
                  { icon: <Zap className="w-5 h-5" />, text: "Lightning Fast" },
                  { icon: <Shield className="w-5 h-5" />, text: "Risk Managed" },
                  { icon: <BarChart3 className="w-5 h-5" />, text: "Real-time Analytics" },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-slate-800"
                  >
                    <span className="text-success">{f.icon}</span>
                    <span className="text-slate-300">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <ConnectButton className="!bg-gradient-to-r !from-primary !to-secondary !text-white !font-bold !rounded-2xl !px-8 !py-4 !text-lg" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
              
              <img
                src={DeepPulseBanner}
                alt="Banner"
                className="relative rounded-3xl shadow-2xl border border-slate-800"
              />
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // Main layout
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-darker/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("dashboard")}>
              <img
                src={DeepPulseLogo}
                alt="Logo"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DeepPulse
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <NavButton
                active={view === "dashboard"}
                onClick={() => setView("dashboard")}
                icon={<Home />}
                label="Dashboard"
              />
              <NavButton
                active={view === "analytics"}
                onClick={() => setView("analytics")}
                icon={<LineChart />}
                label="Analytics"
              />
              <NavButton
                active={view === "settings"}
                onClick={() => setView("settings")}
                icon={<Cog />}
                label="Settings"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-card border border-slate-800 rounded-2xl">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                {account?.address.slice(0, 2)}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-white">
                  {account?.address.slice(0, 8)}...{account?.address.slice(-4)}
                </div>
                <div className="text-xs text-slate-400">Connected</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <DashboardView
              key="dashboard"
              data={dashboardData}
              loading={loading}
              currentMode={currentMode}
              saving={saving}
              onStart={handleStart}
              onStop={handleStop}
              onKill={handleKill}
              onSwitchMode={handleSwitchMode}
              chartData={chartData}
            />
          )}
          {view === "analytics" && (
            <AnalyticsView
              key="analytics"
              data={dashboardData}
              chartData={chartData}
            />
          )}
          {view === "settings" && (
            <SettingsView
              key="settings"
              configForm={configForm}
              setConfigForm={setConfigForm}
              saving={saving}
              onSave={handleSaveConfig}
              currentMode={currentMode}
              onSwitchMode={handleSwitchMode}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
        active
          ? "bg-primary/20 text-primary border border-primary/30"
          : "text-slate-400 hover:bg-slate-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardView({
  data,
  loading,
  currentMode,
  saving,
  onStart,
  onStop,
  onKill,
  onSwitchMode,
  chartData,
}: {
  data: DashboardResponse | null;
  loading: boolean;
  currentMode: string;
  saving: boolean;
  onStart: () => void;
  onStop: () => void;
  onKill: () => void;
  onSwitchMode: (m: string) => void;
  chartData: any[];
}) {
  const status = data?.status || "STOPPED";
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      const netPnl = data?.totals?.net_pnl ?? 0;
      const roi = (netPnl / 100).toFixed(2);
      const shareText = `Check out my DeepPulse ROI! 🚀\nTotal ROI: ${netPnl >= 0 ? "+" : ""}${roi}%\nNet P&L: $${netPnl.toFixed(2)}\nCycles: ${data?.cycle_count || 0}\nSuccess Rate: ${((data?.success_rate || 0) * 100).toFixed(1)}%`;
      
      if (navigator.share) {
        await navigator.share({
          title: "DeepPulse ROI Performance",
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareMessage("Copied to clipboard!");
        setTimeout(() => setShareMessage(null), 2000);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };
  
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, Trader!
          </h1>
          <p className="text-slate-400">
            Manage your AI agent and monitor performance in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-card border border-slate-800 rounded-full">
            <span className="text-sm text-slate-400">Mode:</span>
            <button
              onClick={() => onSwitchMode("simulation")}
              className={cn(
                "px-4 py-1 rounded-full text-sm font-medium transition-all",
                currentMode === "simulation"
                  ? "bg-success/20 text-success border border-success/30"
                  : "text-slate-500 hover:bg-slate-800"
              )}
              disabled={saving}
            >
              Simulation
            </button>
            <button
              onClick={() => onSwitchMode("live")}
              className={cn(
                "px-4 py-1 rounded-full text-sm font-medium transition-all",
                currentMode === "live"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-slate-500 hover:bg-slate-800"
              )}
              disabled={saving}
            >
              Live
            </button>
          </div>

          <div className={cn(
            "flex items-center gap-3 px-5 py-2 rounded-full border-2",
            status === "RUNNING" ? "border-success bg-success/10" :
            status === "PAUSED" ? "border-yellow-500 bg-yellow-500/10" :
            "border-danger bg-danger/10"
          )}>
            <span className={cn(
              "w-3 h-3 rounded-full animate-pulse-slow",
              status === "RUNNING" ? "bg-success" :
              status === "PAUSED" ? "bg-yellow-500" : "bg-danger"
            )} />
            <span className={cn(
              "font-bold text-sm uppercase tracking-wider",
              status === "RUNNING" ? "text-success" :
              status === "PAUSED" ? "text-yellow-500" : "text-danger"
            )}>
              {status}
            </span>
          </div>

          <div className="flex gap-3">
            {status !== "RUNNING" && (
              <button
                onClick={onStart}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-success text-darker font-bold rounded-xl hover:bg-success/90 transition-all disabled:opacity-50"
              >
                <Bot className="w-5 h-5" />
                Start Agent
              </button>
            )}
            {status === "RUNNING" && (
              <button
                onClick={onStop}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-darker font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50"
              >
                Pause
              </button>
            )}
            <button
              onClick={onKill}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-danger text-white font-bold rounded-xl hover:bg-danger/90 transition-all disabled:opacity-50"
            >
              ⚠️ Kill
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total P&L"
          value={`${(data?.totals?.net_pnl ?? 0) >= 0 ? "+" : ""}${(data?.totals?.net_pnl ?? 0).toFixed(2)}`}
          color={(data?.totals?.net_pnl ?? 0) >= 0 ? "text-success" : "text-danger"}
          icon={<TrendingUp />}
        />
        <StatCard
          label="Total Cycles"
          value={data?.cycle_count.toString() || "0"}
          color="text-secondary"
          icon={<Activity />}
        />
        <StatCard
          label="Success Rate"
          value={`${((data?.success_rate || 0) * 100).toFixed(1)}%`}
          color="text-primary"
          icon={<Sparkles />}
        />
        <StatCard
          label="Avg Exec Time"
          value={`${(data?.avg_execution_ms || 0).toFixed(0)}ms`}
          color="text-yellow-400"
          icon={<Zap />}
        />
      </div>

      {/* Chart */}
      <div className="bg-card border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Performance Overview</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d18f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d18f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#64748b"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                itemStyle={{ color: "#00d18f" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00d18f"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPnl)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pools & Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold">Active Pools</h3>
          {data?.pools.map((pool) => (
            <div
              key={pool.pool}
              className="bg-card border border-slate-800 p-6 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg">{pool.pool}</h4>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    pool.inventory > 0 ? "bg-success/20 text-success" :
                    pool.inventory < 0 ? "bg-danger/20 text-danger" :
                    "bg-slate-700/20 text-slate-400"
                  )}
                >
                  {pool.inventory > 0 ? "Long" : pool.inventory < 0 ? "Short" : "Flat"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <div className="text-slate-400 mb-1">Mid Price</div>
                  <div className="font-bold">${pool.latest_snapshot?.mid_price.toFixed(4) || "0.0000"}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Spread</div>
                  <div className="font-bold">{pool.latest_snapshot?.spread.toFixed(4) || "0.0000"}%</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Inventory</div>
                  <div className="font-bold">{pool.inventory.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">P&L</div>
                  <div className={cn("font-bold", pool.net_pnl >= 0 ? "text-success" : "text-danger")}>
                    {pool.net_pnl >= 0 ? "+" : ""}{pool.net_pnl.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {pool.fills.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-400 mb-2">Recent Fills</h5>
                  <div className="space-y-2">
                    {pool.fills.slice(0, 3).map((fill, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                          fill.side === "buy" ? "bg-success/10" : "bg-danger/10"
                        )}
                      >
                        <span className={cn("font-bold", fill.side === "buy" ? "text-success" : "text-danger")}>
                          {fill.side.toUpperCase()} {fill.size.toFixed(2)}
                        </span>
                        <span className="text-slate-400">@ {fill.price.toFixed(4)}</span>
                        <span className={cn("font-medium", fill.realized_pnl_delta >= 0 ? "text-success" : "text-danger")}>
                          {fill.realized_pnl_delta >= 0 ? "+" : ""}{fill.realized_pnl_delta.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* ROI Generator */}
          <div className="bg-card border border-slate-800 rounded-3xl p-6 relative">
            {/* Share Toast */}
            {shareMessage && (
              <div className="absolute top-4 right-4 bg-success text-darker px-4 py-2 rounded-xl font-medium animate-bounce">
                {shareMessage}
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">ROI Performance</h3>
              <button
                onClick={() => handleShare()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:opacity-90 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share ROI
              </button>
            </div>

            {/* ROI Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-4">
              <div className="text-center">
                <div className="text-slate-400 text-sm mb-2">Total ROI</div>
                <div className={cn("text-4xl font-bold", (data?.totals?.net_pnl ?? 0) >= 0 ? "text-success" : "text-danger")}>
                  {(data?.totals?.net_pnl ?? 0) >= 0 ? "+" : ""}{((data?.totals?.net_pnl ?? 0) / 100).toFixed(2)}%
                </div>
                <div className="text-slate-400 text-xs mt-1">Net P&L: ${(data?.totals?.net_pnl ?? 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-slate-400 text-xs mb-1">Cycles</div>
                <div className="text-white font-bold">{data?.cycle_count || 0}</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-slate-400 text-xs mb-1">Success Rate</div>
                <div className="text-white font-bold">{((data?.success_rate || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-slate-400 text-xs mb-1">Pools</div>
                <div className="text-white font-bold">{data?.pools.length || 0}</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-slate-400 text-xs mb-1">Avg Time</div>
                <div className="text-white font-bold">{(data?.avg_execution_ms || 0).toFixed(0)}ms</div>
              </div>
            </div>

            {/* Pool Performance List */}
            <div className="space-y-2">
              <div className="text-slate-400 text-xs mb-2">Pool Performance</div>
              {data?.pools.slice(0, 3).map((pool) => (
                <div key={pool.pool} className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
                  <div>
                    <div className="text-white font-medium text-sm">{pool.pool}</div>
                    <div className="text-slate-400 text-xs">{pool.inventory.toFixed(2)} inventory</div>
                  </div>
                  <div className={cn("font-bold text-sm", pool.net_pnl >= 0 ? "text-success" : "text-danger")}>
                    {pool.net_pnl >= 0 ? "+" : ""}{pool.net_pnl.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-4">Risk Events</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data?.risk_logs.length === 0 ? (
                <div className="text-slate-400 text-sm py-4 text-center">No risk events - everything looking good!</div>
              ) : (
                data?.risk_logs.slice().reverse().map((log, i) => (
                  <div key={i} className="text-sm py-2 border-b border-slate-800 last:border-0">
                    <pre className="text-danger text-xs overflow-x-auto">
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ data, chartData }: { data: DashboardResponse | null, chartData: any[] }) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Performance Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="analyticsPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6a11cb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6a11cb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                <Area type="monotone" dataKey="value" stroke="#6a11cb" strokeWidth={3} fill="url(#analyticsPnl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-card border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Pool Performance</h3>
          <div className="space-y-4">
            {data?.pools.map((pool) => (
              <div key={pool.pool} className="p-4 bg-slate-900/50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">{pool.pool}</h4>
                  <span className={cn("font-medium", pool.net_pnl >= 0 ? "text-success" : "text-danger")}>
                    {pool.net_pnl >= 0 ? "+" : ""}{pool.net_pnl.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                  <div>Realized: {pool.realized_pnl.toFixed(2)}</div>
                  <div>Unrealized: {pool.unrealized_pnl.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView({
  configForm,
  setConfigForm,
  saving,
  onSave,
  currentMode,
  onSwitchMode,
}: {
  configForm: any;
  setConfigForm: (v: any) => void;
  saving: boolean;
  onSave: () => void;
  currentMode: string;
  onSwitchMode: (m: string) => void;
}) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Agent Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Gamma (Risk Aversion)</label>
              <input
                type="number"
                step="0.01"
                value={configForm.gamma}
                onChange={(e) => setConfigForm({ ...configForm, gamma: e.target.value })}
                className="w-full bg-darker border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">K (Spread Multiplier)</label>
              <input
                type="number"
                step="0.1"
                value={configForm.k}
                onChange={(e) => setConfigForm({ ...configForm, k: e.target.value })}
                className="w-full bg-darker border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Cycle Interval (ms)</label>
              <input
                type="number"
                value={configForm.cycle_interval_ms}
                onChange={(e) => setConfigForm({ ...configForm, cycle_interval_ms: e.target.value })}
                className="w-full bg-darker border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Max Inventory</label>
              <input
                type="number"
                value={configForm.max_inventory}
                onChange={(e) => setConfigForm({ ...configForm, max_inventory: e.target.value })}
                className="w-full bg-darker border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Base Order Size</label>
              <input
                type="number"
                value={configForm.base_order_size}
                onChange={(e) => setConfigForm({ ...configForm, base_order_size: e.target.value })}
                className="w-full bg-darker border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={onSave}
              disabled={saving}
              className="w-full mt-4 bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
        
        <div className="bg-card border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Environment Settings</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-2xl">
              <h4 className="font-medium mb-3">Trading Mode</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => onSwitchMode("simulation")}
                  disabled={saving}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-all",
                    currentMode === "simulation"
                      ? "bg-success/20 text-success border-2 border-success/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  Simulation
                </button>
                <button
                  onClick={() => onSwitchMode("live")}
                  disabled={saving}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-all",
                    currentMode === "live"
                      ? "bg-primary/20 text-primary border-2 border-primary/30"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  Live Trading
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {currentMode === "simulation"
                  ? "Simulation mode - no real funds at risk"
                  : "Live mode - trading with real funds"}
              </p>
            </div>
            
            <div className="p-4 bg-slate-900/50 rounded-2xl">
              <h4 className="font-medium mb-2">Network Configuration</h4>
              <div className="text-sm text-slate-400 space-y-1">
                <div>Network: Sui Mainnet</div>
                <div>DeepBook V3: Active</div>
                <div>API: Connected</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-slate-800 p-6 rounded-3xl"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400">{label}</span>
        <div className={cn("p-2 rounded-xl bg-slate-800", color)}>
          {icon}
        </div>
      </div>
      <div className={cn("text-3xl font-bold", color)}>
        {value}
      </div>
    </motion.div>
  );
}

export default App;

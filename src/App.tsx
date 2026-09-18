import React, { useState, useMemo, useEffect, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import type { Layout as RGLLayout } from "react-grid-layout";
import * as d3 from "d3";
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Box, 
  Globe as GlobeIcon, 
  Layers, 
  Map as MapIcon, 
  ShieldAlert, 
  Ship, 
  Signal, 
  TrendingUp, 
  Zap,
  Terminal,
  Maximize2,
  X,
  Truck,
  Plane,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ResponsiveGridLayout = WidthProvider(Responsive);
const queryClient = new QueryClient();

// --- Mock Data Types ---

interface Disruption {
  id: string;
  type: string;
  location: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  description: string;
}

interface Fleet {
  id: string;
  name: string;
  type: "ship" | "flight";
  status: "active" | "delayed" | "stressed";
  location: string;
  load: number;
}

interface MarketSignal {
  symbol: string;
  price: number;
  change: number;
  trend: "up" | "down";
}

// --- Mock Data Generators ---

const generateDisruptions = (): Disruption[] => [
  { id: "1", type: "Port Congestion", location: "Singapore", severity: "high", timestamp: "12m ago", description: "Vessel turnaround delayed by 48h due to weather." },
  { id: "2", type: "Labor Strike", location: "Le Havre", severity: "critical", timestamp: "45m ago", description: "Indefinite terminal stoppage at Terminal de France." },
  { id: "3", type: "Infrastructure", location: "Suez Canal", severity: "medium", timestamp: "1h ago", description: "Minor draft restrictions in northern bypass." },
  { id: "4", type: "Customs Delay", location: "Long Beach", severity: "low", timestamp: "3h ago", description: "System upgrade causing 4h backlog." },
];

const generateFleet = (): Fleet[] => [
  { id: "V-102", name: "Ever Given II", type: "ship", status: "active", location: "East China Sea", load: 92 },
  { id: "V-405", name: "Maersk Horizon", type: "ship", status: "delayed", location: "Gulf of Aden", load: 78 },
  { id: "F-901", name: "Atlas Air 747", type: "flight", status: "stressed", location: "Over Anchorage", load: 98 },
];

// --- Sub-components (Panels) ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl ui-panel shadow-2xl"
        >
          <div className="ui-panel-header">
            <h2 className="ui-header-title text-accent">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors">
              <X className="w-4 h-4 text-text-dim" />
            </button>
          </div>
          <div className="p-6 overflow-auto max-h-[80vh]">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const PanelHeader = ({ title, icon: Icon, onMaximize, isMaximized }: { title: string; icon: React.ElementType; onMaximize?: () => void; isMaximized?: boolean }) => (
  <div className="ui-panel-header">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-accent" />
      <span className="ui-header-title">{title}</span>
    </div>
    <div className="flex gap-2">
      {onMaximize && (
        <button onClick={onMaximize} className="p-1 hover:bg-white/5 rounded transition-colors">
          {isMaximized ? <X className="w-3 h-3 text-accent" /> : <Maximize2 className="w-3 h-3 text-text-dim" />}
        </button>
      )}
    </div>
  </div>
);

const Panel = ({ children, className, title, icon, onMaximize, isMaximized }: { children: React.ReactNode; className?: string; title: string; icon: React.ElementType; onMaximize?: () => void; isMaximized?: boolean }) => (
  <div className={cn("ui-panel", className, isMaximized && "fixed inset-4 z-50 h-auto w-auto")}>
    <PanelHeader title={title} icon={icon} onMaximize={onMaximize} isMaximized={isMaximized} />
    <div className="ui-panel-content p-4">
      {children}
    </div>
  </div>
);

// --- Individual Panels ---

const RiskGauge = ({ onMaximize, isMaximized }: { onMaximize?: () => void; isMaximized?: boolean }) => {
  const [risk, setRisk] = useState(68);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRisk(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 4)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Panel title="System Risk Index" icon={ShieldAlert} onMaximize={onMaximize} isMaximized={isMaximized}>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke={risk > 80 ? "var(--sev-critical)" : risk > 50 ? "var(--sev-high)" : "var(--accent)"}
              strokeWidth="8"
              strokeDasharray={364.4}
              initial={{ strokeDashoffset: 364.4 }}
              animate={{ strokeDashoffset: 364.4 - (364.4 * risk) / 100 }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold font-mono tracking-tighter">
              {Math.round(risk)}
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted uppercase font-semibold">Current Theater Load</p>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={cn(
                  "w-2 h-1 rounded-full",
                  i <= Math.ceil(risk / 20) ? "bg-accent" : "bg-border"
                )} 
              />
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
};

const DisruptionFeed = ({ onDisruptionClick, onMaximize, isMaximized }: { onDisruptionClick: (d: Disruption) => void; onMaximize?: () => void; isMaximized?: boolean }) => {
  const disruptions = useMemo(() => generateDisruptions(), []);
  
  return (
    <Panel title="Disruption Feed" icon={AlertTriangle} onMaximize={onMaximize} isMaximized={isMaximized}>
      <div className="space-y-4">
        {disruptions.map(d => (
          <div 
            key={d.id} 
            onClick={() => onDisruptionClick(d)}
            className="group border-l-2 pl-3 py-1 transition-all hover:bg-white/5 cursor-pointer" 
            style={{ borderColor: `var(--sev-${d.severity})` }}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-text uppercase leading-none">{d.type}</span>
              <span className="text-[10px] text-text-dim font-mono">{d.timestamp}</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1 leading-snug">{d.description}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono text-text-muted uppercase">
                {d.location}
              </div>
              {d.severity === "critical" && (
                <span className="text-[9px] text-sev-critical font-bold uppercase animate-pulse">Immediate Action</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

const FleetPosture = ({ onMaximize, isMaximized }: { onMaximize?: () => void; isMaximized?: boolean }) => {
  const fleet = useMemo(() => generateFleet(), []);

  return (
    <Panel title="Fleet Posture" icon={Ship} onMaximize={onMaximize} isMaximized={isMaximized}>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-text-dim uppercase border-b border-border">
            <th className="pb-2 font-semibold">Asset ID</th>
            <th className="pb-2 font-semibold">Status</th>
            <th className="pb-2 font-semibold text-right">Load</th>
          </tr>
        </thead>
        <tbody className="text-[11px]">
          {fleet.map(f => (
            <tr key={f.id} className="border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors">
              <td className="py-2.5 font-mono text-accent">{f.id}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    f.status === "active" ? "bg-accent" : f.status === "delayed" ? "bg-sev-high" : "bg-sev-critical"
                  )} />
                  <span className="capitalize">{f.status}</span>
                </div>
              </td>
              <td className="py-2.5 text-right font-mono">
                {f.load}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
};

const SignalAggregator = ({ onMaximize, isMaximized }: { onMaximize?: () => void; isMaximized?: boolean }) => {
  return (
    <Panel title="Signal Aggregator" icon={Signal} onMaximize={onMaximize} isMaximized={isMaximized}>
      <div className="flex flex-col h-full gap-3">
        {[
          { label: "SATCOM Uplink", status: "Nominal", color: "text-accent" },
          { label: "IoT Telemetry", status: "98.2%", color: "text-accent" },
          { label: "Bunker Prices", status: "Stressed", color: "text-sev-high" },
        ].map((s, i) => (
          <div key={i} className="flex justify-between items-center p-2 rounded bg-surface border border-border">
            <span className="text-[11px] font-medium">{s.label}</span>
            <span className={cn("text-[11px] font-mono font-bold", s.color)}>{s.status}</span>
          </div>
        ))}
        <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-surface-hover flex flex-col">
            <span className="text-[9px] text-text-dim uppercase">Sync Latency</span>
            <span className="text-xs font-mono font-bold">42ms</span>
          </div>
          <div className="p-2 rounded bg-surface-hover flex flex-col">
            <span className="text-[9px] text-text-dim uppercase">Data Density</span>
            <span className="text-xs font-mono font-bold">4.2GB/s</span>
          </div>
        </div>
      </div>
    </Panel>
  );
};

const GlobePanel = ({ onMaximize, isMaximized }: { onMaximize?: () => void; isMaximized?: boolean }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;
    const size = Math.min(width, height) * 0.8;

    const projection = d3.geoOrthographic()
      .scale(size / 2)
      .translate([width / 2, height / 2])
      .precision(0.1);

    const path = d3.geoPath().projection(projection);

    const g = svg.append("g");

    // Earth Sphere (Ocean)
    g.append("path")
      .datum({ type: "Sphere" })
      .attr("fill", "var(--map-bg)")
      .attr("stroke", "var(--map-grid)")
      .attr("stroke-width", 1)
      .attr("d", path as any);

    // Grid lines
    g.append("path")
      .datum(d3.geoGraticule()())
      .attr("fill", "none")
      .attr("stroke", "var(--map-grid)")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3)
      .attr("d", path as any);

    // Load Earth TopoJSON (using a direct URL to a smaller world atlas)
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((data: any) => {
      // In a real environment, we'd use topojson library, but we can mock or use direct features for simplicity if needed.
      // Since topojson is not in deps, we'll draw a stylized grid-based earth instead for the "tech" look.
      
      // Rotating logic
      const speed = 0.01;
      let rotation = 0;

      const timer = d3.timer((elapsed) => {
        rotation = elapsed * speed;
        projection.rotate([rotation, -20]);
        svg.selectAll("path").attr("d", path as any);
        
        // Update markers
        updateMarkers();
      });

      const markers = [
        { id: '1', type: 'ship', coords: [103.8, 1.3], icon: Ship },
        { id: '2', type: 'truck', coords: [-118.2, 34.0], icon: Truck },
        { id: '3', type: 'plane', coords: [-149.9, 61.2], icon: Plane },
        { id: '4', type: 'ship', coords: [32.5, 30.0], icon: Ship },
        { id: '5', type: 'truck', coords: [2.3, 48.8], icon: Truck },
      ];

      const markerGroup = svg.append("g").attr("class", "markers");

      function updateMarkers() {
        const visibleMarkers = markers.filter(m => {
          const projected = projection(m.coords as [number, number]);
          if (!projected) return false;
          // Check if on the front of the globe
          const geoCircle = d3.geoCircle().center(projection.invert([width / 2, height / 2]) as [number, number]).radius(90);
          return d3.geoContains(geoCircle() as any, m.coords as [number, number]);
        });

        const selection = markerGroup.selectAll(".marker")
          .data(visibleMarkers, (d: any) => d.id);

        selection.exit().remove();

        const enter = selection.enter()
          .append("g")
          .attr("class", "marker");

        enter.append("circle")
          .attr("r", 4)
          .attr("fill", (d: any) => 
            d.type === 'ship' ? 'var(--kind-ship)' : 
            d.type === 'truck' ? 'var(--sev-high)' : 
            'var(--sev-info)'
          )
          .attr("stroke", "white")
          .attr("stroke-width", 0.5);

        enter.append("text")
          .attr("dy", -8)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "8px")
          .attr("font-family", "var(--font-mono)")
          .text((d: any) => d.id);

        enter.append("circle")
          .attr("r", 12)
          .attr("fill", "none")
          .attr("stroke", (d: any) => 
            d.type === 'ship' ? 'var(--kind-ship)' : 
            d.type === 'truck' ? 'var(--sev-high)' : 
            'var(--sev-info)'
          )
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .append("animateTransform")
          .attr("attributeName", "transform")
          .attr("type", "rotate")
          .attr("from", "0 0 0")
          .attr("to", "360 0 0")
          .attr("dur", "4s")
          .attr("repeatCount", "indefinite");

        selection.merge(enter as any)
          .attr("transform", (d: any) => {
            const p = projection(d.coords as [number, number]);
            return `translate(${p![0]}, ${p![1]})`;
          });
      }

      return () => timer.stop();
    });

  }, [dimensions]);

  return (
    <Panel title="Global Theater Visualization" icon={GlobeIcon} className="col-span-full h-full" onMaximize={onMaximize} isMaximized={isMaximized}>
      <div ref={containerRef} className="relative h-full bg-map-bg overflow-hidden flex items-center justify-center">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        
        {/* Legendary Overlay */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="text-[10px] font-mono text-accent space-y-1">
            <div className="flex items-center gap-2">
              <Ship className="w-3 h-3" /> <span>MARITIME_ASSETS: 842</span>
            </div>
            <div className="flex items-center gap-2 text-sev-high">
              <Truck className="w-3 h-3" /> <span>LOGISTICS_FLEET: 1,503</span>
            </div>
            <div className="flex items-center gap-2 text-sev-info">
              <Plane className="w-3 h-3" /> <span>AIR_FREIGHT: 204</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <div className="p-2 rounded-lg bg-surface-elevated border border-border backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-mono">LIVE_FEED: ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

// --- Dashboard Root ---

const Dashboard = () => {
  const [maximizedPanel, setMaximizedPanel] = useState<string | null>(null);
  const [selectedDisruption, setSelectedDisruption] = useState<Disruption | null>(null);

  const layouts: { lg: RGLLayout } = {
    lg: [
      { i: "risk", x: 0, y: 0, w: 4, h: 4 },
      { i: "disruption", x: 4, y: 0, w: 5, h: 8 },
      { i: "fleet", x: 9, y: 0, w: 3, h: 8 },
      { i: "signals", x: 0, y: 4, w: 4, h: 4 },
      { i: "globe", x: 0, y: 8, w: 12, h: 8 },
    ]
  };

  const handleMaximize = (id: string) => {
    setMaximizedPanel(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen p-4 pb-12">
      {/* Header Bar */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <Terminal className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Supply<span className="text-accent underline decoration-accent/30 decoration-2 underline-offset-4">Lens</span>
            </h1>
          </div>
          <p className="text-[11px] text-text-muted uppercase mt-1 font-semibold tracking-wider flex items-center gap-2">
            Global Infrastructure Cockpit <span className="text-text-dim"> v2.4.12</span>
            <span className="inline-block w-1 h-1 rounded-full bg-accent" />
            <span className="text-accent">Live Telemetry</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-6 px-4 py-2 rounded-xl bg-surface border border-border">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-dim uppercase font-bold">Theater Status</span>
              <span className="text-xs font-mono text-accent">NOMINAL</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-dim uppercase font-bold">Active Alerts</span>
              <span className="text-xs font-mono text-sev-high">12 HIGH-PRI</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-dim uppercase font-bold">System Load</span>
              <span className="text-xs font-mono">42.8%</span>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-bg font-bold text-xs hover:bg-accent/90 transition-colors uppercase">
            Deploy Patch
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        draggableHandle=".ui-panel-header"
        isDraggable={!maximizedPanel}
        isResizable={!maximizedPanel}
      >
        <div key="risk">
          <RiskGauge onMaximize={() => handleMaximize("risk")} isMaximized={maximizedPanel === "risk"} />
        </div>
        <div key="disruption">
          <DisruptionFeed 
            onDisruptionClick={setSelectedDisruption} 
            onMaximize={() => handleMaximize("disruption")}
            isMaximized={maximizedPanel === "disruption"}
          />
        </div>
        <div key="fleet">
          <FleetPosture onMaximize={() => handleMaximize("fleet")} isMaximized={maximizedPanel === "fleet"} />
        </div>
        <div key="signals">
          <SignalAggregator onMaximize={() => handleMaximize("signals")} isMaximized={maximizedPanel === "signals"} />
        </div>
        <div key="globe">
          <GlobePanel onMaximize={() => handleMaximize("globe")} isMaximized={maximizedPanel === "globe"} />
        </div>
      </ResponsiveGridLayout>

      {/* Disruption Target Detail Modal */}
      <Modal 
        isOpen={!!selectedDisruption} 
        onClose={() => setSelectedDisruption(null)} 
        title="Disruption Intelligence Report"
      >
        {selectedDisruption && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{selectedDisruption.type}</h3>
                <p className="text-accent font-mono text-sm mt-1">{selectedDisruption.location}</p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                selectedDisruption.severity === "critical" ? "bg-sev-critical text-white" : "bg-sev-high text-white"
              )}>
                {selectedDisruption.severity}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-accent" />
                <span className="text-[10px] text-text-dim uppercase font-bold">Intelligence Summary</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                {selectedDisruption.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface/50 border border-border">
                <span className="text-[9px] text-text-dim uppercase block">Reported</span>
                <span className="text-xs font-mono">{selectedDisruption.timestamp}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface/50 border border-border">
                <span className="text-[9px] text-text-dim uppercase block">Status</span>
                <span className="text-xs font-mono text-accent">ASSESSING</span>
              </div>
            </div>

            <div className="pt-4 border-top border-border">
              <button className="w-full py-3 rounded-xl bg-accent text-bg font-bold text-xs uppercase hover:bg-accent/90 transition-colors" onClick={() => setSelectedDisruption(null)}>
                Initiate Rerouting Protocol
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

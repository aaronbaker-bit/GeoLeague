"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Guess } from "@/types/game";
import { getHeatLevel } from "@/lib/utils";
import { RoundResult } from "@/hooks/useGame";

interface GameMapProps {
  onGuess: (lat: number, lng: number) => void;
  guesses: Guess[];
  targetLat?: number;
  targetLng?: number;
  showTarget: boolean;
  disabled: boolean;
  // For end-game summary: show all rounds with lines
  completedRounds?: RoundResult[];
  isGameComplete?: boolean;
}

// Light clean tiles (no labels) for gameplay
// CARTO Voyager no-labels — clean light map with subtle terrain coloring, no text
const PLAY_TILES = "https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png";
// Light tiles WITH labels for end-game summary
const LABELED_TILES = "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png";

const HEAT_COLORS: Record<string, string> = {
  fire: "#ef4444",
  hot: "#f97316",
  warm: "#eab308",
  cool: "#3b82f6",
  cold: "#6366f1",
  frozen: "#94a3b8",
};

function removeDashedLines(mapInstance: maplibregl.Map) {
  // Remove all dashed line layers/sources
  const style = mapInstance.getStyle();
  if (!style?.layers) return;
  style.layers.forEach((layer) => {
    if (layer.id.startsWith("line-")) {
      mapInstance.removeLayer(layer.id);
    }
  });
  Object.keys(style.sources || {}).forEach((src) => {
    if (src.startsWith("line-")) {
      mapInstance.removeSource(src);
    }
  });
}

function addDashedLine(
  mapInstance: maplibregl.Map,
  id: string,
  from: [number, number],
  to: [number, number],
  color: string
) {
  const sourceId = `line-${id}`;
  const layerId = `line-${id}`;

  if (mapInstance.getSource(sourceId)) {
    mapInstance.removeLayer(layerId);
    mapInstance.removeSource(sourceId);
  }

  mapInstance.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [from, to],
      },
    },
  });

  mapInstance.addLayer({
    id: layerId,
    type: "line",
    source: sourceId,
    layout: { "line-cap": "round" },
    paint: {
      "line-color": color,
      "line-width": 2.5,
      "line-dasharray": [3, 3],
      "line-opacity": 0.8,
    },
  });
}

export default function GameMap({
  onGuess,
  guesses,
  targetLat,
  targetLng,
  showTarget,
  disabled,
  completedRounds,
  isGameComplete,
}: GameMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: "raster",
            tiles: [PLAY_TILES],
            tileSize: 256,
            attribution: "&copy; CARTO &copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "basemap",
            type: "raster",
            source: "basemap",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [0, 20],
      zoom: 1.5,
      maxZoom: 18,
      minZoom: 1,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => setMapReady(true));

    return () => {
      map.current?.remove();
      map.current = null;
      setMapReady(false);
    };
  }, []);

  // Switch tiles when game completes (add labels back)
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const source = map.current.getSource("basemap") as maplibregl.RasterTileSource;
    if (!source) return;

    const newTiles = isGameComplete ? LABELED_TILES : PLAY_TILES;
    // Update tile source
    const style = map.current.getStyle();
    if (style.sources.basemap) {
      (style.sources.basemap as Record<string, unknown>).tiles = [newTiles];
      map.current.setStyle(style);
    }
  }, [isGameComplete, mapReady]);

  // Handle map clicks
  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (disabled) return;
      const { lat, lng } = e.lngLat;
      setPendingPin({ lat, lng });

      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.remove();
      }

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 28px; height: 28px;
          background: #FFDD00;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.25);
          cursor: pointer;
          animation: pulse-pin 1.5s ease-in-out infinite;
        "></div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);
      pendingMarkerRef.current = marker;
    },
    [disabled]
  );

  useEffect(() => {
    if (!map.current) return;
    map.current.on("click", handleMapClick);
    return () => {
      map.current?.off("click", handleMapClick);
    };
  }, [handleMapClick]);

  const confirmGuess = useCallback(() => {
    if (!pendingPin) return;
    onGuess(pendingPin.lat, pendingPin.lng);
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }
    setPendingPin(null);
  }, [pendingPin, onGuess]);

  // Render single-round feedback (guess + target + dashed line)
  useEffect(() => {
    if (!map.current || !mapReady || isGameComplete) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    removeDashedLines(map.current);

    guesses.forEach((guess, i) => {
      const heat = getHeatLevel(guess.distanceKm);
      const color = HEAT_COLORS[heat];

      // Guess marker (yellow dot)
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 22px; height: 22px;
          background: #FFDD00;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        "></div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([guess.lng, guess.lat])
        .addTo(map.current!);
      markersRef.current.push(marker);
    });

    if (showTarget && targetLat !== undefined && targetLng !== undefined) {
      // Target marker (blue/teal dot)
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 26px; height: 26px;
          background: #22d3ee;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(34,211,238,0.25), 0 2px 8px rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
        ">📍</div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([targetLng, targetLat])
        .addTo(map.current!);
      markersRef.current.push(marker);

      // Dashed line from guess to target
      if (guesses.length > 0) {
        const lastGuess = guesses[guesses.length - 1];
        addDashedLine(
          map.current,
          "round",
          [lastGuess.lng, lastGuess.lat],
          [targetLng, targetLat],
          "#ef4444"
        );

        // Fit bounds to show both
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([lastGuess.lng, lastGuess.lat]);
        bounds.extend([targetLng, targetLat]);
        map.current?.fitBounds(bounds, { padding: 100, duration: 1000 });
      }
    }
  }, [guesses, showTarget, targetLat, targetLng, mapReady, isGameComplete]);

  // End-game summary: show ALL rounds with pins and lines
  useEffect(() => {
    if (!map.current || !mapReady || !isGameComplete || !completedRounds?.length) return;

    // Clear everything
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    removeDashedLines(map.current);

    // Wait for style to settle after tile switch
    const renderSummary = () => {
      if (!map.current) return;

      const bounds = new maplibregl.LngLatBounds();

      completedRounds.forEach((round, i) => {
        const { guess, location } = round;
        const heat = getHeatLevel(guess.distanceKm);
        const color = HEAT_COLORS[heat];

        // Guess marker (yellow with number)
        const guessEl = document.createElement("div");
        guessEl.innerHTML = `
          <div style="
            width: 24px; height: 24px;
            background: #FFDD00;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 800; color: #333;
          ">${i + 1}</div>
        `;
        const guessMarker = new maplibregl.Marker({ element: guessEl })
          .setLngLat([guess.lng, guess.lat])
          .addTo(map.current!);
        markersRef.current.push(guessMarker);

        // Target marker (cyan)
        const targetEl = document.createElement("div");
        targetEl.innerHTML = `
          <div style="
            width: 24px; height: 24px;
            background: #22d3ee;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 800; color: #333;
          ">${i + 1}</div>
        `;
        const targetMarker = new maplibregl.Marker({ element: targetEl })
          .setLngLat([location.lng, location.lat])
          .addTo(map.current!);
        markersRef.current.push(targetMarker);

        // Dashed line
        addDashedLine(
          map.current!,
          `summary-${i}`,
          [guess.lng, guess.lat],
          [location.lng, location.lat],
          color
        );

        bounds.extend([guess.lng, guess.lat]);
        bounds.extend([location.lng, location.lat]);
      });

      map.current?.fitBounds(bounds, { padding: 60, duration: 1200 });
    };

    // Small delay to let tile source switch complete
    setTimeout(renderSummary, 500);
  }, [isGameComplete, completedRounds, mapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />

      {pendingPin && !disabled && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={confirmGuess}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-full shadow-lg shadow-violet-600/30 transition-all hover:scale-105 active:scale-95"
          >
            Confirm Guess
          </button>
        </div>
      )}

      {/* Legend when game is complete */}
      {isGameComplete && completedRounds && completedRounds.length > 0 && (
        <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FFDD00] border border-white shadow-sm" />
              <span className="text-zinc-600">Your guess</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#22d3ee] border border-white shadow-sm" />
              <span className="text-zinc-600">Actual location</span>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse-pin {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

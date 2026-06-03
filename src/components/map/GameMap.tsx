"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Guess } from "@/types/game";
import { getHeatLevel } from "@/lib/utils";

interface GameMapProps {
  onGuess: (lat: number, lng: number) => void;
  guesses: Guess[];
  targetLat?: number;
  targetLng?: number;
  showTarget: boolean;
  disabled: boolean;
}

const HEAT_COLORS: Record<string, string> = {
  fire: "#ef4444",
  hot: "#f97316",
  warm: "#eab308",
  cool: "#3b82f6",
  cold: "#6366f1",
  frozen: "#94a3b8",
};

export default function GameMap({
  onGuess,
  guesses,
  targetLat,
  targetLng,
  showTarget,
  disabled,
}: GameMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
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

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

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
          width: 24px; height: 24px;
          background: #8b5cf6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    guesses.forEach((guess, i) => {
      const heat = getHeatLevel(guess.distanceKm);
      const color = HEAT_COLORS[heat];

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 20px; height: 20px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: white;
        ">${i + 1}</div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([guess.lng, guess.lat])
        .addTo(map.current!);
      markersRef.current.push(marker);
    });

    if (showTarget && targetLat !== undefined && targetLng !== undefined) {
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 28px; height: 28px;
          background: #10b981;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(16,185,129,0.3), 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        ">✓</div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([targetLng, targetLat])
        .addTo(map.current!);
      markersRef.current.push(marker);

      if (guesses.length > 0) {
        const lastGuess = guesses[guesses.length - 1];
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([lastGuess.lng, lastGuess.lat]);
        bounds.extend([targetLng, targetLat]);
        map.current?.fitBounds(bounds, { padding: 80, duration: 1000 });
      }
    }
  }, [guesses, showTarget, targetLat, targetLng]);

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

      <style jsx global>{`
        @keyframes pulse-pin {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

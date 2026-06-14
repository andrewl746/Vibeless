"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  anchorX: number;
  anchorY: number;
  radius: number;
  colorIndex: number;
  phase: number;
  rangeX: number;
  rangeY: number;
  speed: number;
};

const wrap = (value: number, size: number) => ((value % size) + size) % size;
const palette = [
  { core: "rgba(78, 201, 176,", glow: "rgba(78, 201, 176, 0.48)" },
  { core: "rgba(197, 134, 192,", glow: "rgba(197, 134, 192, 0.42)" },
  { core: "rgba(156, 220, 254,", glow: "rgba(156, 220, 254, 0.48)" },
];

export default function LandingNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let nodes: NodePoint[] = [];
    const startedAt = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const spacing = width < 720 ? 86 : 104;
      const columns = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;

      nodes = Array.from({ length: columns * rows }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const jitterX = Math.sin(index * 12.9898) * spacing * 0.18;
        const jitterY = Math.cos(index * 78.233) * spacing * 0.18;

        return {
          anchorX: column * spacing - spacing / 2 + jitterX,
          anchorY: row * spacing - spacing / 2 + jitterY,
          radius: 2.2 + (index % 5) * 0.42,
          colorIndex: index % palette.length,
          phase: index * 0.73,
          rangeX: spacing * (0.22 + (index % 4) * 0.035),
          rangeY: spacing * (0.18 + (index % 3) * 0.04),
          speed: 0.16 + (index % 6) * 0.018,
        };
      });
    };

    const positionFor = (node: NodePoint, time: number) => {
      const x =
        node.anchorX +
        Math.sin(time * node.speed + node.phase) * node.rangeX +
        Math.cos(time * node.speed * 0.7 + node.phase * 1.4) *
          node.rangeX *
          0.38;
      const y =
        node.anchorY +
        Math.cos(time * node.speed * 0.9 + node.phase) * node.rangeY +
        Math.sin(time * node.speed * 0.6 + node.phase * 1.7) *
          node.rangeY *
          0.42;

      return {
        x: wrap(x, width),
        y: wrap(y, height),
      };
    };

    const draw = (now: number) => {
      const time = (now - startedAt) / 1000;
      const positions = nodes.map((node) => positionFor(node, time));

      context.clearRect(0, 0, width, height);

      const maxDistance = width < 720 ? 118 : 148;

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const first = positions[i];
          const second = positions[j];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.hypot(dx, dy);

          if (distance < maxDistance) {
            const strength = 1 - distance / maxDistance;
            const color = palette[nodes[i].colorIndex];

            context.strokeStyle = `${color.core} ${strength * 0.34})`;
            context.lineWidth = 0.55 + strength * 0.65;
            context.beginPath();
            context.moveTo(first.x, first.y);
            context.lineTo(second.x, second.y);
            context.stroke();
          }
        }
      }

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        const position = positions[index];
        const pulse = 0.8 + Math.sin(time * 1.8 + node.phase) * 0.2;
        const color = palette[node.colorIndex];

        context.shadowBlur = 16;
        context.shadowColor = color.glow;
        context.fillStyle = `${color.core} ${0.72 * pulse})`;
        context.beginPath();
        context.arc(position.x, position.y, node.radius, 0, Math.PI * 2);
        context.fill();

        context.shadowBlur = 0;
        context.fillStyle = `${color.core} ${0.46 * pulse})`;
        context.beginPath();
        context.arc(position.x, position.y, node.radius * 0.42, 0, Math.PI * 2);
        context.fill();
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-95"
    />
  );
}

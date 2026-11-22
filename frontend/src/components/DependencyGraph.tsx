import { useMemo } from 'react';
import { Dependency } from '../types';
import { riskBarColor } from '../lib/utils';

interface Props {
  dependencies: Dependency[];
}

export default function DependencyGraph({ dependencies }: Props) {
  // Show top 30 deps in a force-inspired layout (SVG, no external lib needed)
  const nodes = useMemo(() => {
    const topDeps = [...dependencies].slice(0, 30);
    const W = 760;
    const H = 420;
    const centerX = W / 2;
    const centerY = H / 2;

    // Direct deps in inner ring, transitive in outer
    const direct = topDeps.filter((d) => d.direct);
    const transitive = topDeps.filter((d) => !d.direct);

    const nodes: Array<{ dep: Dependency; x: number; y: number }> = [];

    direct.forEach((dep, i) => {
      const angle = (i / Math.max(direct.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const r = 110;
      nodes.push({ dep, x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) });
    });

    transitive.forEach((dep, i) => {
      const angle = (i / Math.max(transitive.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const r = 185;
      nodes.push({ dep, x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) });
    });

    return { nodes, centerX, centerY, W, H };
  }, [dependencies]);

  return (
    <div className="overflow-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${nodes.W} ${nodes.H}`}
        className="rounded-xl border border-gray-200"
        style={{ background: '#f8fafc', minHeight: 300 }}
      >
        {/* Center node — project root */}
        <circle cx={nodes.centerX} cy={nodes.centerY} r={22} fill="#2563eb" />
        <text
          x={nodes.centerX}
          y={nodes.centerY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={9}
          fontWeight="bold"
        >
          PROJECT
        </text>

        {/* Edges from center to direct */}
        {nodes.nodes
          .filter((n) => n.dep.direct)
          .map((n, i) => (
            <line
              key={`e-direct-${i}`}
              x1={nodes.centerX}
              y1={nodes.centerY}
              x2={n.x}
              y2={n.y}
              stroke="#93c5fd"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          ))}

        {/* Edges direct -> transitive (simplified: each transitive links to nearest direct) */}
        {nodes.nodes
          .filter((n) => !n.dep.direct)
          .map((n, i) => {
            const directNodes = nodes.nodes.filter((x) => x.dep.direct);
            if (directNodes.length === 0) return null;
            const nearest = directNodes[i % directNodes.length];
            return (
              <line
                key={`e-trans-${i}`}
                x1={nearest.x}
                y1={nearest.y}
                x2={n.x}
                y2={n.y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            );
          })}

        {/* Dep nodes */}
        {nodes.nodes.map((n, i) => {
          const color = riskBarColor(n.dep.riskLevel);
          const r = n.dep.direct ? 10 : 7;
          const label = n.dep.name.split('/').pop() || n.dep.name;
          const truncated = label.length > 12 ? label.slice(0, 11) + '…' : label;

          return (
            <g key={`n-${i}`}>
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
                opacity={0.9}
              />
              <text
                x={n.x}
                y={n.y + r + 9}
                textAnchor="middle"
                fontSize={7.5}
                fill="#475569"
              >
                {truncated}
              </text>
              <text
                x={n.x}
                y={n.y + r + 18}
                textAnchor="middle"
                fontSize={6.5}
                fill="#94a3b8"
              >
                {n.dep.license}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
        {(['low', 'medium', 'high', 'critical'] as const).map((r) => (
          <div key={r} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: riskBarColor(r) }}
            />
            {r.charAt(0).toUpperCase() + r.slice(1)} risk
          </div>
        ))}
        <span className="ml-auto text-gray-400">Large circle = direct dependency</span>
      </div>
    </div>
  );
}

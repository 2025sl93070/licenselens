import { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  NodeTypes,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Dependency, RiskLevel } from '../types';
import { riskBarColor } from '../lib/utils';

interface Props {
  dependencies: Dependency[];
  projectName?: string;
}

const NODE_W = 160;
const LEVEL_H = 160;

function riskBorderColor(risk: RiskLevel) {
  switch (risk) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#d97706';
    default: return '#16a34a';
  }
}

function DepNodeComponent({ data }: { data: { dep: Dependency } }) {
  const { dep } = data;
  const dot = riskBarColor(dep.riskLevel);
  const border = riskBorderColor(dep.riskLevel);
  const shortName = dep.name.split('/').pop() || dep.name;
  const truncated = shortName.length > 18 ? shortName.slice(0, 17) + '…' : shortName;

  return (
    <div
      style={{ borderColor: border }}
      className="bg-white rounded-lg border-2 px-3 py-2 shadow-sm w-40 text-xs select-none"
      title={`${dep.name}@${dep.version}\nLicense: ${dep.license}\nRisk: ${dep.riskLevel}${dep.riskReasons.length ? '\n' + dep.riskReasons[0] : ''}`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
        <span className="font-semibold text-gray-900 truncate">{truncated}</span>
      </div>
      <div className="text-gray-500 truncate">{dep.license}</div>
      <div className="text-gray-400 mt-0.5">{dep.direct ? 'Direct' : 'Transitive'}</div>
    </div>
  );
}

function RootNodeComponent({ data }: { data: { label: string } }) {
  const label = data.label.length > 20 ? data.label.slice(0, 19) + '…' : data.label;
  return (
    <div className="bg-blue-600 text-white rounded-xl px-4 py-2.5 shadow-md text-sm font-bold select-none text-center min-w-[120px]">
      <div className="text-xs font-normal text-blue-200 mb-0.5">PROJECT</div>
      {label}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  depNode: DepNodeComponent,
  rootNode: RootNodeComponent,
};

const RISK_ORDER: Record<RiskLevel, number> = { critical: 3, high: 2, medium: 1, low: 0 };

function selectDisplayDeps(deps: Dependency[], limit = 25): Dependency[] {
  const direct = deps.filter((d) => d.direct);
  const transitive = deps.filter((d) => !d.direct);

  // Always include all direct deps (up to limit)
  const selected = direct.slice(0, limit);
  if (selected.length >= limit) return selected;

  // Fill remaining slots with highest-risk transitive deps
  const remaining = limit - selected.length;
  const sortedTransitive = [...transitive].sort(
    (a, b) => RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel]
  );
  selected.push(...sortedTransitive.slice(0, remaining));
  return selected;
}

function buildLayout(deps: Dependency[], projectName: string) {
  const display = selectDisplayDeps(deps);
  const direct = display.filter((d) => d.direct);
  const transitive = display.filter((d) => !d.direct);

  // Build children map (only for deps in the display set)
  const displayNames = new Set(display.map((d) => d.name));
  const childrenOf: Record<string, Dependency[]> = {};
  transitive.forEach((dep) => {
    const p = dep.parent && displayNames.has(dep.parent) ? dep.parent : '__orphan__';
    if (!childrenOf[p]) childrenOf[p] = [];
    childrenOf[p].push(dep);
  });

  // Single leaf counter — guarantees no overlapping x positions
  let leafCounter = 0;
  const xPos: Record<string, number> = {};

  function assignX(name: string): number {
    const children = childrenOf[name] || [];
    if (children.length === 0) {
      xPos[name] = leafCounter * (NODE_W + 24);
      leafCounter++;
      return xPos[name];
    }
    const childXs = children.map((c) => assignX(c.name));
    xPos[name] = (childXs[0] + childXs[childXs.length - 1]) / 2;
    return xPos[name];
  }

  // Assign x for every direct dep (and recurse into their children)
  const directXs = direct.map((dep) => assignX(dep.name));

  // Orphaned transitive deps (parent not in display set)
  const orphans = childrenOf['__orphan__'] || [];
  orphans.forEach((dep) => {
    xPos[dep.name] = leafCounter * (NODE_W + 24);
    leafCounter++;
  });

  // Root x = center of direct deps
  const rootX =
    directXs.length > 0
      ? (directXs[0] + directXs[directXs.length - 1]) / 2
      : (leafCounter * (NODE_W + 24)) / 2;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Root node
  nodes.push({
    id: '__root__',
    type: 'rootNode',
    position: { x: rootX, y: 0 },
    data: { label: projectName },
  });

  // Direct dep nodes + root→direct edges
  direct.forEach((dep) => {
    nodes.push({
      id: dep.name,
      type: 'depNode',
      position: { x: xPos[dep.name], y: LEVEL_H },
      data: { dep },
    });
    edges.push({
      id: `r-${dep.name}`,
      source: '__root__',
      target: dep.name,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    });

    // Transitive children
    (childrenOf[dep.name] || []).forEach((child) => {
      nodes.push({
        id: child.name,
        type: 'depNode',
        position: { x: xPos[child.name], y: 2 * LEVEL_H },
        data: { dep: child },
      });
      edges.push({
        id: `${dep.name}-${child.name}`,
        source: dep.name,
        target: child.name,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      });
    });
  });

  // Orphaned transitive → connect to root
  orphans.forEach((dep) => {
    nodes.push({
      id: dep.name,
      type: 'depNode',
      position: { x: xPos[dep.name], y: 2 * LEVEL_H },
      data: { dep },
    });
    edges.push({
      id: `r-orphan-${dep.name}`,
      source: '__root__',
      target: dep.name,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 2' },
    });
  });

  return { nodes, edges, totalDeps: deps.length, displayed: display.length };
}

export default function DependencyGraph({ dependencies, projectName = 'Project' }: Props) {
  const { nodes: initialNodes, edges: initialEdges, totalDeps, displayed } = useMemo(
    () => buildLayout(dependencies, projectName),
    [dependencies, projectName]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div>
      {totalDeps > displayed && (
        <p className="text-xs text-gray-400 mb-2">
          Showing {displayed} of {totalDeps} packages — direct deps + highest-risk transitive deps.
        </p>
      )}
      <div style={{ height: 500 }} className="rounded-xl border border-gray-200 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              if (n.id === '__root__') return '#2563eb';
              const dep = (n.data as { dep?: Dependency })?.dep;
              return dep ? riskBarColor(dep.riskLevel) : '#64748b';
            }}
            maskColor="rgba(241,245,249,0.7)"
          />
        </ReactFlow>
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 items-center">
        {(['low', 'medium', 'high', 'critical'] as const).map((r) => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riskBarColor(r) }} />
            {r.charAt(0).toUpperCase() + r.slice(1)} risk
          </div>
        ))}
        <span className="ml-auto text-gray-400">Hover node for details · Scroll to zoom · Drag to pan</span>
      </div>
    </div>
  );
}

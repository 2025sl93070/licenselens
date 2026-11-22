import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisResult,
  Dependency,
  LicenseConflict,
  PolicyViolation,
  RiskLevel,
  Policy,
} from '../types';
import {
  LICENSE_DATABASE,
  LICENSE_CONFLICTS,
  normalizeLicense,
} from '../data/licenses';
import { DEFAULT_POLICIES } from '../data/policies';
import { ParsedDependency } from '../parsers';

// Enrich deps with license info, risk level, and explanations
function enrichDependency(dep: ParsedDependency, index: number): Dependency {
  const license = dep.license === 'UNKNOWN' ? normalizeLicense(undefined) : dep.license;
  const licenseInfo = LICENSE_DATABASE[license] || LICENSE_DATABASE['UNKNOWN'];

  const riskReasons: string[] = [];
  let riskLevel: RiskLevel = licenseInfo.riskLevel;

  if (license === 'UNKNOWN') {
    riskReasons.push('License could not be identified — legal status is unclear');
  }

  if (licenseInfo.category === 'network-copyleft') {
    riskReasons.push(
      'AGPL network copyleft: any user accessing the software over a network can demand the source code'
    );
    riskLevel = 'critical';
  } else if (licenseInfo.category === 'strong-copyleft') {
    riskReasons.push(
      'Strong copyleft (GPL): all combined works must be released under the same license'
    );
  } else if (licenseInfo.category === 'weak-copyleft') {
    riskReasons.push(
      'Weak copyleft: modifications to this library must be open-sourced, but your application code may remain proprietary'
    );
  }

  if (!dep.direct && riskLevel !== 'low') {
    riskReasons.push('Transitive dependency — inherited indirectly through another package');
  }

  return {
    ...dep,
    license,
    licenseInfo,
    depth: dep.direct ? 0 : 1,
    children: [],
    riskLevel,
    riskReasons,
    policyViolations: [],
  };
}

function detectConflicts(deps: Dependency[]): LicenseConflict[] {
  const conflicts: LicenseConflict[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < deps.length; i++) {
    for (let j = i + 1; j < deps.length; j++) {
      const a = deps[i];
      const b = deps[j];

      for (const conflict of LICENSE_CONFLICTS) {
        const matches =
          (a.license === conflict.license1 && b.license === conflict.license2) ||
          (a.license === conflict.license2 && b.license === conflict.license1);

        if (matches) {
          const key = `${conflict.license1}-${conflict.license2}`;
          if (!seenPairs.has(key)) {
            seenPairs.add(key);
            conflicts.push({
              dep1: a.name,
              dep2: b.name,
              license1: a.license,
              license2: b.license,
              reason: conflict.reason,
              severity:
                a.licenseInfo.riskLevel === 'critical' ||
                b.licenseInfo.riskLevel === 'critical'
                  ? 'critical'
                  : 'high',
            });
          }
        }
      }
    }
  }

  return conflicts;
}

function evaluatePolicy(
  deps: Dependency[],
  policy: Policy
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  for (const dep of deps) {
    for (const rule of policy.rules) {
      if (rule.type === 'allow') continue;

      let violated = false;

      if (rule.licenses?.includes(dep.license)) {
        violated = true;
      }

      if (rule.categories?.includes(dep.licenseInfo.category)) {
        violated = true;
      }

      if (rule.riskLevels?.includes(dep.riskLevel)) {
        violated = true;
      }

      if (violated) {
        violations.push({
          dependencyName: dep.name,
          rule,
          license: dep.license,
          explanation: `${dep.name} uses ${dep.license} which violates the "${rule.name}" rule: ${rule.description}`,
        });
      }
    }
  }

  return violations;
}

function computeOverallRisk(deps: Dependency[]): {
  level: RiskLevel;
  explanation: string;
} {
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const d of deps) counts[d.riskLevel]++;

  if (counts.critical > 0) {
    return {
      level: 'critical',
      explanation: `${counts.critical} critical-risk license(s) detected (e.g. AGPL-3.0 with network copyleft obligations). Immediate legal review required before distribution.`,
    };
  }
  if (counts.high > 2) {
    return {
      level: 'high',
      explanation: `${counts.high} high-risk dependencies (strong copyleft or unknown licenses). Distributing this project may require releasing your source code.`,
    };
  }
  if (counts.high > 0 || counts.medium > 3) {
    return {
      level: 'medium',
      explanation: `${counts.high} high-risk and ${counts.medium} medium-risk dependencies. Review copyleft conditions before commercial distribution.`,
    };
  }
  return {
    level: 'low',
    explanation: `All ${deps.length} dependencies use permissive licenses. Safe for commercial and proprietary use with standard attribution requirements.`,
  };
}

export function analyzeProject(
  projectName: string,
  ecosystem: AnalysisResult['ecosystem'],
  rawDeps: ParsedDependency[],
  policyId = 'enterprise-safe'
): AnalysisResult {
  const deps = rawDeps.map(enrichDependency);

  const policy =
    DEFAULT_POLICIES.find((p) => p.id === policyId) || DEFAULT_POLICIES[0];

  const policyViolations = evaluatePolicy(deps, policy);

  // Attach violations back to individual deps
  for (const v of policyViolations) {
    const dep = deps.find((d) => d.name === v.dependencyName);
    if (dep) dep.policyViolations.push(v.explanation);
  }

  const conflicts = detectConflicts(deps);

  const riskSummary = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const d of deps) riskSummary[d.riskLevel]++;

  const licenseDistribution: Record<string, number> = {};
  for (const d of deps) {
    licenseDistribution[d.license] = (licenseDistribution[d.license] || 0) + 1;
  }

  const topRisks = [...deps]
    .sort((a, b) => {
      const order = { critical: 3, high: 2, medium: 1, low: 0 };
      return order[b.riskLevel] - order[a.riskLevel];
    })
    .slice(0, 5);

  const { level: overallRisk, explanation: overallRiskExplanation } =
    computeOverallRisk(deps);

  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    projectName,
    ecosystem,
    totalDependencies: deps.length,
    directDependencies: deps.filter((d) => d.direct).length,
    transitiveDependencies: deps.filter((d) => !d.direct).length,
    dependencies: deps,
    riskSummary,
    conflicts,
    policyViolations,
    topRisks,
    licenseDistribution,
    overallRisk,
    overallRiskExplanation,
  };
}

// In-memory storage for analysis history
const analysisHistory: AnalysisResult[] = [];

export function saveAnalysis(result: AnalysisResult): void {
  analysisHistory.unshift(result);
  if (analysisHistory.length > 50) analysisHistory.pop();
}

export function getHistory(): AnalysisResult[] {
  return analysisHistory.map(({ dependencies: _, ...rest }) => rest as AnalysisResult);
}

export function getAnalysisById(id: string): AnalysisResult | undefined {
  return analysisHistory.find((a) => a.id === id);
}

export type LicenseId =
  | 'MIT'
  | 'Apache-2.0'
  | 'GPL-2.0'
  | 'GPL-3.0'
  | 'LGPL-2.1'
  | 'LGPL-3.0'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'ISC'
  | 'MPL-2.0'
  | 'CDDL-1.0'
  | 'EPL-1.0'
  | 'EPL-2.0'
  | 'AGPL-3.0'
  | 'CC0-1.0'
  | 'Unlicense'
  | 'UNKNOWN';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LicenseInfo {
  id: LicenseId;
  name: string;
  spdxId: string;
  riskLevel: RiskLevel;
  category: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  commercialUse: boolean;
  modification: boolean;
  distribution: boolean;
  copyleft: boolean;
  url: string;
}

export interface Dependency {
  name: string;
  version: string;
  license: LicenseId;
  licenseInfo: LicenseInfo;
  direct: boolean;
  depth: number;
  parent?: string;
  children: string[];
  riskLevel: RiskLevel;
  riskReasons: string[];
  policyViolations: string[];
}

export interface LicenseConflict {
  dep1: string;
  dep2: string;
  license1: LicenseId;
  license2: LicenseId;
  reason: string;
  severity: RiskLevel;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  type: 'deny' | 'warn' | 'allow';
  licenses?: LicenseId[];
  categories?: string[];
  riskLevels?: RiskLevel[];
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
}

export interface PolicyViolation {
  dependencyName: string;
  rule: PolicyRule;
  license: LicenseId;
  explanation: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  projectName: string;
  ecosystem: string;
  totalDependencies: number;
  directDependencies: number;
  transitiveDependencies: number;
  dependencies: Dependency[];
  riskSummary: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  conflicts: LicenseConflict[];
  policyViolations: PolicyViolation[];
  topRisks: Dependency[];
  licenseDistribution: Record<string, number>;
  overallRisk: RiskLevel;
  overallRiskExplanation: string;
}

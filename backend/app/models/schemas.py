from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class LicenseCategory(str, Enum):
    permissive = "permissive"
    weak_copyleft = "weak-copyleft"
    strong_copyleft = "strong-copyleft"
    network_copyleft = "network-copyleft"
    public_domain = "public-domain"
    unknown = "unknown"


class LicenseInfo(BaseModel):
    id: str
    name: str
    spdx_id: str
    risk_level: RiskLevel
    category: LicenseCategory
    permissions: List[str]
    conditions: List[str]
    limitations: List[str]
    commercial_use: bool
    modification: bool
    distribution: bool
    patent_use: bool
    private_use: bool
    copyleft: bool
    url: str


class Dependency(BaseModel):
    name: str
    version: str
    license: str
    license_info: LicenseInfo
    direct: bool
    depth: int
    parent: Optional[str] = None
    children: List[str] = []
    risk_level: RiskLevel
    risk_reasons: List[str] = []
    policy_violations: List[str] = []


class LicenseConflict(BaseModel):
    dep1: str
    dep2: str
    license1: str
    license2: str
    reason: str
    severity: RiskLevel


class PolicyRule(BaseModel):
    id: str
    name: str
    description: str
    type: str  # "deny" | "warn" | "allow"
    licenses: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    risk_levels: Optional[List[str]] = None


class Policy(BaseModel):
    id: str
    name: str
    description: str
    rules: List[PolicyRule]


class PolicyViolation(BaseModel):
    dependency_name: str
    rule: PolicyRule
    license: str
    explanation: str


class RiskSummary(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0
    critical: int = 0


class AnalysisResult(BaseModel):
    id: str
    timestamp: datetime
    project_name: str
    ecosystem: str
    total_dependencies: int
    direct_dependencies: int
    transitive_dependencies: int
    dependencies: List[Dependency]
    risk_summary: RiskSummary
    conflicts: List[LicenseConflict]
    policy_violations: List[PolicyViolation]
    top_risks: List[Dependency]
    license_distribution: Dict[str, int]
    overall_risk: RiskLevel
    overall_risk_explanation: str


class AnalysisListItem(BaseModel):
    id: str
    timestamp: datetime
    project_name: str
    ecosystem: str
    total_dependencies: int
    direct_dependencies: int
    transitive_dependencies: int
    overall_risk: RiskLevel
    overall_risk_explanation: str
    risk_summary: RiskSummary
    license_distribution: Dict[str, int]

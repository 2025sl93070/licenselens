import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.data.licenses import LICENSE_DATABASE, LICENSE_CONFLICTS, normalize_license
from app.data.policies import DEFAULT_POLICIES


RISK_ORDER = {"critical": 3, "high": 2, "medium": 1, "low": 0}


def enrich_dependency(dep: dict) -> dict:
    license_id = dep.get("license") or "UNKNOWN"
    if license_id not in LICENSE_DATABASE:
        license_id = normalize_license(license_id)

    license_info = LICENSE_DATABASE.get(license_id, LICENSE_DATABASE["UNKNOWN"])
    risk_level = license_info["risk_level"]
    risk_reasons = []

    if license_id == "UNKNOWN":
        risk_reasons.append(
            "License could not be identified — legal status is unclear and may pose compliance risk"
        )

    if license_info["category"] == "network-copyleft":
        risk_reasons.append(
            "AGPL network copyleft: any user accessing this software over a network can demand the complete source code"
        )
        risk_level = "critical"
    elif license_info["category"] == "strong-copyleft":
        risk_reasons.append(
            "Strong copyleft (GPL): all combined or derivative works must be released under the same license terms"
        )
    elif license_info["category"] == "weak-copyleft":
        risk_reasons.append(
            "Weak copyleft: modifications to this library must be open-sourced, though your own application code may remain proprietary"
        )

    if not dep.get("direct") and risk_level not in ("low",):
        risk_reasons.append(
            "Transitive dependency — this risk is inherited indirectly through another package"
        )

    return {
        **dep,
        "license": license_id,
        "license_info": license_info,
        "depth": 0 if dep.get("direct") else 1,
        "parent": dep.get("parent"),
        "children": dep.get("children", []),
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "policy_violations": [],
    }


def detect_conflicts(deps: List[dict]) -> List[dict]:
    conflicts = []
    seen_pairs = set()

    for i in range(len(deps)):
        for j in range(i + 1, len(deps)):
            a, b = deps[i], deps[j]
            for lic1, lic2, reason in LICENSE_CONFLICTS:
                matches = (
                    (a["license"] == lic1 and b["license"] == lic2) or
                    (a["license"] == lic2 and b["license"] == lic1)
                )
                if matches:
                    key = f"{min(lic1, lic2)}-{max(lic1, lic2)}"
                    if key not in seen_pairs:
                        seen_pairs.add(key)
                        severity = "critical" if any(
                            d["risk_level"] == "critical" for d in [a, b]
                        ) else "high"
                        conflicts.append({
                            "dep1": a["name"],
                            "dep2": b["name"],
                            "license1": a["license"],
                            "license2": b["license"],
                            "reason": reason,
                            "severity": severity,
                        })
    return conflicts


def evaluate_policy(deps: List[dict], policy: dict) -> List[dict]:
    violations = []
    for dep in deps:
        for rule in policy["rules"]:
            if rule["type"] == "allow":
                continue

            violated = False
            if rule.get("licenses") and dep["license"] in rule["licenses"]:
                violated = True
            if rule.get("categories") and dep["license_info"]["category"] in rule["categories"]:
                violated = True
            if rule.get("risk_levels") and dep["risk_level"] in rule["risk_levels"]:
                violated = True

            if violated:
                violations.append({
                    "dependency_name": dep["name"],
                    "rule": rule,
                    "license": dep["license"],
                    "explanation": (
                        f"{dep['name']} uses {dep['license']} which violates the "
                        f"\"{rule['name']}\" rule: {rule['description']}"
                    ),
                })
    return violations


def compute_overall_risk(deps: List[dict]) -> tuple[str, str]:
    counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for d in deps:
        counts[d["risk_level"]] += 1

    if counts["critical"] > 0:
        return "critical", (
            f"{counts['critical']} critical-risk license(s) detected (e.g. AGPL-3.0 with network copyleft obligations). "
            "Immediate legal review required before distribution."
        )
    if counts["high"] > 2:
        return "high", (
            f"{counts['high']} high-risk dependencies (strong copyleft or unknown licenses). "
            "Distributing this project may require releasing your source code."
        )
    if counts["high"] > 0 or counts["medium"] > 3:
        return "medium", (
            f"{counts['high']} high-risk and {counts['medium']} medium-risk dependencies. "
            "Review copyleft conditions before commercial distribution."
        )
    return "low", (
        f"All {len(deps)} dependencies use permissive licenses. "
        "Safe for commercial and proprietary use with standard attribution requirements."
    )


def analyze_project(
    project_name: str,
    ecosystem: str,
    raw_deps: List[dict],
    policy_id: str = "enterprise-safe",
) -> dict:
    deps = [enrich_dependency(d) for d in raw_deps]

    policy = next(
        (p for p in DEFAULT_POLICIES if p["id"] == policy_id),
        DEFAULT_POLICIES[0],
    )

    violations = evaluate_policy(deps, policy)
    for v in violations:
        dep = next((d for d in deps if d["name"] == v["dependency_name"]), None)
        if dep:
            dep["policy_violations"].append(v["explanation"])

    conflicts = detect_conflicts(deps)

    risk_summary = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for d in deps:
        risk_summary[d["risk_level"]] += 1

    license_dist: dict[str, int] = {}
    for d in deps:
        license_dist[d["license"]] = license_dist.get(d["license"], 0) + 1

    top_risks = sorted(deps, key=lambda d: RISK_ORDER[d["risk_level"]], reverse=True)[:5]

    overall_risk, explanation = compute_overall_risk(deps)

    return {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "projectName": project_name,
        "ecosystem": ecosystem,
        "totalDependencies": len(deps),
        "directDependencies": sum(1 for d in deps if d.get("direct")),
        "transitiveDependencies": sum(1 for d in deps if not d.get("direct")),
        "dependencies": [_camel_dep(d) for d in deps],
        "riskSummary": risk_summary,
        "conflicts": [_camel_conflict(c) for c in conflicts],
        "policyViolations": [_camel_violation(v) for v in violations],
        "topRisks": [_camel_dep(d) for d in top_risks],
        "licenseDistribution": license_dist,
        "overallRisk": overall_risk,
        "overallRiskExplanation": explanation,
    }


def _camel_dep(d: dict) -> dict:
    li = d.get("license_info", {})
    return {
        "name": d["name"],
        "version": d["version"],
        "license": d["license"],
        "licenseInfo": {
            "id": li.get("id", "UNKNOWN"),
            "name": li.get("name", ""),
            "spdxId": li.get("spdx_id", ""),
            "riskLevel": li.get("risk_level", "low"),
            "category": li.get("category", "unknown"),
            "permissions": li.get("permissions", []),
            "conditions": li.get("conditions", []),
            "limitations": li.get("limitations", []),
            "commercialUse": li.get("commercial_use", False),
            "modification": li.get("modification", False),
            "distribution": li.get("distribution", False),
            "patentUse": li.get("patent_use", False),
            "privatUse": li.get("private_use", False),
            "copyleft": li.get("copyleft", False),
            "url": li.get("url", ""),
        },
        "direct": d.get("direct", False),
        "depth": d.get("depth", 0),
        "parent": d.get("parent"),
        "children": d.get("children", []),
        "riskLevel": d["risk_level"],
        "riskReasons": d.get("risk_reasons", []),
        "policyViolations": d.get("policy_violations", []),
    }


def _camel_conflict(c: dict) -> dict:
    return {
        "dep1": c["dep1"],
        "dep2": c["dep2"],
        "license1": c["license1"],
        "license2": c["license2"],
        "reason": c["reason"],
        "severity": c["severity"],
    }


def _camel_violation(v: dict) -> dict:
    rule = v["rule"]
    return {
        "dependencyName": v["dependency_name"],
        "rule": {
            "id": rule["id"],
            "name": rule["name"],
            "description": rule["description"],
            "type": rule["type"],
            "licenses": rule.get("licenses"),
            "categories": rule.get("categories"),
            "riskLevels": rule.get("risk_levels"),
        },
        "license": v["license"],
        "explanation": v["explanation"],
    }

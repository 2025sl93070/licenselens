import io
from datetime import datetime, timezone


def generate_csv_report(result: dict) -> bytes:
    lines = []
    lines.append("LicenseLens Analysis Report")
    lines.append(f"Project: {result['projectName']}")
    lines.append(f"Ecosystem: {result['ecosystem']}")
    lines.append(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append(f"Overall Risk: {result['overallRisk'].upper()}")
    lines.append(f"Explanation: {result['overallRiskExplanation']}")
    lines.append("")
    lines.append("Summary")
    lines.append(f"Total Dependencies,{result['totalDependencies']}")
    lines.append(f"Direct,{result['directDependencies']}")
    lines.append(f"Transitive,{result['transitiveDependencies']}")
    lines.append(f"Critical Risk,{result['riskSummary']['critical']}")
    lines.append(f"High Risk,{result['riskSummary']['high']}")
    lines.append(f"Medium Risk,{result['riskSummary']['medium']}")
    lines.append(f"Low Risk,{result['riskSummary']['low']}")
    lines.append(f"Conflicts Detected,{len(result['conflicts'])}")
    lines.append(f"Policy Violations,{len(result['policyViolations'])}")
    lines.append("")
    lines.append("Dependencies")
    lines.append("Name,Version,License,Type,Risk Level,Risk Reasons,Policy Violations")

    for dep in result.get("dependencies", []):
        dep_type = "Direct" if dep.get("direct") else "Transitive"
        risk_reasons = "; ".join(dep.get("riskReasons", []))
        policy_v = "; ".join(dep.get("policyViolations", []))
        lines.append(
            f'"{dep["name"]}","{dep["version"]}","{dep["license"]}","{dep_type}",'
            f'"{dep["riskLevel"]}","{risk_reasons}","{policy_v}"'
        )

    lines.append("")
    lines.append("License Conflicts")
    lines.append("Package 1,License 1,Package 2,License 2,Severity,Reason")
    for c in result.get("conflicts", []):
        reason = c["reason"].replace('"', "'")
        lines.append(
            f'"{c["dep1"]}","{c["license1"]}","{c["dep2"]}","{c["license2"]}",'
            f'"{c["severity"]}","{reason}"'
        )

    lines.append("")
    lines.append("Policy Violations")
    lines.append("Dependency,License,Rule,Type,Explanation")
    for v in result.get("policyViolations", []):
        exp = v["explanation"].replace('"', "'")
        lines.append(
            f'"{v["dependencyName"]}","{v["license"]}","{v["rule"]["name"]}",'
            f'"{v["rule"]["type"]}","{exp}"'
        )

    return "\n".join(lines).encode("utf-8")

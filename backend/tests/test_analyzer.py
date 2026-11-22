import pytest
from app.data.licenses import normalize_license, LICENSE_DATABASE
from app.parsers.file_parser import parse_pip_requirements, parse_npm_package_json
from app.services.analyzer import analyze_project, enrich_dependency, detect_conflicts


class TestLicenseNormalization:
    def test_mit(self):
        assert normalize_license("MIT") == "MIT"
        assert normalize_license("mit") == "MIT"
        assert normalize_license("(MIT)") == "MIT"

    def test_apache(self):
        assert normalize_license("Apache-2.0") == "Apache-2.0"
        assert normalize_license("Apache 2") == "Apache-2.0"

    def test_gpl(self):
        assert normalize_license("GPL-3.0") == "GPL-3.0"
        assert normalize_license("GPL-2.0-only") == "GPL-2.0"

    def test_unknown(self):
        assert normalize_license(None) == "UNKNOWN"
        assert normalize_license("") == "UNKNOWN"
        assert normalize_license("Proprietary") == "UNKNOWN"


class TestParsers:
    def test_pip_requirements(self):
        content = "requests==2.31.0\nflask>=3.0.0\n# comment\nnumpy"
        deps = parse_pip_requirements(content)
        names = [d["name"] for d in deps]
        assert "requests" in names
        assert "flask" in names
        assert "numpy" in names
        assert len(deps) == 3

    def test_npm_package_json(self):
        content = '{"dependencies": {"express": "^4.18.2", "lodash": "~4.17.21"}, "devDependencies": {"jest": "^29.0.0"}}'
        deps = parse_npm_package_json(content)
        direct = [d for d in deps if d["direct"]]
        dev = [d for d in deps if not d["direct"]]
        assert len(direct) == 2
        assert len(dev) == 1
        assert any(d["name"] == "express" for d in direct)


class TestAnalyzer:
    def test_enrich_mit(self):
        dep = {"name": "express", "version": "4.18.2", "license": "MIT", "direct": True}
        enriched = enrich_dependency(dep)
        assert enriched["risk_level"] == "low"
        assert enriched["license_info"]["copyleft"] is False
        assert len(enriched["risk_reasons"]) == 0

    def test_enrich_agpl(self):
        dep = {"name": "analytics", "version": "1.0.0", "license": "AGPL-3.0", "direct": True}
        enriched = enrich_dependency(dep)
        assert enriched["risk_level"] == "critical"
        assert len(enriched["risk_reasons"]) > 0
        assert "network copyleft" in enriched["risk_reasons"][0].lower()

    def test_enrich_unknown(self):
        dep = {"name": "mystery-pkg", "version": "0.1.0", "license": "UNKNOWN", "direct": True}
        enriched = enrich_dependency(dep)
        assert enriched["risk_level"] == "high"
        assert len(enriched["risk_reasons"]) > 0

    def test_conflict_detection(self):
        deps = [
            enrich_dependency({"name": "a", "version": "1.0", "license": "GPL-2.0", "direct": True}),
            enrich_dependency({"name": "b", "version": "1.0", "license": "Apache-2.0", "direct": True}),
        ]
        conflicts = detect_conflicts(deps)
        assert len(conflicts) >= 1
        assert conflicts[0]["license1"] in ("GPL-2.0", "Apache-2.0")

    def test_full_analysis(self):
        raw = [
            {"name": "express", "version": "4.18.2", "license": "MIT", "direct": True},
            {"name": "analytics", "version": "2.0.0", "license": "AGPL-3.0", "direct": True},
        ]
        result = analyze_project("test-project", "npm", raw, "enterprise-safe")
        assert result["totalDependencies"] == 2
        assert result["overallRisk"] == "critical"
        assert len(result["policyViolations"]) >= 1
        assert any(v["dependencyName"] == "analytics" for v in result["policyViolations"])

    def test_policy_permissive_only(self):
        raw = [
            {"name": "lib", "version": "1.0", "license": "LGPL-2.1", "direct": True},
        ]
        result = analyze_project("proj", "npm", raw, "permissive-only")
        assert any(v["dependencyName"] == "lib" for v in result["policyViolations"])

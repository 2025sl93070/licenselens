import json
import re
from typing import List, Tuple
from app.data.licenses import normalize_license


ParsedDep = dict  # {name, version, license, direct}


def parse_npm_package_json(content: str) -> List[ParsedDep]:
    pkg = json.loads(content)
    deps = []

    def add(section, direct: bool):
        if not section:
            return
        for name, version in section.items():
            deps.append({
                "name": name,
                "version": str(version).lstrip("^~>=<"),
                "license": "UNKNOWN",
                "direct": direct,
            })

    add(pkg.get("dependencies"), True)
    add(pkg.get("devDependencies"), False)
    add(pkg.get("peerDependencies"), False)
    return deps


def parse_npm_package_lock(content: str) -> List[ParsedDep]:
    lock = json.loads(content)
    deps = []
    top_deps = set(lock.get("dependencies", {}).keys())
    packages = lock.get("packages") or lock.get("dependencies") or {}

    for name, info in packages.items():
        if not name:
            continue
        pkg_name = name.replace("node_modules/", "")
        if not pkg_name:
            continue
        deps.append({
            "name": pkg_name,
            "version": info.get("version", "0.0.0"),
            "license": normalize_license(info.get("license")),
            "direct": pkg_name in top_deps,
        })
    return deps


def parse_pip_requirements(content: str) -> List[ParsedDep]:
    deps = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        m = re.match(r"^([A-Za-z0-9_.\-]+)([><=!]=?)?([0-9.*]+)?", line)
        if m:
            deps.append({
                "name": m.group(1),
                "version": m.group(3) or "latest",
                "license": "UNKNOWN",
                "direct": True,
            })
    return deps


def parse_pipfile_lock(content: str) -> List[ParsedDep]:
    lock = json.loads(content)
    deps = []

    def add(section, direct: bool):
        if not section:
            return
        for name, info in section.items():
            if name == "_meta":
                continue
            version = info if isinstance(info, str) else info.get("version", "unknown")
            deps.append({
                "name": name,
                "version": version.lstrip("=<>!"),
                "license": "UNKNOWN",
                "direct": direct,
            })

    add(lock.get("default"), True)
    add(lock.get("develop"), False)
    return deps


def detect_ecosystem(filename: str) -> str:
    name = filename.lower()
    if name in ("package.json", "package-lock.json"):
        return "npm"
    if name in ("requirements.txt", "pipfile.lock"):
        return "pip"
    if name == "pom.xml":
        return "maven"
    if name in ("build.gradle", "build.gradle.kts"):
        return "gradle"
    return "unknown"


def parse_file(filename: str, content: str) -> Tuple[List[ParsedDep], str]:
    ecosystem = detect_ecosystem(filename)
    name = filename.lower()

    if name == "package-lock.json":
        return parse_npm_package_lock(content), ecosystem
    elif name == "package.json":
        return parse_npm_package_json(content), ecosystem
    elif name == "requirements.txt":
        return parse_pip_requirements(content), ecosystem
    elif name == "pipfile.lock":
        return parse_pipfile_lock(content), ecosystem
    else:
        raise ValueError(f"Unsupported file: {filename}. Supported: package.json, package-lock.json, requirements.txt, Pipfile.lock")

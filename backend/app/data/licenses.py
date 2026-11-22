from typing import Dict, Tuple

# (license1, license2) -> reason
LICENSE_DATABASE: Dict[str, dict] = {
    "MIT": {
        "id": "MIT", "name": "MIT License", "spdx_id": "MIT",
        "risk_level": "low", "category": "permissive",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": ["license-and-copyright-notice"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": False,
        "url": "https://opensource.org/licenses/MIT",
    },
    "Apache-2.0": {
        "id": "Apache-2.0", "name": "Apache License 2.0", "spdx_id": "Apache-2.0",
        "risk_level": "low", "category": "permissive",
        "permissions": ["commercial-use", "modification", "distribution", "patent-use", "private-use"],
        "conditions": ["license-and-copyright-notice", "state-changes"],
        "limitations": ["liability", "trademark-use", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": True, "private_use": True, "copyleft": False,
        "url": "https://www.apache.org/licenses/LICENSE-2.0",
    },
    "GPL-2.0": {
        "id": "GPL-2.0", "name": "GNU General Public License v2.0", "spdx_id": "GPL-2.0",
        "risk_level": "high", "category": "strong-copyleft",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": ["disclose-source", "license-and-copyright-notice", "same-license"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": True,
        "url": "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html",
    },
    "GPL-3.0": {
        "id": "GPL-3.0", "name": "GNU General Public License v3.0", "spdx_id": "GPL-3.0",
        "risk_level": "high", "category": "strong-copyleft",
        "permissions": ["commercial-use", "modification", "distribution", "patent-use", "private-use"],
        "conditions": ["disclose-source", "license-and-copyright-notice", "same-license", "state-changes"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": True, "private_use": True, "copyleft": True,
        "url": "https://www.gnu.org/licenses/gpl-3.0.html",
    },
    "LGPL-2.1": {
        "id": "LGPL-2.1", "name": "GNU Lesser General Public License v2.1", "spdx_id": "LGPL-2.1",
        "risk_level": "medium", "category": "weak-copyleft",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": ["disclose-source", "license-and-copyright-notice", "same-license--library"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": True,
        "url": "https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html",
    },
    "LGPL-3.0": {
        "id": "LGPL-3.0", "name": "GNU Lesser General Public License v3.0", "spdx_id": "LGPL-3.0",
        "risk_level": "medium", "category": "weak-copyleft",
        "permissions": ["commercial-use", "modification", "distribution", "patent-use", "private-use"],
        "conditions": ["disclose-source", "license-and-copyright-notice", "same-license--library"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": True, "private_use": True, "copyleft": True,
        "url": "https://www.gnu.org/licenses/lgpl-3.0.html",
    },
    "BSD-2-Clause": {
        "id": "BSD-2-Clause", "name": "BSD 2-Clause \"Simplified\" License", "spdx_id": "BSD-2-Clause",
        "risk_level": "low", "category": "permissive",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": ["license-and-copyright-notice"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": False,
        "url": "https://opensource.org/licenses/BSD-2-Clause",
    },
    "BSD-3-Clause": {
        "id": "BSD-3-Clause", "name": "BSD 3-Clause License", "spdx_id": "BSD-3-Clause",
        "risk_level": "low", "category": "permissive",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": ["license-and-copyright-notice"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": False,
        "url": "https://opensource.org/licenses/BSD-3-Clause",
    },
    "ISC": {
        "id": "ISC", "name": "ISC License", "spdx_id": "ISC",
        "risk_level": "low", "category": "permissive",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": ["license-and-copyright-notice"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": False,
        "url": "https://opensource.org/licenses/ISC",
    },
    "MPL-2.0": {
        "id": "MPL-2.0", "name": "Mozilla Public License 2.0", "spdx_id": "MPL-2.0",
        "risk_level": "medium", "category": "weak-copyleft",
        "permissions": ["commercial-use", "modification", "distribution", "patent-use", "private-use"],
        "conditions": ["disclose-source", "license-and-copyright-notice", "same-license--file"],
        "limitations": ["liability", "trademark-use", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": True, "private_use": True, "copyleft": True,
        "url": "https://www.mozilla.org/en-US/MPL/2.0/",
    },
    "EPL-2.0": {
        "id": "EPL-2.0", "name": "Eclipse Public License 2.0", "spdx_id": "EPL-2.0",
        "risk_level": "medium", "category": "weak-copyleft",
        "permissions": ["commercial-use", "modification", "distribution", "patent-use", "private-use"],
        "conditions": ["disclose-source", "license-and-copyright-notice", "same-license"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": True, "private_use": True, "copyleft": True,
        "url": "https://www.eclipse.org/legal/epl-2.0/",
    },
    "AGPL-3.0": {
        "id": "AGPL-3.0", "name": "GNU Affero General Public License v3.0", "spdx_id": "AGPL-3.0",
        "risk_level": "critical", "category": "network-copyleft",
        "permissions": ["commercial-use", "modification", "distribution", "patent-use", "private-use"],
        "conditions": ["disclose-source", "license-and-copyright-notice", "network-use-disclose", "same-license"],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": True, "private_use": True, "copyleft": True,
        "url": "https://www.gnu.org/licenses/agpl-3.0.html",
    },
    "CC0-1.0": {
        "id": "CC0-1.0", "name": "Creative Commons Zero v1.0 Universal", "spdx_id": "CC0-1.0",
        "risk_level": "low", "category": "public-domain",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": [],
        "limitations": ["liability", "trademark-use", "patent-use", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": False,
        "url": "https://creativecommons.org/publicdomain/zero/1.0/",
    },
    "Unlicense": {
        "id": "Unlicense", "name": "The Unlicense", "spdx_id": "Unlicense",
        "risk_level": "low", "category": "public-domain",
        "permissions": ["commercial-use", "modification", "distribution", "private-use"],
        "conditions": [],
        "limitations": ["liability", "warranty"],
        "commercial_use": True, "modification": True, "distribution": True,
        "patent_use": False, "private_use": True, "copyleft": False,
        "url": "https://unlicense.org",
    },
    "UNKNOWN": {
        "id": "UNKNOWN", "name": "Unknown License", "spdx_id": "UNKNOWN",
        "risk_level": "high", "category": "unknown",
        "permissions": [], "conditions": [], "limitations": [],
        "commercial_use": False, "modification": False, "distribution": False,
        "patent_use": False, "private_use": False, "copyleft": False,
        "url": "",
    },
}

LICENSE_CONFLICTS: list[Tuple[str, str, str]] = [
    ("GPL-2.0", "Apache-2.0",
     "GPL-2.0 and Apache-2.0 are incompatible when combined in the same binary. GPL-2.0 lacks an explicit patent grant that Apache-2.0 provides, making them legally incompatible per the FSF."),
    ("GPL-3.0", "AGPL-3.0",
     "GPL-3.0 and AGPL-3.0 have different network-copyleft conditions. Combining them in one project can create ambiguity about which license governs distribution."),
    ("GPL-2.0", "EPL-2.0",
     "GPL-2.0 and EPL-2.0 have incompatible copyleft terms. EPL-2.0 allows use as part of a larger work under different terms, which conflicts with GPL-2.0's same-license requirement."),
    ("GPL-3.0", "EPL-2.0",
     "GPL-3.0 and EPL-2.0 have conflicting copyleft requirements making combined distribution legally uncertain."),
    ("AGPL-3.0", "Apache-2.0",
     "AGPL-3.0 imposes network-use source disclosure requirements that Apache-2.0 does not. When AGPL-3.0 code is combined with Apache-2.0 code in a network service, all code must comply with AGPL-3.0."),
]


def normalize_license(raw: str | None) -> str:
    if not raw:
        return "UNKNOWN"
    s = raw.strip().upper().replace("(", "").replace(")", "").replace("AND", "").strip()

    if "MIT" in s:
        return "MIT"
    if "APACHE" in s and "2" in s:
        return "Apache-2.0"
    if "AGPL" in s and "3" in s:
        return "AGPL-3.0"
    if "GPL" in s and "3" in s and "LGPL" not in s:
        return "GPL-3.0"
    if "GPL" in s and "2" in s and "LGPL" not in s:
        return "GPL-2.0"
    if "LGPL" in s and "3" in s:
        return "LGPL-3.0"
    if "LGPL" in s and "2" in s:
        return "LGPL-2.1"
    if "BSD" in s and "2" in s:
        return "BSD-2-Clause"
    if "BSD" in s and "3" in s:
        return "BSD-3-Clause"
    if "BSD" in s:
        return "BSD-3-Clause"
    if "ISC" in s:
        return "ISC"
    if "MPL" in s and "2" in s:
        return "MPL-2.0"
    if "EPL" in s and "2" in s:
        return "EPL-2.0"
    if "CC0" in s:
        return "CC0-1.0"
    if "UNLICENSE" in s or "PUBLIC DOMAIN" in s:
        return "Unlicense"

    return "UNKNOWN"

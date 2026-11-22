from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
import json

from app.core.database import get_db, AnalysisDB
from app.parsers.file_parser import parse_file
from app.services.analyzer import analyze_project
from app.services.report import generate_csv_report
from app.data.sample_data import SAMPLE_DEPENDENCIES
from app.data.licenses import LICENSE_DATABASE
from app.data.policies import DEFAULT_POLICIES

router = APIRouter()

SUPPORTED_FILES = {
    "package.json", "package-lock.json",
    "requirements.txt", "pipfile.lock",
    "pom.xml",
}


@router.post("/analyze")
async def analyze_file_endpoint(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form(None),
    policy_id: str = Form("enterprise-safe"),
    db: Session = Depends(get_db),
):
    filename = file.filename or ""
    if filename.lower() not in SUPPORTED_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file '{filename}'. Supported: {', '.join(SUPPORTED_FILES)}",
        )

    content = (await file.read()).decode("utf-8")
    name = project_name or filename

    try:
        deps, ecosystem = parse_file(filename, content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    result = analyze_project(name, ecosystem, deps, policy_id)
    _save_analysis(db, result, policy_id)
    return result


@router.post("/analyze/demo")
async def analyze_demo(
    policy_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    pid = policy_id or "enterprise-safe"
    result = analyze_project("demo-project", "npm", SAMPLE_DEPENDENCIES, pid)
    _save_analysis(db, result, pid)
    return result


@router.get("/analyze/{analysis_id}")
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    row = db.query(AnalysisDB).filter(AnalysisDB.id == analysis_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _row_to_dict(row)


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    rows = (
        db.query(AnalysisDB)
        .order_by(AnalysisDB.timestamp.desc())
        .limit(50)
        .all()
    )
    return [_row_to_summary(r) for r in rows]


@router.get("/analyze/{analysis_id}/export/csv")
def export_csv(analysis_id: str, db: Session = Depends(get_db)):
    row = db.query(AnalysisDB).filter(AnalysisDB.id == analysis_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")

    result = _row_to_dict(row)
    csv_bytes = generate_csv_report(result)

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="licenselens-{analysis_id[:8]}.csv"'
        },
    )


@router.get("/licenses")
def list_licenses():
    return list(LICENSE_DATABASE.values())


@router.get("/policies")
def list_policies():
    return DEFAULT_POLICIES


@router.get("/health")
def health():
    return {"status": "ok"}


# ---- helpers ----

def _save_analysis(db: Session, result: dict, policy_id: str):
    row = AnalysisDB(
        id=result["id"],
        project_name=result["projectName"],
        ecosystem=result["ecosystem"],
        total_dependencies=result["totalDependencies"],
        direct_dependencies=result["directDependencies"],
        transitive_dependencies=result["transitiveDependencies"],
        overall_risk=result["overallRisk"],
        overall_risk_explanation=result["overallRiskExplanation"],
        risk_summary=result["riskSummary"],
        license_distribution=result["licenseDistribution"],
        dependencies=result["dependencies"],
        conflicts=result["conflicts"],
        policy_violations=result["policyViolations"],
        top_risks=result["topRisks"],
        policy_id=policy_id,
    )
    db.add(row)
    db.commit()


def _row_to_dict(row: AnalysisDB) -> dict:
    return {
        "id": row.id,
        "timestamp": row.timestamp.isoformat(),
        "projectName": row.project_name,
        "ecosystem": row.ecosystem,
        "totalDependencies": row.total_dependencies,
        "directDependencies": row.direct_dependencies,
        "transitiveDependencies": row.transitive_dependencies,
        "overallRisk": row.overall_risk,
        "overallRiskExplanation": row.overall_risk_explanation,
        "riskSummary": row.risk_summary,
        "licenseDistribution": row.license_distribution,
        "dependencies": row.dependencies,
        "conflicts": row.conflicts,
        "policyViolations": row.policy_violations,
        "topRisks": row.top_risks,
    }


def _row_to_summary(row: AnalysisDB) -> dict:
    return {
        "id": row.id,
        "timestamp": row.timestamp.isoformat(),
        "projectName": row.project_name,
        "ecosystem": row.ecosystem,
        "totalDependencies": row.total_dependencies,
        "directDependencies": row.direct_dependencies,
        "transitiveDependencies": row.transitive_dependencies,
        "overallRisk": row.overall_risk,
        "overallRiskExplanation": row.overall_risk_explanation,
        "riskSummary": row.risk_summary,
        "licenseDistribution": row.license_distribution,
    }

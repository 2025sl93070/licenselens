from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./licenselens.db")

# Support SQLite for easy dev without Postgres
if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(DATABASE_URL)
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AnalysisDB(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    project_name = Column(String, nullable=False)
    ecosystem = Column(String, nullable=False)
    total_dependencies = Column(Integer, default=0)
    direct_dependencies = Column(Integer, default=0)
    transitive_dependencies = Column(Integer, default=0)
    overall_risk = Column(String, nullable=False)
    overall_risk_explanation = Column(Text)
    risk_summary = Column(JSON)
    license_distribution = Column(JSON)
    dependencies = Column(JSON)
    conflicts = Column(JSON)
    policy_violations = Column(JSON)
    top_risks = Column(JSON)
    policy_id = Column(String, default="enterprise-safe")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)

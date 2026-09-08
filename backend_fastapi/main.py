from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, Base
from models import Learner, Competency
from schemas import LearnerOut, CompetencyOut
from seed import seed_data

# Create DB tables and seed initial demo data
Base.metadata.create_all(bind=engine)
seed_data()

app = FastAPI(
    title="Official Statistical System Competency Platform API",
    description="Stage 1 Backend for India's Official Statistical System Learner Prototype",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "stage": "Stage 1 Prototype",
        "platform": "India Official Statistical System Competency Platform",
        "framework": "FastAPI + PostgreSQL/SQLAlchemy"
    }

@app.get("/api/learner", response_model=dict)
def get_learner(id: int = Query(1, description="Learner ID"), db: Session = Depends(get_db)):
    """
    GET /api/learner:
    Retrieves the learner profile with overall aggregated score and competency highlights.
    """
    learner = db.query(Learner).filter(Learner.id == id).first()
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")

    competencies = db.query(Competency).filter(Competency.learner_id == id).all()
    overall_score = 0
    top_comp = "N/A"
    focus_comp = "N/A"

    if competencies:
        overall_score = round(sum(c.score for c in competencies) / len(competencies))
        sorted_comps = sorted(competencies, key=lambda c: c.score, reverse=True)
        top_comp = f"{sorted_comps[0].name} ({sorted_comps[0].score}%)"
        focus_comp = f"{sorted_comps[-1].name} ({sorted_comps[-1].score}%)"

    learner_dict = {
        "id": learner.id,
        "name": learner.name,
        "role": learner.role,
        "department": learner.department,
        "email": learner.email,
        "overall_score": overall_score,
        "competency_count": len(competencies),
        "top_competency": top_comp,
        "focus_competency": focus_comp,
        "created_at": learner.created_at.isoformat() if learner.created_at else None
    }

    return {"success": True, "data": learner_dict}

@app.get("/api/competencies", response_model=dict)
def get_competencies(learner_id: int = Query(1, description="Learner ID"), db: Session = Depends(get_db)):
    """
    GET /api/competencies:
    Retrieves individual competency scores, categories, and targets.
    """
    competencies = db.query(Competency).filter(Competency.learner_id == learner_id).order_by(Competency.id).all()
    
    comp_list = [
        {
            "id": c.id,
            "learner_id": c.learner_id,
            "name": c.name,
            "score": c.score,
            "max_score": c.max_score,
            "category": c.category,
            "benchmark_target": c.benchmark_target,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in competencies
    ]

    return {
        "success": True,
        "count": len(comp_list),
        "data": comp_list
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

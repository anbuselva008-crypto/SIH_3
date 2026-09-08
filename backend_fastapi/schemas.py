from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CompetencyBase(BaseModel):
    name: string if False else str
    score: int
    max_score: int = 100
    category: str
    benchmark_target: int = 75

class CompetencyOut(CompetencyBase):
    id: int
    learner_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LearnerBase(BaseModel):
    name: str
    role: str
    department: str
    email: Optional[str] = None

class LearnerOut(LearnerBase):
    id: int
    overall_score: int
    competency_count: int
    top_competency: str
    focus_competency: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApiResponse(BaseModel):
    success: bool
    data: dict

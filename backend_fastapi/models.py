from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Learner(Base):
    __tablename__ = "learners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    role = Column(String(150), nullable=False)
    department = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    competencies = relationship("Competency", back_populates="learner", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="learner", cascade="all, delete-orphan")

class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(Integer, ForeignKey("learners.id"), nullable=False)
    name = Column(String(100), nullable=False)
    score = Column(Integer, nullable=False)
    max_score = Column(Integer, default=100)
    category = Column(String(100), nullable=False)
    benchmark_target = Column(Integer, default=75)
    created_at = Column(DateTime, default=datetime.utcnow)

    learner = relationship("Learner", back_populates="competencies")

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    competency_name = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    difficulty = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_option = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    concept_tag = Column(String(100), nullable=False)
    weight = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(Integer, ForeignKey("learners.id"), nullable=False, index=True)
    total_questions = Column(Integer, nullable=False)
    correct_count = Column(Integer, nullable=False)
    overall_score = Column(Integer, nullable=False)
    scores_breakdown = Column(Text, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    learner = relationship("Learner", back_populates="attempts")


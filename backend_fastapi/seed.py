from database import engine, SessionLocal, Base
from models import Learner, Competency

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if learner exists
    existing = db.query(Learner).filter(Learner.name == "Arun Kumar").first()
    if not existing:
        learner = Learner(
            name="Arun Kumar",
            role="Statistical Officer",
            department="Survey Division",
            email="arun.kumar@mospi.gov.in"
        )
        db.add(learner)
        db.commit()
        db.refresh(learner)

        competencies = [
            Competency(learner_id=learner.id, name="Statistics", score=75, max_score=100, category="Methodology & Theory", benchmark_target=75),
            Competency(learner_id=learner.id, name="Python", score=40, max_score=100, category="Programming & Computing", benchmark_target=60),
            Competency(learner_id=learner.id, name="Data Analysis", score=55, max_score=100, category="Applied Analysis", benchmark_target=70),
            Competency(learner_id=learner.id, name="Data Visualization", score=80, max_score=100, category="Reporting & Dissemination", benchmark_target=75),
        ]
        db.add_all(competencies)
        db.commit()
        print("Database seeded with Arun Kumar and Stage 1 competencies.")
    else:
        print("Database already contains seed data.")
    
    db.close()

if __name__ == "__main__":
    seed_data()

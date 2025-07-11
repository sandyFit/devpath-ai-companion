#!/usr/bin/env python
"""
Seed database script for the Medical AI Assistant App.

This script populates the SQLite database with mock data for demonstration purposes.
It creates sample users, queries, responses, and file records.
"""

import asyncio
import datetime
import os
import random
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Import models and database functions
from db.database import init_db, get_engine
from models.models import (
    User, Query, Response, File, 
    RoleEnum, StatusEnum, TriageLevelEnum
)
from sqlmodel import Session, select

# Sample data
SAMPLE_USERS = [
    {"username": "patient1", "email": "patient1@example.com", "role": RoleEnum.PATIENT},
    {"username": "patient2", "email": "patient2@example.com", "role": RoleEnum.PATIENT},
    {"username": "doctor1", "email": "doctor1@example.com", "role": RoleEnum.DOCTOR},
    {"username": "doctor2", "email": "doctor2@example.com", "role": RoleEnum.DOCTOR},
    {"username": "admin1", "email": "admin1@example.com", "role": RoleEnum.ADMIN},
]

SAMPLE_QUERIES = [
    {
        "query_text": "I've been experiencing severe headaches for the past week, particularly in the morning. What could be causing this?",
        "enhanced_query": "Patient reports severe headaches persisting for one week, with increased intensity in the morning hours. Potential causes to consider: tension headaches, migraines, cluster headaches, medication side effects, dehydration, sleep disorders, or more serious conditions like hypertension or intracranial pressure changes.",
        "safety_score": 0.85,
        "triage_level": TriageLevelEnum.MEDIUM,
        "status": StatusEnum.COMPLETED,
    },
    {
        "query_text": "My 5-year-old son has had a fever of 102°F for three days and is now developing a rash. Should I take him to the ER?",
        "enhanced_query": "5-year-old male patient with persistent high-grade fever (102°F/38.9°C) for 3 days, now developing a rash. Assessment needed for potential serious conditions including meningitis, scarlet fever, measles, or other infectious diseases requiring urgent evaluation.",
        "safety_score": 0.35,
        "triage_level": TriageLevelEnum.HIGH,
        "status": StatusEnum.COMPLETED,
    },
    {
        "query_text": "I've been taking lisinopril for my blood pressure but noticed my ankles are swelling. Is this a side effect?",
        "enhanced_query": "Patient on lisinopril (ACE inhibitor) for hypertension reporting new-onset ankle edema. Evaluation needed for medication side effect vs. heart failure exacerbation vs. other causes of peripheral edema.",
        "safety_score": 0.75,
        "triage_level": TriageLevelEnum.LOW,
        "status": StatusEnum.COMPLETED,
    },
    {
        "query_text": "I'm experiencing chest pain that radiates to my left arm and jaw, along with shortness of breath and nausea. What should I do?",
        "enhanced_query": "Patient reporting acute chest pain radiating to left arm and jaw, accompanied by dyspnea and nausea. Clinical presentation highly concerning for acute coronary syndrome/myocardial infarction requiring IMMEDIATE emergency evaluation.",
        "safety_score": 0.15,
        "triage_level": TriageLevelEnum.URGENT,
        "status": StatusEnum.COMPLETED,
    },
    {
        "query_text": "I've been feeling more tired than usual lately and noticed I'm losing weight without trying. Could this be my thyroid?",
        "enhanced_query": "Patient reports increased fatigue and unintentional weight loss. Differential diagnosis includes thyroid disorders (particularly hyperthyroidism), diabetes mellitus, malignancy, depression, chronic infection, or other metabolic/endocrine disorders.",
        "safety_score": 0.65,
        "triage_level": TriageLevelEnum.MEDIUM,
        "status": StatusEnum.NEEDS_REVIEW,
    },
    {
        "query_text": "My blood test shows elevated liver enzymes (ALT 78, AST 65). What could be causing this and should I be concerned?",
        "enhanced_query": "Patient with moderately elevated transaminases (ALT 78, AST 65). Differential diagnosis includes medication effect, alcohol use, viral hepatitis, NAFLD/NASH, autoimmune hepatitis, and other hepatocellular injury patterns. Further history and workup indicated.",
        "safety_score": 0.70,
        "triage_level": TriageLevelEnum.LOW,
        "status": StatusEnum.PENDING,
    },
    {
        "query_text": "I've been diagnosed with Type 2 diabetes. What dietary changes should I make?",
        "enhanced_query": "Patient with new diagnosis of Type 2 Diabetes Mellitus seeking nutritional guidance. Recommendations should address carbohydrate management, glycemic index, portion control, and overall balanced diet aligned with ADA guidelines.",
        "safety_score": 0.95,
        "triage_level": TriageLevelEnum.LOW,
        "status": StatusEnum.PROCESSING,
    },
]

SAMPLE_RESPONSES = [
    {
        "response_text": "Your headaches could be caused by several factors including tension, migraines, dehydration, or sleep issues. Since they're worse in the morning, consider whether you might have sleep apnea or teeth grinding. I recommend tracking when these headaches occur, their severity, and any associated symptoms. If they persist or worsen, please consult with your primary care physician. In the meantime, ensure you're staying hydrated, managing stress, and maintaining regular sleep patterns. Over-the-counter pain relievers may help temporarily.",
        "is_approved": True,
        "doctor_notes": "Good general advice. Patient should follow up if symptoms persist beyond 2 weeks or if severity increases.",
    },
    {
        "response_text": "A fever of 102°F lasting three days in a child, now with a developing rash, requires prompt medical attention. This combination of symptoms could indicate several conditions ranging from common viral illnesses to more serious infections. I strongly recommend taking your son to see a healthcare provider today - either your pediatrician if they can see him immediately, or an urgent care/ER if not. While waiting, you can give age-appropriate doses of acetaminophen (Tylenol) to manage the fever, ensure he stays hydrated, and monitor for any worsening symptoms like lethargy, difficulty breathing, or changes in consciousness.",
        "is_approved": True,
        "doctor_notes": "Appropriate urgent recommendation. This presentation needs in-person evaluation to rule out serious conditions like meningitis or severe systemic infection.",
    },
    {
        "response_text": "Ankle swelling (edema) can indeed be a side effect of lisinopril, which is an ACE inhibitor used to treat high blood pressure. This occurs in approximately 1-3% of patients taking this medication. While it's not typically dangerous, you should report this to your doctor at your next appointment. Continue taking your medication as prescribed unless directed otherwise by your healthcare provider. To help reduce the swelling, you might try elevating your legs when sitting or lying down, reducing salt intake, and avoiding prolonged standing. If the swelling becomes severe, is accompanied by facial swelling, difficulty breathing, or other concerning symptoms, seek medical attention immediately as these could indicate a more serious reaction.",
        "is_approved": True,
        "doctor_notes": "Good advice. I would add that the patient should weigh themselves regularly to monitor for increased fluid retention which could indicate worsening edema.",
    },
    {
        "response_text": "The symptoms you're describing - chest pain radiating to your left arm and jaw, shortness of breath, and nausea - are warning signs of a possible heart attack. This is a medical emergency. Please call 911 or your local emergency number immediately. Do not drive yourself to the hospital. While waiting for emergency services, if available and not contraindicated by other medical conditions, you may chew a regular-strength aspirin (325 mg) or four low-dose aspirins (81 mg each). Try to remain calm and seated or lying down. Emergency medical professionals need to evaluate you as soon as possible.",
        "is_approved": True,
        "doctor_notes": "Absolutely correct emergency guidance. This is a textbook presentation of possible ACS/MI requiring immediate EMS activation.",
    },
    {
        "response_text": "Fatigue and unintentional weight loss can indeed be symptoms of thyroid dysfunction, particularly hyperthyroidism (overactive thyroid). However, these symptoms can also be caused by many other conditions including diabetes, depression, chronic infections, celiac disease, or even certain types of cancer. I recommend scheduling an appointment with your healthcare provider for a proper evaluation, which would likely include blood tests to check your thyroid function (TSH, T3, T4), as well as other basic labs. In the meantime, try to maintain regular sleep patterns, eat a balanced diet, and note any other symptoms you may be experiencing to share with your doctor.",
        "is_approved": False,
        "doctor_notes": "Response needs to emphasize the importance of timely evaluation given the combination of fatigue and weight loss, which could indicate serious underlying conditions. Please revise to convey greater urgency.",
    },
]

SAMPLE_FILES = [
    {
        "original_filename": "blood_test_results.pdf",
        "file_path": "/tmp/medical_ai_files/blood_test_results_hash.pdf",
        "file_type": "application/pdf",
        "file_size": 245000,
        "summary": "Complete blood count and metabolic panel from 2023-06-15. Notable findings: ALT 78 U/L (elevated), AST 65 U/L (elevated), all other values within normal range.",
    },
    {
        "original_filename": "medication_list.csv",
        "file_path": "/tmp/medical_ai_files/medication_list_hash.csv",
        "file_type": "text/csv",
        "file_size": 1240,
        "summary": "Current medications: Lisinopril 10mg daily, Atorvastatin 20mg daily, Metformin 500mg twice daily, Aspirin 81mg daily.",
    },
    {
        "original_filename": "symptoms_diary.txt",
        "file_path": "/tmp/medical_ai_files/symptoms_diary_hash.txt",
        "file_type": "text/plain",
        "file_size": 3500,
        "summary": "Two-week headache diary showing pattern of morning headaches rated 7-9/10 in severity, often accompanied by nausea. Pain typically located in frontal and temporal regions bilaterally.",
    },
]


async def seed_database():
    """Seed the database with sample data."""
    print("Initializing database...")
    await init_db()
    
    # Use synchronous session for seeding
    engine = get_engine()
    with Session(engine) as session:
        print("Seeding users...")
        users = []
        for user_data in SAMPLE_USERS:
            user = User(**user_data)
            users.append(user)
            session.add(user)
        session.commit()
        
        print("Seeding queries...")
        queries = []
        for i, query_data in enumerate(SAMPLE_QUERIES):
            # Assign to a random patient
            patient_users = [u for u in users if u.role == RoleEnum.PATIENT]
            user = random.choice(patient_users)
            
            # Create query with timestamps
            created_at = datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 14))
            updated_at = created_at + datetime.timedelta(hours=random.randint(1, 24))
            
            query = Query(
                **query_data,
                user_id=user.id,
                created_at=created_at,
                updated_at=updated_at
            )
            queries.append(query)
            session.add(query)
        session.commit()
        
        print("Seeding responses...")
        for i, response_data in enumerate(SAMPLE_RESPONSES):
            if i < len(queries):
                # Create response with timestamps
                created_at = queries[i].updated_at + datetime.timedelta(hours=random.randint(1, 6))
                updated_at = created_at + datetime.timedelta(hours=random.randint(1, 12))
                
                # Assign to a random doctor
                doctor_users = [u for u in users if u.role == RoleEnum.DOCTOR]
                doctor = random.choice(doctor_users)
                
                response = Response(
                    **response_data,
                    query_id=queries[i].id,
                    doctor_id=doctor.id,
                    created_at=created_at,
                    updated_at=updated_at
                )
                session.add(response)
        session.commit()
        
        print("Seeding files...")
        for i, file_data in enumerate(SAMPLE_FILES):
            if i < len(queries):
                # Create file with timestamps
                created_at = queries[i].created_at + datetime.timedelta(minutes=random.randint(5, 30))
                
                file = File(
                    **file_data,
                    query_id=queries[i].id,
                    created_at=created_at,
                )
                session.add(file)
        session.commit()
        
        print("Database seeding completed successfully!")


def main():
    """Main entry point for the script."""
    print("Starting database seeding process...")
    asyncio.run(seed_database())
    print("Done!")


if __name__ == "__main__":
    main()

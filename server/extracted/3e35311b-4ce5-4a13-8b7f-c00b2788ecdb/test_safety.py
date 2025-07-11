import pytest
import asyncio
import os
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.scorer import calculate_safety_score
from agents.triage import determine_triage_level
from models.models import TriageLevelEnum

# Test queries with varying levels of medical urgency
TEST_QUERIES = [
    {
        "query": "I've been having mild headaches occasionally. What over-the-counter medicine is best?",
        "expected_score_range": (0.7, 1.0),  # Low risk
        "expected_triage": TriageLevelEnum.LOW
    },
    {
        "query": "I've had a persistent cough for three weeks that isn't getting better. Should I see a doctor?",
        "expected_score_range": (0.5, 0.7),  # Low to medium risk
        "expected_triage": TriageLevelEnum.MEDIUM
    },
    {
        "query": "I've been experiencing shortness of breath and chest tightness for the past two days. What could this be?",
        "expected_score_range": (0.3, 0.5),  # Medium risk
        "expected_triage": TriageLevelEnum.HIGH
    },
    {
        "query": "I'm having severe chest pain radiating to my left arm and jaw, along with nausea and sweating. What should I do?",
        "expected_score_range": (0.0, 0.3),  # High risk
        "expected_triage": TriageLevelEnum.URGENT
    },
    {
        "query": "My 2-year-old has had a fever of 104°F for 12 hours and is becoming lethargic. What should I do?",
        "expected_score_range": (0.0, 0.3),  # High risk
        "expected_triage": TriageLevelEnum.URGENT
    },
]

@pytest.mark.asyncio
async def test_safety_scoring():
    """Test the safety scoring functionality."""
    # Skip tests if OpenAI API key is not available
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OpenAI API key not available, skipping test")
    
    for test_case in TEST_QUERIES:
        query = test_case["query"]
        expected_min, expected_max = test_case["expected_score_range"]
        
        # Calculate safety score
        safety_score = await calculate_safety_score(query)
        
        # Check if score is within expected range
        assert isinstance(safety_score, float), f"Expected float, got {type(safety_score)}"
        assert 0.0 <= safety_score <= 1.0, f"Score should be between 0 and 1, got {safety_score}"
        
        # Only check range if we're using the real OpenAI implementation
        # The mock implementation might not match expected ranges
        if os.getenv("OPENAI_API_KEY"):
            assert expected_min <= safety_score <= expected_max, \
                f"Expected score between {expected_min} and {expected_max}, got {safety_score}"

@pytest.mark.asyncio
async def test_triage_determination():
    """Test the triage level determination functionality."""
    # Skip tests if OpenAI API key is not available
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OpenAI API key not available, skipping test")
    
    for test_case in TEST_QUERIES:
        query = test_case["query"]
        expected_triage = test_case["expected_triage"]
        
        # Calculate safety score first
        safety_score = await calculate_safety_score(query)
        
        # Determine triage level
        triage_level = await determine_triage_level(query, safety_score=safety_score)
        
        # Check if triage level is valid
        assert isinstance(triage_level, TriageLevelEnum), \
            f"Expected TriageLevelEnum, got {type(triage_level)}"
        
        # Only check expected level if we're using the real OpenAI implementation
        # The mock implementation might not match expected levels
        if os.getenv("OPENAI_API_KEY"):
            assert triage_level == expected_triage, \
                f"Expected triage level {expected_triage}, got {triage_level}"

@pytest.mark.asyncio
async def test_triage_without_safety_score():
    """Test triage determination without providing a safety score."""
    # Skip tests if OpenAI API key is not available
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OpenAI API key not available, skipping test")
    
    for test_case in TEST_QUERIES:
        query = test_case["query"]
        
        # Determine triage level without safety score
        triage_level = await determine_triage_level(query)
        
        # Check if triage level is valid
        assert isinstance(triage_level, TriageLevelEnum), \
            f"Expected TriageLevelEnum, got {type(triage_level)}"

@pytest.mark.asyncio
async def test_safety_score_with_enhanced_query():
    """Test safety scoring with an enhanced query."""
    # Skip tests if OpenAI API key is not available
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OpenAI API key not available, skipping test")
    
    original_query = "I've been having headaches."
    enhanced_query = "Patient reports experiencing headaches of unspecified duration, frequency, and severity. No additional symptoms mentioned."
    
    # Calculate safety score with original query
    original_score = await calculate_safety_score(original_query)
    
    # Calculate safety score with enhanced query
    enhanced_score = await calculate_safety_score(original_query, enhanced_query=enhanced_query)
    
    # Both scores should be valid
    assert isinstance(original_score, float)
    assert isinstance(enhanced_score, float)
    assert 0.0 <= original_score <= 1.0
    assert 0.0 <= enhanced_score <= 1.0

@pytest.mark.asyncio
async def test_emergency_keywords():
    """Test that emergency keywords trigger appropriate safety scores and triage levels."""
    # Skip tests if OpenAI API key is not available
    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OpenAI API key not available, skipping test")
    
    emergency_queries = [
        "I think I'm having a heart attack",
        "My child is having trouble breathing and their lips are turning blue",
        "I'm having suicidal thoughts and have a plan",
        "I just had a seizure and I've never had one before",
        "I'm bleeding heavily and can't stop it"
    ]
    
    for query in emergency_queries:
        # Calculate safety score
        safety_score = await calculate_safety_score(query)
        
        # Determine triage level
        triage_level = await determine_triage_level(query, safety_score=safety_score)
        
        # Emergency queries should have low safety scores and urgent triage
        if os.getenv("OPENAI_API_KEY"):  # Only check if using real implementation
            assert safety_score < 0.4, f"Expected low safety score for emergency query, got {safety_score}"
            assert triage_level in [TriageLevelEnum.HIGH, TriageLevelEnum.URGENT], \
                f"Expected HIGH or URGENT triage for emergency query, got {triage_level}"

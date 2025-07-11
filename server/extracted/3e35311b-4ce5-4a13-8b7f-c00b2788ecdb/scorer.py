import os
import json
from typing import Dict, Any, Optional
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

# MCP configuration
MCP_ENABLED = os.getenv("MCP_ENABLED", "True").lower() == "true"


async def calculate_safety_score(query_text: str) -> float:
    """
    Calculate a safety score for a medical query.
    
    This function evaluates the potential risk level of a medical query
    and returns a safety score between 0.0 (high risk) and 1.0 (low risk).
    
    Args:
        query_text: The query text to evaluate
        
    Returns:
        Safety score between 0.0 and 1.0
    """
    if MCP_ENABLED:
        return await calculate_safety_score_with_mcp(query_text)
    else:
        return await calculate_safety_score_with_openai(query_text)


async def calculate_safety_score_with_openai(query_text: str) -> float:
    """
    Calculate a safety score using direct OpenAI API calls.
    
    Args:
        query_text: The query text to evaluate
        
    Returns:
        Safety score between 0.0 and 1.0
    """
    if not OPENAI_API_KEY:
        # Fall back to mock implementation if no API key is available
        # For demo purposes, return a random-ish score based on query length
        import random
        return max(0.5, min(0.9, 0.7 + random.uniform(-0.2, 0.2)))
    
    # Prepare the prompt for the OpenAI API
    system_prompt = (
        "You are a medical safety scoring agent. Your task is to evaluate the potential risk level "
        "of a medical query. Consider factors such as urgency, severity, complexity, and potential "
        "for harm if answered incorrectly. Return a single float value between 0.0 (high risk) and "
        "1.0 (low risk). Do not include any explanation or additional text."
    )
    
    # Make the API request
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query_text}
                ],
                "temperature": 0.1,  # Low temperature for consistent scoring
                "max_tokens": 10
            },
            timeout=30.0  # 30 second timeout
        )
    
    # Parse the response
    if response.status_code == 200:
        result = response.json()
        score_text = result["choices"][0]["message"]["content"].strip()
        
        try:
            # Extract the float value from the response
            score = float(score_text)
            # Ensure the score is within the valid range
            score = max(0.0, min(1.0, score))
            return score
        except ValueError:
            # Fall back to a default score if parsing fails
            print(f"Failed to parse safety score: {score_text}")
            return 0.5  # Default to medium risk
    else:
        # Fall back to a default score if API call fails
        print(f"OpenAI API error: {response.status_code} - {response.text}")
        return 0.5  # Default to medium risk


async def calculate_safety_score_with_mcp(query_text: str) -> float:
    """
    Calculate a safety score using MCP orchestration.
    
    Args:
        query_text: The query text to evaluate
        
    Returns:
        Safety score between 0.0 and 1.0
    """
    # In a real implementation, this would call the MCP service
    # For demo purposes, we'll simulate the MCP response
    
    # Mock MCP implementation - simulate different scores based on keywords
    lower_query = query_text.lower()
    
    # Check for high-risk keywords
    if any(word in lower_query for word in ["emergency", "severe", "extreme", "dying", "suicide"]):
        return 0.2  # High risk
    
    # Check for medium-risk keywords
    elif any(word in lower_query for word in ["pain", "chronic", "symptoms", "medication"]):
        return 0.6  # Medium risk
    
    # Default to low-medium risk
    else:
        return 0.8  # Low risk
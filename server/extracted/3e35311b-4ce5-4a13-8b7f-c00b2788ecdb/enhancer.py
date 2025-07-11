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


async def enhance_query(query_text: str) -> str:
    """
    Enhance a medical query to make it more precise and informative.
    
    This function uses either direct OpenAI API calls or MCP orchestration
    to improve the query by adding medical context and clarifying ambiguities.
    
    Args:
        query_text: The original query text from the user
        
    Returns:
        Enhanced query text with medical context
    """
    if MCP_ENABLED:
        return await enhance_query_with_mcp(query_text)
    else:
        return await enhance_query_with_openai(query_text)


async def enhance_query_with_openai(query_text: str) -> str:
    """
    Enhance a medical query using direct OpenAI API calls.
    
    Args:
        query_text: The original query text from the user
        
    Returns:
        Enhanced query text with medical context
    """
    if not OPENAI_API_KEY:
        # Fall back to mock implementation if no API key is available
        return f"Enhanced: {query_text} (with additional medical context)"
    
    # Prepare the prompt for the OpenAI API
    system_prompt = (
        "You are a medical query enhancement agent. Your task is to improve the user's medical query "
        "by adding relevant medical context, clarifying ambiguities, and structuring the query in a "
        "way that will lead to more accurate and helpful responses. Do not diagnose or provide medical "
        "advice - only enhance the query. Return only the enhanced query without explanations."
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
                "temperature": 0.3,  # Lower temperature for more focused responses
                "max_tokens": 500
            },
            timeout=30.0  # 30 second timeout
        )
    
    # Parse the response
    if response.status_code == 200:
        result = response.json()
        enhanced_query = result["choices"][0]["message"]["content"].strip()
        return enhanced_query
    else:
        # Fall back to original query if API call fails
        print(f"OpenAI API error: {response.status_code} - {response.text}")
        return query_text


async def enhance_query_with_mcp(query_text: str) -> str:
    """
    Enhance a medical query using MCP orchestration.
    
    Args:
        query_text: The original query text from the user
        
    Returns:
        Enhanced query text with medical context
    """
    # In a real implementation, this would call the MCP service
    # For demo purposes, we'll simulate the MCP response
    
    # Mock MCP implementation
    enhanced_query = f"Enhanced via MCP: {query_text} (with additional medical context and terminology)"
    
    return enhanced_query
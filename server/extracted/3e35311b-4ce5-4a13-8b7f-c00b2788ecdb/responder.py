import os
import json
from typing import Dict, Any, Optional, List
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

# MCP configuration
MCP_ENABLED = os.getenv("MCP_ENABLED", "True").lower() == "true"


async def generate_response(
    query_text: str,
    file_summaries: Optional[List[str]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Generate a medical response to a user query.
    
    This function creates a comprehensive and safe response to a medical query,
    taking into account any attached files and conversation history.
    
    Args:
        query_text: The query text to respond to
        file_summaries: Optional list of file content summaries
        conversation_history: Optional conversation history
        
    Returns:
        Generated response text
    """
    if MCP_ENABLED:
        return await generate_response_with_mcp(query_text, file_summaries, conversation_history)
    else:
        return await generate_response_with_openai(query_text, file_summaries, conversation_history)


async def generate_response_with_openai(
    query_text: str,
    file_summaries: Optional[List[str]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Generate a medical response using direct OpenAI API calls.
    
    Args:
        query_text: The query text to respond to
        file_summaries: Optional list of file content summaries
        conversation_history: Optional conversation history
        
    Returns:
        Generated response text
    """
    if not OPENAI_API_KEY:
        # Fall back to mock implementation if no API key is available
        return (
            "This is a simulated medical response. In a real implementation, this would be generated "
            "by an AI model with medical knowledge. The response would address the query while being "
            "careful to provide accurate information and appropriate disclaimers."
        )
    
    # Prepare the system prompt
    system_prompt = (
        "You are a medical AI assistant providing information to help with medical queries. "
        "Your responses should be informative, evidence-based, and helpful, while being careful "
        "not to provide definitive diagnoses or treatment recommendations. Always include appropriate "
        "disclaimers and encourage users to consult with healthcare professionals for personalized advice. "
        "Use clear, accessible language and organize information in a structured way."
    )
    
    # Prepare the messages array
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history if available
    if conversation_history:
        messages.extend(conversation_history)
    
    # Prepare the user prompt with file summaries if available
    user_content = query_text
    if file_summaries and len(file_summaries) > 0:
        file_summary_text = "\n\n".join([f"File {i+1}: {summary}" for i, summary in enumerate(file_summaries)])
        user_content = f"{query_text}\n\nAttached Files:\n{file_summary_text}"
    
    messages.append({"role": "user", "content": user_content})
    
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
                "messages": messages,
                "temperature": 0.4,  # Balanced temperature for informative but varied responses
                "max_tokens": 1000
            },
            timeout=60.0  # 60 second timeout for longer responses
        )
    
    # Parse the response
    if response.status_code == 200:
        result = response.json()
        response_text = result["choices"][0]["message"]["content"].strip()
        return response_text
    else:
        # Fall back to a generic response if API call fails
        print(f"OpenAI API error: {response.status_code} - {response.text}")
        return (
            "I apologize, but I'm unable to provide a specific response at this time. "
            "Please consult with a healthcare professional for personalized medical advice."
        )


async def generate_response_with_mcp(
    query_text: str,
    file_summaries: Optional[List[str]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Generate a medical response using MCP orchestration.
    
    Args:
        query_text: The query text to respond to
        file_summaries: Optional list of file content summaries
        conversation_history: Optional conversation history
        
    Returns:
        Generated response text
    """
    # In a real implementation, this would call the MCP service
    # For demo purposes, we'll simulate the MCP response
    
    # Mock MCP implementation
    response = (
        f"MCP-generated response to: {query_text}\n\n"
        "Based on your query, here is some general medical information that might be helpful. "
        "Please note that this information is not a substitute for professional medical advice, "
        "diagnosis, or treatment. Always seek the advice of your physician or other qualified "
        "health provider with any questions you may have regarding a medical condition.\n\n"
    )
    
    # Add file-specific information if available
    if file_summaries and len(file_summaries) > 0:
        response += "Regarding the information in your attached files:\n"
        for i, summary in enumerate(file_summaries):
            response += f"- File {i+1}: The data suggests {summary}\n"
        response += "\n"
    
    # Add some general medical information based on keywords in the query
    lower_query = query_text.lower()
    
    if "headache" in lower_query:
        response += (
            "Headaches can have many causes, including stress, dehydration, lack of sleep, "
            "or underlying medical conditions. For persistent or severe headaches, it's important "
            "to consult with a healthcare provider."
        )
    elif "blood pressure" in lower_query:
        response += (
            "Maintaining healthy blood pressure is important for overall cardiovascular health. "
            "Normal blood pressure is typically around 120/80 mmHg, though this can vary based on "
            "individual factors. Regular monitoring and lifestyle modifications such as diet, "
            "exercise, and stress management can help maintain healthy blood pressure levels."
        )
    else:
        response += (
            "It's important to maintain regular check-ups with your healthcare provider and "
            "discuss any persistent symptoms or concerns. Early detection and prevention are "
            "key components of maintaining good health."
        )
    
    return response
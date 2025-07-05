import streamlit as st
import httpx
import os
import json
from datetime import datetime
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# API configuration
API_HOST = os.getenv("API_HOST", "localhost")
API_PORT = os.getenv("API_PORT", "8000")
API_URL = f"http://{API_HOST}:{API_PORT}/api"

# Demo mode flag - set to True when backend is not available
DEMO_MODE = True  # Change to False when backend is ready

# File upload configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 5 * 1024 * 1024))  # 5MB default
ALLOWED_FILE_TYPES = os.getenv("ALLOWED_FILE_TYPES", ".pdf,.csv,.txt").split(",")

# Set page configuration
st.set_page_config(
    page_title="Medical AI Assistant",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if "user_role" not in st.session_state:
    st.session_state.user_role = "patient"

if "queries" not in st.session_state:
    st.session_state.queries = []

if "current_query_id" not in st.session_state:
    st.session_state.current_query_id = None

if "files" not in st.session_state:
    st.session_state.files = []

if "responses" not in st.session_state:
    st.session_state.responses = []

# Helper function to check API availability
def check_api_available():
    """Check if the API is available"""
    try:
        response = httpx.get(f"{API_URL}/health", timeout=5.0)
        return response.status_code == 200
    except:
        return False

# Safe API call wrapper
def safe_api_call(method, url, **kwargs):
    """Make API calls with proper error handling"""
    if DEMO_MODE:
        return None, "Demo mode - backend not connected"
    
    try:
        if method.upper() == "GET":
            response = httpx.get(url, **kwargs)
        elif method.upper() == "POST":
            response = httpx.post(url, **kwargs)
        elif method.upper() == "PUT":
            response = httpx.put(url, **kwargs)
        else:
            return None, f"Unsupported method: {method}"
        
        if response.status_code >= 400:
            return None, f"API Error {response.status_code}: {response.text}"
        
        # Check if response has content before trying to parse JSON
        if response.content:
            return response.json(), None
        else:
            return {}, None
            
    except httpx.ConnectError:
        return None, "Cannot connect to backend API. Please ensure the backend is running."
    except httpx.TimeoutException:
        return None, "API request timed out."
    except json.JSONDecodeError:
        return None, "Invalid response from API."
    except Exception as e:
        return None, f"Unexpected error: {str(e)}"
    

# UI Components
def sidebar():
    """Render the sidebar with role selection and navigation."""
    with st.sidebar:
        st.sidebar.header("**Assist — AI Diabetes Assistant**")
        # st.sidebar.subheader("***Your Friendly Health Helper for Diabetes***")
        st.sidebar.write("Having trouble explaining your symptoms? Assist helps you turn what you’re feeling into clear, doctor-friendly questions — so you get the right care, faster. All advice is reviewed by physicians to keep you safe.")
        st.sidebar.markdown("---")
        

        
        # Role selection
        role = st.sidebar.selectbox(
            "Access as:",
            [
        "👤 Patient (Ask Questions)",
        "👨‍⚕️ Doctor (Review & Reply)",
        "🛠️ Admin (System Monitoring)"
        ],
        help="Select Patient to submit health queries, Doctor to review and respond, or Admin to view system status.",
        index=0,
        key="role_selection"
        )
        
        # Extract role string from selected label
        selected_role = role.lower().split()[1]  # "patient", "doctor", "admin"

        # Update role if changed
        if selected_role != st.session_state.user_role:
            st.session_state.user_role = selected_role
            st.rerun()
        
        st.divider()
        
        # Navigation based on role       
        if st.session_state.user_role == "patient":
            if st.button("New Query", use_container_width=True):
                st.session_state.current_query_id = None
                st.rerun()
                
            if st.button("My Queries", use_container_width=True):
                pass
        
        elif st.session_state.user_role == "doctor":
            if st.button("Pending Reviews", use_container_width=True):
                st.session_state.current_query_id = None
                st.session_state.view = "pending_reviews"
                st.rerun()
                
            if st.button("All Queries", use_container_width=True):
                st.session_state.current_query_id = None
                st.session_state.view = "all_queries"
                st.rerun()
        
        elif st.session_state.user_role == "admin":
            if st.button("System Status", use_container_width=True):
                st.session_state.view = "system_status"
                st.rerun()
                
            if st.button("All Queries", use_container_width=True):
                st.session_state.view = "all_queries"
                st.rerun()
        
        st.divider()
        st.caption("&copy;2025 | Assist v1.0 | Built for diabetes care")


def patient_view():
    """Render the patient view for submitting and viewing queries."""
    if st.session_state.current_query_id is None:
        # New query form
        st.title("🩺 Ask Assist")
        
        if DEMO_MODE:
            st.info("📝 Demo Mode: You can test the interface, but queries won't be processed until the backend is connected.")
        
        
        with st.form("query_form"):
            query_text = st.text_area(
                "💬 Ask a question about diabetes:",
                placeholder="e.g., What should I eat if my blood sugar is high?",
                height=150,
                max_chars=1000,
                help="Be as specific as possible for the best response"
            )
            
            uploaded_files = st.file_uploader(
                "Upload lab results, blood test reports, or doctor notes to help us understand your situation better (optional)",
                accept_multiple_files=True,
                type=[ext.replace(".", "") for ext in ALLOWED_FILE_TYPES],
                help=f"Allowed file types: {', '.join(ALLOWED_FILE_TYPES)}"
            )
            
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                submit_button = st.form_submit_button("Submit Query", type="primary", use_container_width=True)
            
            if submit_button and query_text:
                if DEMO_MODE:
                    st.success("✅ Query submitted successfully! (Demo Mode)")
                    st.info("In demo mode, this would normally:")
                    st.write("1. Send your query to the AI system")
                    st.write("2. Process any uploaded files")
                    st.write("3. Generate an AI response")
                    st.write("4. Queue the response for doctor review")
                else:
                    with st.spinner("Processing your query..."):
                        # Submit the query
                        query_result, error = safe_api_call(
                            "POST", 
                            f"{API_URL}/query/",
                            json={"query_text": query_text},
                            headers={"X-User-Role": st.session_state.user_role},
                            timeout=30.0
                        )
                        
                        if error:
                            st.error(f"Error submitting query: {error}")
                        else:
                            query_id = query_result["query_id"]
                            st.session_state.current_query_id = query_id
                            st.success("Query submitted successfully!")
                            st.rerun()
    else:
        # Show query details (demo mode)
        st.header("Your Medical Query")
        st.info("📋 Demo Mode: Showing sample query details")
        
        with st.expander("Query Details", expanded=True):
            st.write("**Query ID:** DEMO-12345")
            st.write("**Status:** Processing")
            st.write("**Triage Level:** Medium")
            
            st.subheader("Your Question")
            st.write("This would show your submitted question here.")
        
        st.header("AI Response")
        st.info("🤖 In demo mode, this would show the AI-generated response pending doctor review.")
        
        if st.button("New Query"):
            st.session_state.current_query_id = None
            st.rerun()

def doctor_view():
    """Render the doctor view for reviewing and approving responses."""
    if not hasattr(st.session_state, "view"):
        st.session_state.view = "pending_reviews"
    
    if st.session_state.view == "pending_reviews":
        st.title("👨‍⚕️ Doctor Dashboard")
        
        if DEMO_MODE:
            st.info("👨‍⚕️ Demo Mode: Showing sample pending reviews")
            
            # Demo data
            st.subheader("Pending Review")
            query = {
                "id": "DEMO-12345",
                "patient": "John Doe",
                "text": "I have been experiencing hot flashes and blood sugar spikes...",
                "ai_response": "Based on your symptoms, here are some possible causes and recommendations...",
                "status": "Needs Review",
                "triage": "Medium",
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

            
            with st.expander("Query Details"):
                st.write(f"**Patient:** {query["patient"]}")
                st.write(f"**Patient Query:** {query["text"]}")
                st.write(f"**Status:** {query["status"]}")
                st.write(f"**Priority:** {query["triage"]}")
                st.write(f"**Datetime:** {query["timestamp"]}")
            
            st.subheader("AI Generated Suggestion")
            #st.write("Based on your symptoms, here are some possible causes and recommendations...")

            # Store editable content in session state
            if "edited_response" not in st.session_state:
                st.session_state.edited_response = query["ai_response"]

            st.session_state.edited_response = st.text_area(
                "View or modify the AI-generated response:",
                value=st.session_state.edited_response,
                height=150
            )

            # Buttons
            col1, col2, col3, col4, col5, col6 = st.columns(6)

            with col5:
                if st.button("🔄 Regenerate", key=f"regen_{query['id']}", use_container_width=True):
                    st.info("Regenerating response...") 
                    
            with col6:
                if st.button("✓ Approve & Send", 
                             key=f"approve_{query['id']}", 
                             use_container_width=True,
                             type="primary"
                             ):
                    st.success("Response approved and sent!")
                    # Simulate saving st.session_state.edited_response
        else:
            # Real API call
            with st.spinner("Loading pending reviews..."):
                pending_reviews, error = safe_api_call(
                    "GET",
                    f"{API_URL}/review/pending",
                    headers={"X-User-Role": st.session_state.user_role},
                    timeout=30.0
                )
                
                if error:
                    st.error(f"Error loading reviews: {error}")
                elif not pending_reviews:
                    st.info("No reviews pending at this time.")
                else:
                    # Display actual pending reviews
                    st.write("Pending reviews loaded successfully!")

def admin_view():
    """Render the admin view for system monitoring and management."""
    st.header("System Status")
    
    if DEMO_MODE:
        st.info("🔧 Demo Mode: Showing sample system metrics")
    
    # System metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Active Queries", "42" if DEMO_MODE else "N/A")
    
    with col2:
        st.metric("Pending Reviews", "7" if DEMO_MODE else "N/A")
    
    with col3:
        st.metric("Response Time (avg)", "1.2s" if DEMO_MODE else "N/A")
    
    # Agent status
    st.subheader("Agent Status")
    
    if DEMO_MODE:
        agent_data = {
            "Query Enhancement Agent": {"status": "Demo", "latency": "N/A"},
            "Safety Scoring Agent": {"status": "Demo", "latency": "N/A"},
            "Triage Agent": {"status": "Demo", "latency": "N/A"},
            "Doctor Approval Agent": {"status": "Demo", "latency": "N/A"}
        }
        
        for agent, data in agent_data.items():
            st.write(f"**{agent}:** {data['status']} (Latency: {data['latency']})")
    else:
        st.info("Connect backend to see real agent status")

# Main app logic
def main():
    """Main application entry point."""
    # Render the sidebar
    sidebar()
    
    # Render the appropriate view based on user role
    try:
        if st.session_state.user_role == "patient":
            patient_view()
        elif st.session_state.user_role == "doctor":
            doctor_view()
        elif st.session_state.user_role == "admin":
            admin_view()
    except Exception as e:
        st.error(f"An error occurred: {str(e)}")
        st.info("Try refreshing the page or switching to a different role.")
        

if __name__ == "__main__":
    main()

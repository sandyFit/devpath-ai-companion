import streamlit as st
import datetime

def query_card(query_data, show_enhanced=True, show_actions=True):
    """
    A reusable component for displaying query details in a card format.
    
    Parameters:
    - query_data: Dictionary containing query information
    - show_enhanced: Whether to show the enhanced query
    - show_actions: Whether to show action buttons
    
    Returns:
    - Any action selected by the user
    """
    # Container for the card
    with st.container():
        # Add a border and padding with CSS
        st.markdown("""
        <style>
        .query-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
        }
        </style>
        """, unsafe_allow_html=True)
        
        # Start the card
        st.markdown('<div class="query-card">', unsafe_allow_html=True)
        
        # Query metadata
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            st.markdown(f"**Query ID:** {query_data.get('query_id', 'N/A')}")
        
        with col2:
            status = query_data.get('status', 'pending').upper()
            status_color = {
                'PENDING': 'blue',
                'PROCESSING': 'orange',
                'NEEDS_REVIEW': 'purple',
                'COMPLETED': 'green',
                'REJECTED': 'red'
            }.get(status, 'gray')
            
            st.markdown(f"<span style='color:{status_color};font-weight:bold;'>{status}</span>", 
                      unsafe_allow_html=True)
        
        with col3:
            triage_level = query_data.get('triage_level', 'N/A').upper()
            triage_color = {
                'LOW': 'green',
                'MEDIUM': 'orange',
                'HIGH': 'red',
                'URGENT': 'darkred'
            }.get(triage_level, 'gray')
            
            if triage_level != 'N/A':
                st.markdown(f"<span style='color:{triage_color};font-weight:bold;'>{triage_level}</span>", 
                          unsafe_allow_html=True)
        
        # Timestamp
        if 'created_at' in query_data:
            try:
                # Parse the timestamp
                if isinstance(query_data['created_at'], str):
                    timestamp = datetime.datetime.fromisoformat(query_data['created_at'].replace('Z', '+00:00'))
                else:
                    timestamp = query_data['created_at']
                    
                st.caption(f"Created: {timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
            except (ValueError, TypeError):
                st.caption(f"Created: {query_data['created_at']}")
        
        # Query text
        st.markdown("### Query")
        st.markdown(query_data.get('query_text', 'No query text available'))
        
        # Enhanced query
        if show_enhanced and query_data.get('enhanced_query'):
            with st.expander("Enhanced Query (AI-processed)", expanded=False):
                st.markdown(query_data['enhanced_query'])
        
        # Safety score if available
        if 'safety_score' in query_data and query_data['safety_score'] is not None:
            score = float(query_data['safety_score'])
            score_color = 'green' if score >= 0.7 else 'orange' if score >= 0.4 else 'red'
            
            st.markdown(f"**Safety Score:** <span style='color:{score_color};'>{score:.2f}</span>", 
                      unsafe_allow_html=True)
        
        # Action buttons
        if show_actions:
            col1, col2, col3 = st.columns([1, 1, 1])
            
            with col1:
                view_details = st.button("View Details", key=f"view_{query_data.get('query_id', 'unknown')}")
            
            with col2:
                if query_data.get('status') in ['pending', 'processing']:
                    refresh = st.button("Refresh", key=f"refresh_{query_data.get('query_id', 'unknown')}")
                else:
                    refresh = False
            
            with col3:
                if query_data.get('status') == 'needs_review' and st.session_state.user_role == 'doctor':
                    review = st.button("Review", key=f"review_{query_data.get('query_id', 'unknown')}")
                else:
                    review = False
        else:
            view_details = False
            refresh = False
            review = False
        
        # End the card
        st.markdown('</div>', unsafe_allow_html=True)
        
        return {
            'view_details': view_details,
            'refresh': refresh,
            'review': review
        }
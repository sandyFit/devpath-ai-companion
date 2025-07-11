import streamlit as st
import httpx
import os
import base64
from io import BytesIO

def file_viewer(file_data, api_url, user_role):
    """
    A reusable component for displaying file information and providing download options.
    
    Parameters:
    - file_data: Dictionary containing file information
    - api_url: Base URL for the API
    - user_role: Current user role for API requests
    """
    # Container for the file card
    with st.container():
        # Add a border and padding with CSS
        st.markdown("""
        <style>
        .file-card {
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 10px;
            background-color: #f5f5f5;
        }
        </style>
        """, unsafe_allow_html=True)
        
        # Start the card
        st.markdown('<div class="file-card">', unsafe_allow_html=True)
        
        # File metadata
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.markdown(f"**{file_data.get('original_filename', 'Unknown file')}**")
            st.caption(f"Type: {file_data.get('file_type', 'Unknown')}")
            
            # File size formatting
            if 'file_size' in file_data and file_data['file_size']:
                size_bytes = int(file_data['file_size'])
                if size_bytes < 1024:
                    size_str = f"{size_bytes} bytes"
                elif size_bytes < 1024 * 1024:
                    size_str = f"{size_bytes / 1024:.1f} KB"
                else:
                    size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
                
                st.caption(f"Size: {size_str}")
        
        with col2:
            # Download button
            if st.button("Download", key=f"download_{file_data.get('file_id', 'unknown')}"):
                try:
                    # Get file content
                    response = httpx.get(
                        f"{api_url}/file/download/{file_data.get('file_id')}",
                        headers={"X-User-Role": user_role},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        # Create download link
                        file_content = response.content
                        b64 = base64.b64encode(file_content).decode()
                        filename = file_data.get('original_filename', 'download')
                        mime_type = file_data.get('file_type', 'application/octet-stream')
                        
                        href = f'<a href="data:{mime_type};base64,{b64}" download="{filename}" target="_blank">Click to download</a>'
                        st.markdown(href, unsafe_allow_html=True)
                    else:
                        st.error(f"Error downloading file: {response.text}")
                except Exception as e:
                    st.error(f"Error: {str(e)}")
        
        # File summary if available
        if 'summary' in file_data and file_data['summary']:
            with st.expander("File Summary", expanded=False):
                st.markdown(file_data['summary'])
        
        # Preview for supported file types
        if file_data.get('file_type') in ['text/plain', 'text/csv']:
            with st.expander("Preview", expanded=False):
                try:
                    # Get file content for preview
                    response = httpx.get(
                        f"{api_url}/file/download/{file_data.get('file_id')}",
                        headers={"X-User-Role": user_role},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        content = response.content.decode('utf-8', errors='replace')
                        # Limit preview to first 1000 characters
                        if len(content) > 1000:
                            content = content[:1000] + "\n\n[Content truncated...]\n"
                        st.text(content)
                    else:
                        st.error("Could not load preview")
                except Exception as e:
                    st.error(f"Error loading preview: {str(e)}")
        
        # End the card
        st.markdown('</div>', unsafe_allow_html=True)


def file_uploader_component(api_url, query_id, user_role, allowed_types, max_size):
    """
    A reusable component for uploading files.
    
    Parameters:
    - api_url: Base URL for the API
    - query_id: ID of the query to associate files with
    - user_role: Current user role for API requests
    - allowed_types: List of allowed file extensions
    - max_size: Maximum file size in bytes
    
    Returns:
    - List of uploaded file data
    """
    uploaded_files = st.file_uploader(
        "Upload files",
        accept_multiple_files=True,
        type=[ext.replace(".", "") for ext in allowed_types.split(",")],
        help=f"Allowed file types: {', '.join(allowed_types.split(','))}, Max size: {max_size/(1024*1024):.1f}MB"
    )
    
    uploaded_file_data = []
    
    if uploaded_files:
        for file in uploaded_files:
            # Check file size
            if file.size > max_size:
                st.error(f"File {file.name} exceeds the maximum size limit of {max_size/(1024*1024):.1f}MB")
                continue
            
            # Upload file
            with st.spinner(f"Uploading {file.name}..."):
                try:
                    files = {"file": (file.name, file.getvalue(), file.type)}
                    response = httpx.post(
                        f"{api_url}/file/upload/{query_id}",
                        files=files,
                        headers={"X-User-Role": user_role},
                        timeout=60.0
                    )
                    
                    if response.status_code == 201:
                        file_data = response.json()
                        uploaded_file_data.append(file_data)
                        st.success(f"File {file.name} uploaded successfully")
                    else:
                        st.error(f"Error uploading {file.name}: {response.text}")
                except Exception as e:
                    st.error(f"Error uploading {file.name}: {str(e)}")
    
    return uploaded_file_data
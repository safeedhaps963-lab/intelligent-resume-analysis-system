"""
run.py - Application Entry Point
================================
This is the main entry point for the Flask application.
Run this file to start the development server.

Usage:
    python run.py

The server will start on http://localhost:8000
"""

# Import the create_app factory function and socketio
from app import create_app, socketio

# Create the Flask app instance
app = create_app()

# Entry point
if __name__ == '__main__':
    # Run the Flask development server with SocketIO
    # - debug=True: show detailed errors
    # - use_reloader=False: prevents port conflicts
    # - host='0.0.0.0': accessible from any IP
    # - port=8000: default port
    socketio.run(
        app,
        debug=True,
        use_reloader=False,  # <-- FIX: prevents "Address already in use"
        host='0.0.0.0',
        port=8000
    )

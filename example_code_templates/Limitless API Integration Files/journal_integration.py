"""
Journal module integration helpers.

This module helps integrate the journal module with the Flask application.
"""

import logging
from flask import Flask

# Set up logging
logger = logging.getLogger(__name__)

def register_journal_module(app: Flask):
    """
    Register the journal module with the Flask application.
    
    This function:
    1. Registers the journal blueprint
    2. Sets up configuration for journal clients
    3. Creates and initializes the journal clients (without polling)
    
    Args:
        app: The Flask application instance
    """
    # Register the journal blueprint
    from app.journal.routes import journal_bp
    app.register_blueprint(journal_bp)
    
    # Initialize journal clients
    if app.config.get('INITIALIZE_JOURNAL_CLIENTS', True):
        from app.journal.utils import init_journal_clients
        with app.app_context():
            init_journal_clients()
    
    logger.info("Journal module registered without background polling")

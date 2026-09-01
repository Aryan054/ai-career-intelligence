import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app

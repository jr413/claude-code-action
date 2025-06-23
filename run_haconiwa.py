#!/usr/bin/env python3
"""Wrapper script to run haconiwa from the submodule."""

import sys
import os

# Add haconiwa to the Python path
haconiwa_path = os.path.join(os.path.dirname(__file__), 'haconiwa', 'src')
sys.path.insert(0, haconiwa_path)

# Import and run haconiwa CLI
from haconiwa.cli import app

if __name__ == "__main__":
    app()
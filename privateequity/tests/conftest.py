import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
if root_path not in sys.path:
    sys.path.insert(0, root_path)

import sys
import os

# Set path to parent directory to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from seed import main

if __name__ == "__main__":
    main()

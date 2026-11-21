"""The programme flyer is drawn with the share flyer in build-posters.py."""

import runpy
from pathlib import Path

runpy.run_path(str(Path(__file__).with_name("build-posters.py")))

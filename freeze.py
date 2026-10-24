"""Export the Flask pages as a static site in docs/ for GitHub Pages."""

import shutil
from pathlib import Path

from app import app

ROOT = Path(__file__).parent
OUT = ROOT / "docs"

# Flask 產生的是絕對路徑；GitHub Pages 放在 /letsgo/ 底下，所以改成相對路徑。
PAGES = {"/": "index.html", "/music": "music.html"}
REPLACEMENTS = [
    ('"/static/', '"static/'),
    ('href="/music"', 'href="music.html"'),
    ('href="/"', 'href="./"'),
]


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "static", OUT / "static")

    client = app.test_client()
    for route, filename in PAGES.items():
        html = client.get(route).get_data(as_text=True)
        for old, new in REPLACEMENTS:
            html = html.replace(old, new)
        (OUT / filename).write_text(html, encoding="utf-8")

    # 告訴 GitHub Pages 不要用 Jekyll 處理檔案。
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Static site written to {OUT}")


if __name__ == "__main__":
    main()

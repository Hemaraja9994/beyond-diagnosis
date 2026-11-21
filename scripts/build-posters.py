"""Builds the one-page poster and the two-page programme flyer.

The designs are plain HTML and CSS (scripts/posters/poster.css) rendered by a
headless Chrome, so the type matches the website (Fraunces and Outfit).

Outputs, in public/brochure/:
  block-the-date.png / .pdf          one-page poster
  beyond-the-diagnosis-1.png / -2.png two flyer pages
  beyond-the-diagnosis.pdf           both flyer pages

Run:  python3 scripts/build-posters.py
Needs: pip install playwright qrcode pillow, and Chrome or Chromium.
"""

from __future__ import annotations

import html
import io
import os
import shutil
import tempfile
from pathlib import Path

import qrcode
import qrcode.image.svg
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"
KIT = Path(__file__).resolve().parent / "posters"
OUT = PUBLIC / "brochure"

SITE = "yenepoya-cre.vercel.app"
REGISTER_URL = f"https://{SITE}/registration"
WIDTH, HEIGHT = 1080, 1528
PNG_SCALE = 1.5

TALKS = [
    {
        "time": "10:00",
        "meridiem": "AM",
        "title": "The RPwD Act, 2016: Rights, Responsibilities and Reach – An Overview",
        "person": "Dr. Shwetha Prabhu",
        "role": "Associate Professor and Head of the Department",
        "short": "Associate Professor and HOD, ASLP",
        "crr": "CRR A18456",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "time": "11:00",
        "meridiem": "AM",
        "title": "Know the 21: Types of Disabilities Recognised under the RPwD Act, 2016",
        "person": "Ms. Swathi Chinnasamy",
        "role": "Assistant Professor",
        "short": "Assistant Professor",
        "crr": "CRR A81760",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "time": "12:00",
        "meridiem": "PM",
        "title": "Learning, Intellectual and Autism Spectrum Disabilities: Rights and Entitlements under the RPwD Act, 2016 – A Psychologist’s Perspective",
        "person": "Ms. Vasudha K G",
        "role": "Assistant Professor, Department of Psychiatry, KMC Mangaluru (MAHE)",
        "short": "Assistant Professor, Dept. of Psychiatry, KMC Mangaluru (MAHE)",
        "crr": "CRR A85535",
        "photo": PUBLIC / "faculty" / "vasudha-kg.jpg",
    },
    {
        "time": "01:00",
        "meridiem": "PM",
        "title": "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
        "person": "Dr. Satyapal Puri Goswami",
        "role": "",
        "short": "CRR A00260",
        "crr": "CRR A00260",
        "photo": PUBLIC / "faculty" / "satyapal-goswami.jpg",
    },
]

TEAM = [
    {
        "name": "Dr. Shwetha Prabhu",
        "role": "Organising chairperson",
        "detail": "Associate Professor and<br>Head of the Department",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "name": "Ms. Swathi Chinnasamy",
        "role": "Organising secretary",
        "detail": "Assistant Professor",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "name": "Ms. Rachana R Uchil",
        "role": "Organising secretary",
        "detail": "Clinical Supervisor",
        "photo": PUBLIC / "department" / "rachana-uchil.jpg",
    },
]

AUDIENCE = [
    "Audiologists",
    "Speech-language pathologists",
    "Clinical psychologists",
    "Special educators",
    "Occupational therapists",
    "Rehabilitation professionals",
]


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def crop_square(path: Path, size: int = 480) -> Image.Image:
    """Trim a white studio background, then take a head-and-shoulders square."""
    image = Image.open(path).convert("RGB")
    width, height = image.size
    pixels = image.load()
    min_x, min_y, max_x, max_y = width, height, 0, 0
    for y in range(0, height, 2):
        for x in range(0, width, 2):
            red, green, blue = pixels[x, y]
            if red < 245 or green < 245 or blue < 245:
                min_x, min_y = min(min_x, x), min(min_y, y)
                max_x, max_y = max(max_x, x), max(max_y, y)
    if max_x > min_x and max_y > min_y:
        image = image.crop((max(0, min_x - 2), max(0, min_y - 2), min(width, max_x + 4), min(height, max_y + 4)))
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = min(height - side, max(0, int((height - side) * 0.06)))
    return image.crop((left, top, left + side, top + side)).resize((size, size), Image.Resampling.LANCZOS)


def qr_svg(url: str) -> str:
    image = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=0)
    buffer = io.BytesIO()
    image.save(buffer)
    svg = buffer.getvalue().decode("utf-8")
    svg = svg[svg.index("<svg") :]
    return svg.replace('fill="#000000"', 'fill="#0c2340"')


def photo(build: Path, path: Path) -> str:
    name = f"p-{path.stem}.jpg"
    target = build / name
    if not target.exists():
        crop_square(path).save(target, "JPEG", quality=92)
    return name


def header() -> str:
    return f"""
    <header class="head">
      <img class="college" src="{(BRAND / 'yenepoya-medical-college.png').as_uri()}" alt="">
      <p class="dept">Department of Audiology and<br>Speech Language Pathology
        <small>Yenepoya Medical College Hospital · Yenepoya (Deemed to be University), Mangaluru</small></p>
      <img class="council" src="{(BRAND / 'rci.png').as_uri()}" alt="">
    </header>"""


def footer(qr: str, page: str = "") -> str:
    page_line = f'<small class="page-no">{page}</small>' if page else ""
    return f"""
    <footer class="foot">
      <div class="org">
        <strong>Department of Audiology and Speech Language Pathology</strong>
        <span>Yenepoya Medical College Hospital, Deralakatte, Mangaluru<br>Yenepoya (Deemed to be University)</span>
      </div>
      <div class="cta">
        <div>
          <p>Register now</p>
          <b>{SITE}</b>
          <small>yenepoyaaslpconference@gmail.com</small>
          {page_line}
        </div>
        <div class="qr">{qr}</div>
      </div>
    </footer>"""


def poster(build: Path, qr: str) -> str:
    speakers = "".join(
        f"""<div><div class="portrait"><img src="{photo(build, t['photo'])}" alt=""></div>
        <h3>{esc(t['person'])}</h3><p>{esc(t['short'])}</p></div>"""
        for t in TALKS
    )
    rows = "".join(
        f"""<li><time class="serif">{t['time']}<small>{t['meridiem']}</small></time>
        <span class="topic">{esc(t['title'])}</span><span class="who">{esc(t['person'])}</span></li>"""
        for t in TALKS
    )
    return f"""
    <section class="sheet poster">
      {header()}
      <div class="hero">
        <div>
          <p class="kicker">Zonal CRE Programme</p>
          <h1 class="title serif">Beyond the<br><em>Diagnosis</em></h1>
          <p class="subtitle">Disability Assessment, Certification and Entitlements under the RPwD Act, 2016</p>
          <div class="meta"><span>Zonal CRE</span><span>English</span><span>One day · Four sessions</span></div>
        </div>
        <aside class="datecard">
          <p class="dow">Saturday</p>
          <div class="day serif"><b>19</b><span>December<br>2026</span></div>
          <dl>
            <div><dt>Starts</dt><dd>10:00 AM IST</dd></div>
            <div><dt>Mode</dt><dd>Online · Cisco Webex</dd></div>
          </dl>
          <div class="chips">
            <span class="chip chip-line"><i></i>RCI CRE approval awaited</span>
            <span class="chip chip-solid">Limited to 50 seats</span>
          </div>
        </aside>
      </div>
      <div class="speakers">
        <p class="section-label">Resource <span>speakers</span></p>
        <div class="speaker-row">{speakers}</div>
      </div>
      <div class="schedule">
        <p class="section-label">Programme <span>schedule</span></p>
        <ol class="schedule-list">{rows}</ol>
      </div>
      <div class="team">
        <div><p>Organising chairperson</p><b>Dr. Shwetha Prabhu</b></div>
        <div><p>Organising secretaries</p><b>Ms. Swathi Chinnasamy<br>Ms. Rachana R Uchil</b></div>
      </div>
      {footer(qr)}
    </section>"""


def flyer_cover(build: Path, qr: str) -> str:
    sessions = "".join(
        f"""<article class="session">
          <div class="portrait"><img src="{photo(build, t['photo'])}" alt=""></div>
          <div>
            <div class="when"><time>{t['time']} {t['meridiem']}</time><span class="n">· Session {index + 1}</span></div>
            <h3 class="serif">{esc(t['title'])}</h3>
            <p class="by"><b>{esc(t['person'])}</b> <span>· {esc(', '.join(x for x in (t['role'], t['crr']) if x))}</span></p>
          </div>
        </article>"""
        for index, t in enumerate(TALKS)
    )
    return f"""
    <section class="sheet flyer">
      {header()}
      <div class="intro">
        <p class="kicker">Zonal CRE Programme · RCI CRE approval awaited</p>
        <h1 class="title serif">Beyond the <em>Diagnosis</em></h1>
        <p class="subtitle">Disability Assessment, Certification and Entitlements under the RPwD Act, 2016</p>
      </div>
      <dl class="factbar">
        <div><dt>Date</dt><dd>Sat, 19 December 2026</dd></div>
        <div><dt>Time</dt><dd>From 10:00 AM IST</dd></div>
        <div><dt>Mode</dt><dd>Online · Cisco Webex</dd></div>
        <div><dt>Level</dt><dd>Zonal · English</dd></div>
      </dl>
      <div class="sessions">
        <p class="section-label">The <span>programme</span></p>
        <div class="session-list">{sessions}</div>
      </div>
      {footer(qr, "Page 1 of 2")}
    </section>"""


def flyer_team(build: Path, qr: str) -> str:
    team = "".join(
        f"""<div><div class="portrait"><img src="{photo(build, p['photo'])}" alt=""></div>
        <p>{esc(p['role'])}</p><h3>{esc(p['name'])}</h3><span>{p['detail']}</span></div>"""
        for p in TEAM
    )
    tags = "".join(f"<span>{esc(a)}</span>" for a in AUDIENCE)
    return f"""
    <section class="sheet flyer">
      {header()}
      <div class="team-head">
        <p class="kicker">Beyond the Diagnosis · 19 December 2026</p>
        <h2 class="serif">Organising team</h2>
      </div>
      <div class="team-row">{team}</div>
      <div class="info-grid">
        <div class="info">
          <h4>Who should attend</h4>
          <div class="tags">{tags}</div>
        </div>
        <div class="info tinted">
          <h4>How to register</h4>
          <ol>
            <li><b>1</b><span>Register at <strong>{SITE}</strong> with your name and CRR number.</span></li>
            <li><b>2</b><span>Pay the fee on Razorpay using the link on the site.</span></li>
            <li><b>3</b><span>Add your payment ID or receipt to confirm your seat.</span></li>
          </ol>
        </div>
        <div class="info">
          <h4>Contact</h4>
          <div class="lines">
            <div><small>Email</small>yenepoyaaslpconference@gmail.com</div>
            <div><small>Phone</small>+91 73377 98055</div>
            <div><small>Department</small>aslp@yenepoya.edu.in</div>
          </div>
        </div>
        <div class="info">
          <h4>Venue</h4>
          <p class="big serif">Online on<br>Cisco Webex</p>
          <div class="lines"><div>The joining link is shared with registered participants. Seats are limited to 50.</div></div>
        </div>
      </div>
      <div class="refs">
        <img src="{(BRAND / 'rci.png').as_uri()}" alt="">
        <p><b>Rehabilitation Council of India</b> · CRE approval awaited<br>
          <span>Acknowledgement CRE-26111620026773 · Institute code KK048</span></p>
        <img src="{(BRAND / 'swavlamban.png').as_uri()}" alt="">
      </div>
      {footer(qr, "Page 2 of 2")}
    </section>"""


def document(build: Path, body: str) -> Path:
    page = f"""<!doctype html><html><head><meta charset="utf-8">
    <link rel="stylesheet" href="poster.css">
    <style>@page {{ size: {WIDTH}px {HEIGHT}px; margin: 0; }} .sheet {{ break-after: page; }}</style>
    </head><body>{body}</body></html>"""
    path = build / f"doc-{abs(hash(body))}.html"
    path.write_text(page, encoding="utf-8")
    return path


def chrome() -> str | None:
    for candidate in (os.environ.get("CHROME_PATH"), "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"):
        if candidate and Path(candidate).exists():
            return candidate
    return None


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        shutil.copy(KIT / "poster.css", work / "poster.css")
        shutil.copytree(KIT / "fonts", work / "fonts")
        qr = qr_svg(REGISTER_URL)

        jobs = {
            "block-the-date": [poster(work, qr)],
            "beyond-the-diagnosis": [flyer_cover(work, qr), flyer_team(work, qr)],
        }

        with sync_playwright() as play:
            path = chrome()
            browser = play.chromium.launch(executable_path=path) if path else play.chromium.launch()
            for name, sheets in jobs.items():
                doc = document(work, "".join(sheets))
                context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=PNG_SCALE)
                page = context.new_page()
                page.goto(doc.as_uri())
                page.evaluate("document.fonts.ready")
                page.wait_for_timeout(300)
                elements = page.query_selector_all(".sheet")
                for index, element in enumerate(elements):
                    suffix = "" if len(elements) == 1 else f"-{index + 1}"
                    target = OUT / f"{name}{suffix}.png"
                    element.screenshot(path=str(target))
                    Image.open(target).convert("RGB").save(target, "PNG", optimize=True)
                    print(target.relative_to(ROOT))
                page.pdf(path=str(OUT / f"{name}.pdf"), width=f"{WIDTH}px", height=f"{HEIGHT}px", print_background=True)
                print((OUT / f"{name}.pdf").relative_to(ROOT))
                context.close()
            browser.close()


if __name__ == "__main__":
    build()

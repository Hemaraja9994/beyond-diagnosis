"""Builds the one-page poster and the two-page programme flyer.

The designs are plain HTML and CSS (scripts/posters/poster.css) rendered by a
headless Chrome, so the type matches the website (Fraunces and Outfit).

Outputs, in public/brochure/:
  block-the-date.png / .pdf          one-page poster
  beyond-the-diagnosis-1.png / -2.png two flyer pages
  beyond-the-diagnosis.pdf           both flyer pages
  online-programme-1.png / -2.png    participant registration brochure (offline hands-on + online), two pages
  online-programme.pdf               both pages, with the registration link and QR code

Run:  python3 scripts/build-posters.py            (everything)
      python3 scripts/build-posters.py online     (only the named outputs: poster, flyer, online)
Needs: pip install playwright pillow, Chrome or Chromium, and the site's node_modules (for the QR code).
"""

from __future__ import annotations

import html
import io
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"
KIT = Path(__file__).resolve().parent / "posters"
OUT = PUBLIC / "brochure"

EMAIL = "yenepoyaaslpconference@gmail.com"
PHONE = "+91 73377 98055"
WIDTH, HEIGHT = 1080, 1528
PNG_SCALE = 1.5

TALKS = [
    {
        "time": "10:00",
        "meridiem": "AM",
        "title": "The RPwD Act, 2016: Rights, Responsibilities and Reach – An Overview",
        "person": "Dr. Shwetha Prabhu",
        "role": "Professor, Department of Audiology and Speech Language Pathology, Yenepoya University",
        "crr": "CRR A18456",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "time": "11:00",
        "meridiem": "AM",
        "title": "Know the 21: Types of Disabilities Recognised under the RPwD Act, 2016",
        "person": "Ms. Swathi Chinnasamy",
        "role": "Assistant Professor, Department of Audiology and Speech Language Pathology, Yenepoya University",
        "crr": "CRR A81760",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "time": "12:00",
        "meridiem": "PM",
        "title": "Learning, Intellectual and Autism Spectrum Disabilities: Rights and Entitlements under the RPwD Act, 2016 – A Psychologist’s Perspective",
        "person": "Ms. Vasudha K G",
        "role": "Assistant Professor in Clinical Psychology, Department of Psychiatry, KMC Mangalore",
        "crr": "CRR A85535",
        "photo": PUBLIC / "faculty" / "vasudha-kg.jpg",
    },
    {
        "time": "01:00",
        "meridiem": "PM",
        "title": "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
        "person": "Dr. S P Goswami",
        "role": "Professor of Speech Pathology, All India Institute of Speech and Hearing",
        "crr": "CRR A00260",
        "photo": PUBLIC / "faculty" / "satyapal-goswami.jpg",
    },
]

TEAM = [
    {
        "name": "Dr. Shwetha Prabhu",
        "role": "Organising chairperson",
        "detail": "Professor, Department of Audiology and<br>Speech Language Pathology, Yenepoya University",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "name": "Ms. Swathi Chinnasamy",
        "role": "Organising secretary",
        "detail": "Assistant Professor, Department of Audiology and<br>Speech Language Pathology, Yenepoya University",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "name": "Ms. Rachana R Uchil",
        "role": "Organising secretary",
        "detail": "Clinical Supervisor, Department of Audiology and<br>Speech Language Pathology, Yenepoya University",
        "photo": PUBLIC / "department" / "rachana-uchil.jpg",
    },
]

# Speakers shown as pictures in this order (not session order):
# Dr. S P Goswami, Dr. Shwetha Prabhu, Ms. Vasudha K G, Ms. Swathi Chinnasamy.
SPEAKER_ORDER = [3, 0, 2, 1]

SUBTITLE = 'Disability Assessment, <em>Certification</em> and Entitlements under the RPwD Act, 2016'

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


def photo(build: Path, path: Path) -> str:
    name = f"p-{path.stem}.jpg"
    target = build / name
    if not target.exists():
        crop_square(path).save(target, "JPEG", quality=92)
    return name


COLOURS = ["c1", "c2", "c3", "c4"]


def face(build: Path, path: Path, colour: str) -> str:
    return f"""<div class="face {colour}"><div class="ring"><img src="{photo(build, path)}" alt=""></div></div>"""


def logo_strip() -> str:
    return f"""
    <div class="logo-strip">
      <img src="{(BRAND / 'yenepoya-medical-college.png').as_uri()}" alt="">
      <p>Department of Audiology and Speech Language Pathology
        <small>Yenepoya Medical College Hospital · Yenepoya (Deemed to be University), Mangaluru</small></p>
      <img class="council" src="{(BRAND / 'rci.png').as_uri()}" alt="">
    </div>"""


def date_tab(rci: bool = False, hybrid: bool = False) -> str:
    last = "Approved by RCI · 4 hours" if rci else "Zonal CRE · English"
    where = "Offline + Online (Webex)" if hybrid else "Online · Cisco Webex"
    return f"""
    <div class="datetab">
      <div class="block"><b>19</b><span>DEC</span></div>
      <div class="dinfo">
        <p class="day">Saturday · 2026</p>
        <p><i></i>10:00 AM IST onwards</p>
        <p><i></i>{where}</p>
        <p><i></i>{last}</p>
      </div>
    </div>"""


RCI_FILE = "CRE-26111620026773/2026-RCI"
RCI_PORTAL = "rciregistration.nic.in"


def rci_strip() -> str:
    return f"""
    <div class="rci-strip">
      <img src="{(BRAND / 'rci.png').as_uri()}" alt="">
      <p><b>Approved by RCI</b> · Letter F. No. {RCI_FILE} · Zonal · 4 hours · Institute KK048
        <span>Claiming CRE points? Also register on <b>{RCI_PORTAL}</b> → CRE Calendar → 19 Dec 2026, with your CRR login.</span></p>
    </div>"""


def footer(page: str = "") -> str:
    page_line = f'<span class="pg">{page}</span>' if page else ""
    return f"""
    <footer class="foot">
      <div class="org">
        <strong>Department of Audiology and Speech Language Pathology</strong>
        <span>Yenepoya Medical College Hospital, Deralakatte, Mangaluru<br>Yenepoya (Deemed to be University)</span>
      </div>
      <div class="cta">
        <div>
          <span class="label">For details</span>
          <b>{EMAIL}</b>
          <small>{PHONE}</small>
          {page_line}
        </div>
      </div>
    </footer>"""


def poster(build: Path) -> str:
    speakers = "".join(
        f"""<div>{face(build, TALKS[i]['photo'], COLOURS[i])}<h3>{esc(TALKS[i]['person'])}</h3><p>{esc(TALKS[i]['role'])}</p></div>"""
        for i in SPEAKER_ORDER
    )
    rows = "".join(
        f"""<div class="ribbon {COLOURS[i]}"><div class="tab"><b>{t['time']}</b><span>{t['meridiem']}</span></div>
        <div class="card"><h3>{esc(t['title'])}</h3><p>{esc(t['person'])}</p></div></div>"""
        for i, t in enumerate(TALKS)
    )
    return f"""
    <section class="sheet poster">
      <div class="hero">
        {logo_strip()}
        <div class="hero-top">
          <p class="eyebrow">Zonal CRE Programme · Online</p>
          <h1 class="headline display">
            <span class="lead">Beyond <span class="script">the</span></span>
            <span class="big">Diagnosis</span>
          </h1>
        </div>
        <div class="hero-grid">
          <div>
            <p class="sub">{SUBTITLE}</p>
          </div>
          {date_tab(rci=True)}
        </div>
      </div>
      <div class="speakers">
        <p class="section-title">Resource <em>speakers</em></p>
        <div class="speaker-row">{speakers}</div>
      </div>
      <div class="schedule">
        <p class="section-title">Programme <em>schedule</em></p>
        <div class="ribbons">{rows}</div>
      </div>
      {rci_strip()}
      <div class="organisers">
        <span class="pill pill-dark">Organising chairperson</span><b>Dr. Shwetha Prabhu</b>
        <span class="pill pill-dark">Organising secretaries</span><b>Ms. Swathi Chinnasamy<br>Ms. Rachana R Uchil</b>
      </div>
      {footer()}
    </section>"""


def flyer_cover(build: Path) -> str:
    sessions = "".join(
        f"""<article class="session {COLOURS[i]}">
          <div class="tab"><b>{t['time']}</b><span>{t['meridiem']}</span><small>Session {i + 1}</small></div>
          {face(build, t['photo'], COLOURS[i])}
          <div class="text">
            <h3>{esc(t['title'])}</h3>
            <p class="by"><b>{esc(t['person'])}</b><br>{esc(', '.join(x for x in (t['role'], t['crr']) if x))}</p>
          </div>
        </article>"""
        for i, t in enumerate(TALKS)
    )
    return f"""
    <section class="sheet flyer">
      <div class="hero">
        {logo_strip()}
        <div class="hero-row">
          <div>
            <p class="eyebrow">Zonal CRE Programme</p>
            <h1 class="headline display">
              <span class="lead">Beyond <span class="script">the</span></span>
              <span class="big">Diagnosis</span>
            </h1>
            <p class="sub">{SUBTITLE}</p>
            <div class="facts"><span class="hot">Approved by RCI · 4 hours</span><span>Four sessions</span><span>Online · English</span></div>
          </div>
          <div class="mini-date">{date_tab()}</div>
        </div>
      </div>
      <div class="body">
        <p class="section-title">The <em>programme</em></p>
        <div class="sessions">{sessions}</div>
        {rci_strip()}
      </div>
      {footer("Page 1 of 2")}
    </section>"""


def flyer_team(build: Path) -> str:
    team = "".join(
        f"""<div>{face(build, p['photo'], COLOURS[i])}<span class="pill pill-solid">{esc(p['role'])}</span>
        <h3>{esc(p['name'])}</h3><span>{p['detail']}</span></div>"""
        for i, p in enumerate(TEAM)
    )
    tags = "".join(f"<span>{esc(a)}</span>" for a in AUDIENCE)
    return f"""
    <section class="sheet flyer team">
      <div class="hero">
        {logo_strip()}
        <div class="team-title">
          <p class="eyebrow">Beyond the Diagnosis · 19 December 2026</p>
          <h2>Organising <em>team</em></h2>
        </div>
        <div class="team-row">{team}</div>
      </div>
      <div class="body">
        <div class="info-grid">
          <div class="info c2"><h4>Who should attend</h4><div class="in"><div class="tags">{tags}</div></div></div>
          <div class="info c1"><h4>Registration</h4><div class="in">
            <p class="big">Open now</p>
            <p>Pay ₹354 on Razorpay, then register at <b style="white-space:nowrap">yenepoya-cre.vercel.app</b> with your CRR number and receipt. CRE points: 50 places, first registered, first served — and also register on <b style="white-space:nowrap">rciregistration.nic.in</b>.</p>
          </div></div>
          <div class="info c4"><h4>Contact</h4><div class="in"><div class="lines">
            <div><small>Email</small>yenepoyaaslpconference@gmail.com</div>
            <div><small>Phone</small>+91 73377 98055</div>
            <div><small>Department</small>aslp@yenepoya.edu.in</div>
          </div></div></div>
          <div class="info c3"><h4>Venue</h4><div class="in">
            <p class="big">Online on<br>Cisco Webex</p>
            <p>The joining link will be shared with registered participants.</p>
          </div></div>
        </div>
        <div class="refs">
          <img src="{(BRAND / 'rci.png').as_uri()}" alt="">
          <p><b>Approved by the Rehabilitation Council of India</b> · Letter F. No. CRE-26111620026773/2026-RCI · zonal · 4 hours<br>
            <span>Institute code KK048 · Listed on the RCI CRE calendar (rciregistration.nic.in) for 19 December 2026</span></p>
          <img src="{(BRAND / 'swavlamban.png').as_uri()}" alt="">
        </div>
      </div>
      {footer("Page 2 of 2")}
    </section>"""


SITE = "yenepoya-cre.vercel.app"
ONLINE_PATH = "/online"
ONLINE_URL = f"https://{SITE}{ONLINE_PATH}"
ONLINE_CLOSES = "10 December 2026"
ONLINE_SEATS = 100
ONLINE_AUDIENCE = [
    "ASLP students & interns",
    "Professionals not on RCI",
    "Doctors & allied health",
    "Psychologists & special educators",
    "Therapists",
    "Parents & caregivers",
]


def qr_png(build: Path, url: str) -> str:
    """A QR code for the registration link, drawn with the site's own qrcode package."""
    target = build / "qr-online.png"
    script = (
        "require('qrcode').toFile(process.argv[1], process.argv[2],"
        " {margin: 1, width: 720, errorCorrectionLevel: 'M', color: {dark: '#0b1f3aff', light: '#ffffffff'}})"
        ".catch(e => { console.error(e); process.exit(1); })"
    )
    subprocess.run(["node", "-e", script, str(target), url], cwd=ROOT, check=True)
    return target.name


def register_strip(build: Path) -> str:
    return f"""
    <div class="reg-strip">
      <a href="{ONLINE_URL}"><img class="qr" src="{qr_png(build, ONLINE_URL)}" alt=""></a>
      <div>
        <p class="kicker">Participant registration · {ONLINE_SEATS} seats · last date {ONLINE_CLOSES}</p>
        <p class="link"><a href="{ONLINE_URL}" style="color:inherit;text-decoration:none">{SITE}<b>{ONLINE_PATH}</b></a></p>
        <p class="note">Scan the code or type the link · Pay ₹354 on Razorpay, choose offline or online, then register with the payment ID
          and receipt · <b>Offline hands-on: Yenepoya colleges only.</b> <b>No RCI CRE points.</b></p>
      </div>
    </div>"""


def online_cover(build: Path) -> str:
    sessions = "".join(
        f"""<article class="session {COLOURS[i]}">
          <div class="tab"><b>{t['time']}</b><span>{t['meridiem']}</span><small>Session {i + 1}</small></div>
          {face(build, t['photo'], COLOURS[i])}
          <div class="text">
            <h3>{esc(t['title'])}</h3>
            <p class="by"><b>{esc(t['person'])}</b><br>{esc(t['role'])}</p>
          </div>
        </article>"""
        for i, t in enumerate(TALKS)
    )
    return f"""
    <section class="sheet flyer online">
      <div class="badge-nonrci">PARTICIPANT REGISTRATION</div>
      <div class="hero">
        {logo_strip()}
        <div class="hero-row">
          <div>
            <p class="eyebrow">Offline hands-on &amp; Online</p>
            <h1 class="headline display">
              <span class="lead">Beyond <span class="script">the</span></span>
              <span class="big">Diagnosis</span>
            </h1>
            <p class="sub">{SUBTITLE}</p>
            <div class="facts"><span class="hot">Offline hands-on · Yenepoya colleges</span><span>Online · open to all</span><span>{ONLINE_SEATS} seats</span></div>
          </div>
          <div class="mini-date">{date_tab(hybrid=True)}</div>
        </div>
      </div>
      <div class="body">
        <p class="section-title">The <em>programme</em></p>
        <div class="sessions">{sessions}</div>
        {register_strip(build)}
      </div>
      {footer("Page 1 of 2")}
    </section>"""


def online_details(build: Path) -> str:
    team = "".join(
        f"""<div>{face(build, p['photo'], COLOURS[i])}<span class="pill pill-solid">{esc(p['role'])}</span>
        <h3>{esc(p['name'])}</h3><span>{p['detail']}</span></div>"""
        for i, p in enumerate(TEAM)
    )
    tags = "".join(f"<span>{esc(a)}</span>" for a in ONLINE_AUDIENCE)
    return f"""
    <section class="sheet flyer team online">
      <div class="badge-nonrci">PARTICIPANT REGISTRATION</div>
      <div class="hero">
        {logo_strip()}
        <div class="team-title">
          <p class="eyebrow">Participant Registration · 19 December 2026</p>
          <h2>Organising <em>team</em></h2>
        </div>
        <div class="team-row">{team}</div>
      </div>
      <div class="body">
        <div class="info-grid">
          <div class="info c2"><h4>Who can join</h4><div class="in">
            <p class="small-note" style="margin:0 0 10px">RCI CRE places are full — others can still take part. <b>Offline hands-on:</b> Yenepoya colleges only. <b>Online:</b> open to all.</p>
            <div class="tags">{tags}</div>
            <p class="small-note"><b>{ONLINE_SEATS} seats</b> in all (offline + online), first come, first served.</p></div></div>
          <div class="info c1"><h4>How to register</h4><div class="in"><ol>
            <li><b>1</b><span>Pay <strong>₹354</strong> on Razorpay (link on the registration page).</span></li>
            <li><b>2</b><span>Open <a href="{ONLINE_URL}" style="color:inherit"><strong style="white-space:nowrap">{SITE}{ONLINE_PATH}</strong></a>, choose <strong>offline</strong> or <strong>online</strong>, and fill the form with your payment ID and receipt.</span></li>
            <li><b>3</b><span>Register by <strong>{ONLINE_CLOSES}</strong> and keep your YDU- reference.</span></li>
          </ol></div></div>
          <div class="info c4"><h4>Contact</h4><div class="in"><div class="lines">
            <div><small>Email</small>{EMAIL}</div>
            <div><small>Phone</small>{PHONE}</div>
            <div><small>Department</small>aslp@yenepoya.edu.in</div>
          </div></div></div>
          <div class="info c3"><h4>Certificate &amp; venue</h4><div class="in">
            <p class="big">Offline at Yenepoya<br>+ Online on Webex</p>
            <p>Offline: Dept. of ASLP, Yenepoya Medical College, Deralakatte. E-certificate of participation. <b>No RCI CRE points.</b></p>
          </div></div>
        </div>
        {register_strip(build)}
      </div>
      {footer("Page 2 of 2")}
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

        builders = {
            "poster": ("block-the-date", lambda: [poster(work)]),
            "flyer": ("beyond-the-diagnosis", lambda: [flyer_cover(work), flyer_team(work)]),
            "online": ("online-programme", lambda: [online_cover(work), online_details(work)]),
        }
        wanted = sys.argv[1:] or list(builders)
        jobs = {builders[key][0]: builders[key][1]() for key in wanted}

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

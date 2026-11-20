"""Build the editable two-page flyer as PowerPoint."""

from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
PUBLIC = ROOT / "public"
OUT = Path("/opt/cursor/artifacts")
THUMBS = Path("/tmp/flyer-portraits")

NAVY = RGBColor(0x0C, 0x23, 0x40)
DEEP = RGBColor(0x07, 0x15, 0x26)
ORANGE = RGBColor(0xC2, 0x41, 0x0C)
FLARE = RGBColor(0xFF, 0x7A, 0x1A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x11, 0x18, 0x27)
MUTED = RGBColor(0x4B, 0x55, 0x63)
PAPER = RGBColor(0xF4, 0xF6, 0xF8)

SESSIONS = [
    {
        "time": "10:00 AM",
        "title": "The RPwD Act, 2016: Rights, Responsibilities and Reach – An Overview",
        "person": "Dr. Shwetha Prabhu",
        "meta": "CRR A18456  ·  Organising chairperson",
        "topic": "The rights the Act names, the duties it places on institutions, and how far those duties reach into rehabilitation practice.",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "time": "11:00 AM",
        "title": "Know the 21: Types of Disabilities Recognised under the RPwD Act, 2016",
        "person": "Ms. Swathi Chinnasamy",
        "meta": "CRR A81760  ·  Organising secretary",
        "topic": "The specified disabilities a certificate can name, so assessment follows the schedule of the Act.",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "time": "12:00 PM",
        "title": "Learning, Intellectual and Autism Spectrum Disabilities: Rights and Entitlements under the RPwD Act, 2016 – A Psychologist’s Perspective",
        "person": "Ms. Vasudha K G",
        "meta": "CRR A85535  ·  Clinical psychologist, KMC Mangaluru (MAHE)",
        "topic": "Learning disability, intellectual disability, and autism spectrum disorder: certification, rights, and entitlements.",
        "photo": PUBLIC / "faculty" / "vasudha-kg.jpg",
    },
    {
        "time": "01:00 PM",
        "title": "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
        "person": "Dr. Satyapal Puri Goswami",
        "meta": "CRR A00260",
        "topic": "Communication disorders, and the legal and legislative work audiologists and speech-language pathologists are asked to do.",
        "photo": PUBLIC / "faculty" / "satyapal-goswami.jpg",
    },
]

TEAM = [
    {
        "name": "Dr. Shwetha Prabhu",
        "role": "Organising chairperson",
        "detail": "Associate Professor and Head of the Department",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "name": "Ms. Swathi Chinnasamy",
        "role": "Organising secretary",
        "detail": "Resource person  ·  CRR A81760",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "name": "Ms. Rachana R Uchil",
        "role": "Organising secretary",
        "detail": "Clinical Supervisor",
        "photo": PUBLIC / "department" / "rachana-uchil.jpg",
    },
]


def portrait(src: Path, dest: Path) -> None:
    image = Image.open(src).convert("RGB")
    width, height = image.size
    pixels = image.load()
    min_x, min_y, max_x, max_y = width, height, 0, 0
    for y in range(height):
        for x in range(0, width, 2):
            red, green, blue = pixels[x, y]
            if red < 245 or green < 245 or blue < 245:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x > min_x and max_y > min_y:
        image = image.crop((min_x, min_y, min(width, max_x + 2), min(height, max_y + 2)))
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = max(0, int((height - side) * 0.08))
    top = min(top, height - side)
    image = image.crop((left, top, left + side, top + side)).resize((640, 640), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, quality=90)


def fill(shape, color: RGBColor) -> None:
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def rect(slide, left, top, width, height, color: RGBColor):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    fill(shape, color)
    return shape


def text(slide, left, top, width, height, content, size, color, bold=False, font="Calibri", align="left"):
    shape = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    frame = shape.text_frame
    frame.word_wrap = True
    frame.margin_left = Emu(0)
    frame.margin_right = Emu(0)
    frame.margin_top = Emu(0)
    frame.margin_bottom = Emu(0)
    alignment = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER}[align]
    for index, line in enumerate(content.split("\n")):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.alignment = alignment
        run = paragraph.add_run()
        run.text = line
        run.font.name = font
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
    return shape


def header(slide, page: str) -> None:
    rect(slide, 0, 0, 8.27, 1.08, NAVY)
    slide.shapes.add_picture(str(BRAND / "yenepoya-medical-college.png"), Inches(0.18), Inches(0.14), height=Inches(0.8))
    text(slide, 1.95, 0.22, 4.85, 0.42, "Department of Audiology and Speech Language Pathology", 12, WHITE, True)
    text(slide, 1.95, 0.64, 4.85, 0.26, "Yenepoya (Deemed to be University), Mangaluru", 11, WHITE)
    slide.shapes.add_picture(str(BRAND / "rci.png"), Inches(7.22), Inches(0.1), height=Inches(0.86))
    rect(slide, 0, 1.08, 8.27, 0.06, FLARE)
    text(slide, 7.15, 11.42, 0.85, 0.2, page, 10, MUTED, align="center")


def build() -> Path:
    thumbs: dict[str, Path] = {}
    for item in [*SESSIONS, *TEAM]:
        key = str(item["photo"])
        if key not in thumbs:
            dest = THUMBS / f"{len(thumbs)}.jpg"
            portrait(item["photo"], dest)
            thumbs[key] = dest

    presentation = Presentation()
    presentation.slide_width = Inches(8.27)
    presentation.slide_height = Inches(11.69)
    presentation.core_properties.title = "Beyond the Diagnosis — two-page flyer"
    presentation.core_properties.subject = "Editable flyer. Every line is a text box."
    blank = presentation.slide_layouts[6]

    cover = presentation.slides.add_slide(blank)
    rect(cover, 0, 0, 8.27, 11.69, WHITE)
    header(cover, "1")
    text(cover, 0.32, 1.26, 7.6, 0.24, "ZONAL CRE   ·   ONLINE   ·   ENGLISH   ·   RCI CRE APPROVAL AWAITED", 11, ORANGE, True)
    text(cover, 0.3, 1.48, 7.6, 0.52, "Beyond the Diagnosis", 32, NAVY, True, font="Georgia")
    text(
        cover,
        0.32,
        2.02,
        7.5,
        0.52,
        "Disability Assessment, Certification and Entitlements under the RPwD Act, 2016",
        15,
        INK,
        font="Georgia",
    )
    rect(cover, 0.32, 2.6, 7.63, 0.72, PAPER)
    text(cover, 0.46, 2.68, 2.4, 0.24, "SATURDAY", 9, ORANGE, True)
    text(cover, 0.46, 2.88, 2.5, 0.32, "19 December 2026", 14, NAVY, True)
    text(cover, 3.05, 2.68, 2.3, 0.24, "FROM 10:00 IST", 9, ORANGE, True)
    text(cover, 3.05, 2.88, 2.4, 0.32, "Cisco Webex  ·  Online", 13, NAVY, True)
    text(cover, 5.55, 2.68, 2.2, 0.24, "INSTITUTE", 9, ORANGE, True)
    text(cover, 5.55, 2.88, 2.2, 0.32, "KK048  ·  Zonal", 14, NAVY, True)
    text(
        cover,
        0.32,
        3.42,
        7.6,
        0.48,
        "Once a diagnosis is made, what does the Act require of assessment, certification, and the entitlements a person can claim?",
        12,
        MUTED,
    )

    top = 3.95
    for session in SESSIONS:
        rect(cover, 0.32, top, 0.08, 1.55, ORANGE)
        cover.shapes.add_picture(str(thumbs[str(session["photo"])]), Inches(0.52), Inches(top), height=Inches(1.45))
        text(cover, 2.12, top, 5.8, 0.22, session["time"], 12, ORANGE, True)
        text(cover, 2.12, top + 0.22, 5.85, 0.58, session["title"], 12, NAVY, True)
        text(cover, 2.12, top + 0.82, 5.85, 0.22, session["person"], 12, INK, True)
        text(cover, 2.12, top + 1.04, 5.85, 0.2, session["meta"], 10, MUTED)
        text(cover, 2.12, top + 1.24, 5.85, 0.32, session["topic"], 10, MUTED)
        top += 1.72

    rect(cover, 0, 11.22, 8.27, 0.47, NAVY)
    text(cover, 0.32, 11.32, 6.4, 0.26, "yenepoya-cre.vercel.app", 13, WHITE, True)

    team = presentation.slides.add_slide(blank)
    rect(team, 0, 0, 8.27, 11.69, WHITE)
    header(team, "2")
    text(team, 0.32, 1.26, 7.6, 0.36, "Organising team", 26, NAVY, True, font="Georgia")
    text(
        team,
        0.32,
        1.68,
        7.6,
        0.36,
        "RCI CRE approval awaited  ·  Yenepoya Medical College, Mangaluru.",
        12,
        MUTED,
    )

    for index, person in enumerate(TEAM):
        left = 0.32 + index * 2.6
        team.shapes.add_picture(str(thumbs[str(person["photo"])]), Inches(left + 0.35), Inches(2.15), height=Inches(1.7))
        text(team, left, 3.95, 2.45, 0.22, person["role"].upper(), 10, ORANGE, True, align="center")
        text(team, left, 4.18, 2.45, 0.48, person["name"], 14, NAVY, True, align="center")
        text(team, left, 4.66, 2.45, 0.5, person["detail"], 11, MUTED, align="center")

    rect(team, 0.32, 5.35, 7.63, 0.02, PAPER)
    text(team, 0.32, 5.5, 3.6, 0.24, "WHO IT IS FOR", 11, ORANGE, True)
    text(
        team,
        0.32,
        5.76,
        3.7,
        1.15,
        "Audiologists\nSpeech-language pathologists\nClinical psychologists\nOther rehabilitation professionals",
        13,
        INK,
    )
    text(team, 4.2, 5.5, 3.7, 0.24, "HOW TO JOIN", 11, ORANGE, True)
    text(
        team,
        4.2,
        5.76,
        3.75,
        1.2,
        "Register on yenepoya-cre.vercel.app.\nPay on Razorpay.\nAdd the payment id or the receipt screenshot on the same form.",
        13,
        INK,
    )
    text(team, 0.32, 7.1, 3.6, 0.24, "DESK", 11, ORANGE, True)
    text(
        team,
        0.32,
        7.36,
        3.7,
        1.15,
        "yenepoyaaslpconference@gmail.com\n7337798055\naslp@yenepoya.edu.in",
        13,
        INK,
    )
    text(team, 4.2, 7.1, 3.7, 0.24, "PLACE", 11, ORANGE, True)
    text(
        team,
        4.2,
        7.36,
        3.75,
        1.35,
        "The CRE day is online, on Cisco Webex.\nYenepoya Medical College Hospital, University Road, Deralakatte, Mangaluru 575018, is the hospital for anyone coming in person.",
        13,
        INK,
    )
    text(team, 0.32, 8.85, 7.6, 0.7, "The department began in 2009, became independent in 2020, and is accredited by the Rehabilitation Council of India. It teaches the Bachelor of Audiology and Speech-Language Pathology.", 12, MUTED)

    rect(team, 0, 9.7, 8.27, 1.52, DEEP)
    team.shapes.add_picture(str(BRAND / "india-emblem.png"), Inches(0.55), Inches(9.9), height=Inches(0.85))
    text(team, 1.5, 10.05, 3.3, 0.28, "GOVERNMENT OF INDIA", 12, WHITE, True, align="center")
    text(team, 1.5, 10.34, 3.3, 0.24, "Unique Disability ID  ·  Swavlamban", 11, WHITE, align="center")
    team.shapes.add_picture(str(BRAND / "swavlamban.png"), Inches(5.05), Inches(9.88), height=Inches(0.9))
    team.shapes.add_picture(str(BRAND / "rci.png"), Inches(6.55), Inches(9.82), height=Inches(1.0))
    rect(team, 0, 11.22, 8.27, 0.47, NAVY)
    text(team, 0.32, 11.32, 7.4, 0.26, "CRE-26111620026773   ·   Institute KK048   ·   yenepoya-cre.vercel.app", 12, WHITE, True)

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "beyond-the-diagnosis.pptx"
    presentation.save(path)
    return path


if __name__ == "__main__":
    print(build())

"""Build the editable two-page flyer as PowerPoint."""

from pathlib import Path

from PIL import Image, ImageDraw
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
LINE = RGBColor(0xE5, 0xE7, 0xEB)

DEPARTMENT = "Department of Audiology and Speech Language Pathology"
HOSPITAL = "Yenepoya Medical College Hospital"
UNIVERSITY = "Yenepoya (Deemed to be University)"

SESSIONS = [
    {
        "time": "10:00 AM",
        "title": "The RPwD Act, 2016: Rights, Responsibilities and Reach – An Overview",
        "person": "Dr. Shwetha Prabhu",
        "designation": "Associate Professor and Head of the Department",
        "crr": "CRR A18456",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "time": "11:00 AM",
        "title": "Know the 21: Types of Disabilities Recognised under the RPwD Act, 2016",
        "person": "Ms. Swathi Chinnasamy",
        "designation": "Assistant Professor",
        "crr": "CRR A81760",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "time": "12:00 PM",
        "title": "Learning, Intellectual and Autism Spectrum Disabilities: Rights and Entitlements under the RPwD Act, 2016 – A Psychologist’s Perspective",
        "person": "Ms. Vasudha K G",
        "designation": "Assistant Professor, Department of Psychiatry, KMC Mangaluru (MAHE)",
        "crr": "CRR A85535",
        "photo": PUBLIC / "faculty" / "vasudha-kg.jpg",
    },
    {
        "time": "01:00 PM",
        "title": "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
        "person": "Dr. Satyapal Puri Goswami",
        "designation": "",
        "crr": "CRR A00260",
        "photo": PUBLIC / "faculty" / "satyapal-goswami.jpg",
    },
]

TEAM = [
    {
        "name": "Dr. Shwetha Prabhu",
        "role": "Organising chairperson",
        "detail": "Associate Professor and Head of the Department\nCRR A18456",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "name": "Ms. Swathi Chinnasamy",
        "role": "Organising secretary",
        "detail": "Assistant Professor\nCRR A81760",
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
    for y in range(0, height, 2):
        for x in range(0, width, 2):
            red, green, blue = pixels[x, y]
            if red < 245 or green < 245 or blue < 245:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x > min_x and max_y > min_y:
        image = image.crop((max(0, min_x - 2), max(0, min_y - 2), min(width, max_x + 4), min(height, max_y + 4)))
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = max(0, int((height - side) * 0.06))
    top = min(top, height - side)
    image = image.crop((left, top, left + side, top + side)).resize((560, 560), Image.Resampling.LANCZOS).convert("RGBA")
    size = 600
    ring = 16
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((0, 0, size - 1, size - 1), fill=(194, 65, 12, 255))
    mask = Image.new("L", (560, 560), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 559, 559), fill=255)
    image.putalpha(mask)
    canvas.paste(image, (ring, ring), image)
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest)


def fill(shape, color: RGBColor, line: RGBColor | None = None) -> None:
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1)


def rect(slide, left, top, width, height, color: RGBColor):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    fill(shape, color)
    return shape


def rrect(slide, left, top, width, height, color: RGBColor, radius: float = 0.15, line: RGBColor | None = None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    fill(shape, color, line)
    shape.adjustments[0] = radius
    return shape


def text(slide, left, top, width, height, content, size, color, bold=False, font="Calibri", align="left"):
    shape = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    frame = shape.text_frame
    frame.word_wrap = True
    frame.margin_left = Emu(0)
    frame.margin_right = Emu(0)
    frame.margin_top = Emu(0)
    frame.margin_bottom = Emu(0)
    alignment = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER, "right": PP_ALIGN.RIGHT}[align]
    for index, line in enumerate(content.split("\n")):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.alignment = alignment
        paragraph.space_before = Pt(0)
        paragraph.space_after = Pt(0)
        run = paragraph.add_run()
        run.text = line
        run.font.name = font
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
    return shape


def lines_for(content: str, size: int, width: float) -> int:
    per_line = max(16, int(width / (size * 0.48 / 72)))
    count = 0
    for line in content.split("\n"):
        count += max(1, -(-len(line) // per_line))
    return count


def masthead(slide) -> float:
    rect(slide, 0, 0, 8.27, 1.38, NAVY)
    rrect(slide, 0.18, 0.16, 1.62, 1.06, WHITE, 0.12)
    slide.shapes.add_picture(str(BRAND / "yenepoya-medical-college.png"), Inches(0.26), Inches(0.28), height=Inches(0.82))
    text(slide, 1.96, 0.24, 5.05, 0.42, DEPARTMENT, 12, WHITE, True)
    text(slide, 1.96, 0.66, 5.05, 0.26, HOSPITAL, 12, WHITE)
    text(slide, 1.96, 0.94, 5.05, 0.24, UNIVERSITY, 11, RGBColor(0xD6, 0xDE, 0xE8))
    rrect(slide, 7.18, 0.18, 0.9, 1.02, WHITE, 0.12)
    slide.shapes.add_picture(str(BRAND / "rci.png"), Inches(7.26), Inches(0.26), height=Inches(0.86))
    rect(slide, 0, 1.38, 8.27, 0.045, FLARE)
    return 1.5


def build() -> Path:
    thumbs: dict[str, Path] = {}
    for item in [*SESSIONS, *TEAM]:
        key = str(item["photo"])
        if key not in thumbs:
            dest = THUMBS / f"{len(thumbs)}.png"
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
    masthead(cover)
    rect(cover, 0, 1.425, 8.27, 2.4, NAVY)
    text(cover, 0.36, 1.54, 7.5, 0.22, "ZONAL CRE    ·    ONLINE    ·    ENGLISH", 12, FLARE, True)
    text(cover, 0.32, 1.76, 7.6, 0.58, "Beyond the Diagnosis", 34, WHITE, True, font="Georgia")
    text(
        cover,
        0.36,
        2.38,
        7.5,
        0.5,
        "Disability Assessment, Certification and Entitlements under the RPwD Act, 2016",
        14,
        WHITE,
        font="Georgia",
    )
    rrect(cover, 0.36, 2.96, 2.85, 0.32, ORANGE, 0.5)
    text(cover, 0.36, 3.01, 2.85, 0.22, "RCI CRE APPROVAL AWAITED", 10, WHITE, True, align="center")
    text(cover, 3.4, 3.0, 4.5, 0.24, "Saturday, 19 December 2026", 13, WHITE, True)
    text(cover, 0.36, 3.4, 2.4, 0.16, "FROM 10:00 IST", 9, FLARE, True)
    text(cover, 0.36, 3.56, 2.4, 0.2, "Cisco Webex", 12, WHITE, True)
    text(cover, 2.9, 3.4, 2.4, 0.16, "ONLINE", 9, FLARE, True)
    text(cover, 2.9, 3.56, 2.4, 0.2, "English  ·  Zonal", 12, WHITE, True)
    text(cover, 5.44, 3.4, 2.4, 0.16, "INSTITUTE", 9, FLARE, True)
    text(cover, 5.44, 3.56, 2.4, 0.2, "KK048", 12, WHITE, True)

    top = 3.86
    for session in SESSIONS:
        title_lines = lines_for(session["title"], 13, 5.35)
        designation = session["designation"]
        designation_lines = lines_for(designation, 12, 6.3) if designation else 0
        height = 0.16 + 0.22 + title_lines * 0.24 + 0.24 + designation_lines * 0.2 + 0.22 + 0.12
        height = max(1.28, height)
        rrect(cover, 0.28, top, 7.71, height, PAPER, 0.08, LINE)
        photo = min(1.12, height - 0.2)
        cover.shapes.add_picture(str(thumbs[str(session["photo"])]), Inches(0.42), Inches(top + (height - photo) / 2), height=Inches(photo))
        cursor = top + 0.1
        text(cover, 1.78, cursor, 5.9, 0.2, session["time"], 12, ORANGE, True)
        cursor += 0.22
        text(cover, 1.78, cursor, 5.9, title_lines * 0.24, session["title"], 13, NAVY, True)
        cursor += title_lines * 0.24 + 0.04
        text(cover, 1.78, cursor, 5.9, 0.22, session["person"], 13, INK, True)
        cursor += 0.24
        if designation:
            text(cover, 1.78, cursor, 5.9, designation_lines * 0.2, designation, 12, MUTED)
            cursor += designation_lines * 0.2
        text(cover, 1.78, cursor, 5.9, 0.2, session["crr"], 12, MUTED)
        top += height + 0.1

    rect(cover, 0, 11.22, 8.27, 0.47, NAVY)
    text(cover, 0.32, 11.34, 6.2, 0.24, "yenepoya-cre.vercel.app", 13, WHITE, True)
    text(cover, 6.4, 11.34, 1.55, 0.24, "1  /  2", 12, FLARE, True, align="right")

    team = presentation.slides.add_slide(blank)
    rect(team, 0, 0, 8.27, 11.69, WHITE)
    masthead(team)
    text(team, 0.32, 1.68, 4.6, 0.48, "Organising team", 28, NAVY, True, font="Georgia")
    rrect(team, 5.15, 1.76, 2.8, 0.32, ORANGE, 0.5)
    text(team, 5.15, 1.81, 2.8, 0.24, "RCI CRE APPROVAL AWAITED", 9, WHITE, True, align="center")

    for index, person in enumerate(TEAM):
        left = 0.36 + index * 2.62
        team.shapes.add_picture(str(thumbs[str(person["photo"])]), Inches(left + 0.42), Inches(2.28), height=Inches(1.62))
        text(team, left, 4.02, 2.5, 0.22, person["role"].upper(), 11, ORANGE, True, align="center")
        text(team, left, 4.26, 2.5, 0.46, person["name"], 15, NAVY, True, align="center")
        text(team, left, 4.74, 2.5, 0.62, person["detail"], 12, MUTED, align="center")

    cards = [
        ("WHO IT IS FOR", "Audiologists\nSpeech-language pathologists\nSpecial educators and occupational therapists\nAnd others"),
        ("HOW TO JOIN", "Register on yenepoya-cre.vercel.app.\nPay on Razorpay.\nThen add the payment id or the receipt screenshot."),
        ("DESK", "yenepoyaaslpconference@gmail.com\n7337798055\naslp@yenepoya.edu.in"),
        ("PLACE", "The CRE day is online, on Cisco Webex."),
    ]
    for index, (label, body) in enumerate(cards):
        column = index % 2
        row = index // 2
        left = 0.28 + column * 3.95
        card_top = 5.5 + row * 1.7
        rrect(team, left, card_top, 3.78, 1.58, PAPER, 0.1, LINE)
        text(team, left + 0.18, card_top + 0.14, 3.42, 0.24, label, 12, ORANGE, True)
        text(team, left + 0.18, card_top + 0.42, 3.42, 1.05, body, 13, INK)

    rect(team, 0, 9.06, 8.27, 2.16, DEEP)
    team.shapes.add_picture(str(BRAND / "india-emblem.png"), Inches(0.42), Inches(9.62), height=Inches(0.82))
    text(team, 1.25, 9.78, 3.5, 0.26, "GOVERNMENT OF INDIA", 13, WHITE, True)
    text(team, 1.25, 10.08, 3.5, 0.24, "Unique Disability ID  ·  Swavlamban", 12, WHITE)
    team.shapes.add_picture(str(BRAND / "swavlamban.png"), Inches(5.05), Inches(9.58), height=Inches(0.9))
    rrect(team, 6.15, 9.58, 1.7, 0.96, WHITE, 0.12)
    team.shapes.add_picture(str(BRAND / "rci.png"), Inches(6.4), Inches(9.66), height=Inches(0.8))
    rect(team, 0, 11.22, 8.27, 0.47, NAVY)
    text(team, 0.32, 11.34, 6.2, 0.24, "CRE-26111620026773   ·   Institute KK048", 12, WHITE, True)
    text(team, 6.4, 11.34, 1.55, 0.24, "2  /  2", 12, FLARE, True, align="right")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "beyond-the-diagnosis.pptx"
    presentation.save(path)
    return path


if __name__ == "__main__":
    print(build())

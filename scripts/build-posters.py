"""Poster-style flyers: a first share sheet, and the two-page programme flyer."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pptx import Presentation
from pptx.util import Emu

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
PUBLIC = ROOT / "public"
OUT = Path("/opt/cursor/artifacts")

SCALE = 2
NAVY = (12, 35, 64, 255)
ORANGE = (194, 65, 12, 255)
FLARE = (255, 122, 26, 255)
WHITE = (255, 255, 255, 255)
INK = (17, 24, 39, 255)
MUTED = (75, 85, 99, 255)
LINE = (229, 231, 235, 255)
SOFT = (214, 222, 232, 255)

SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/macos/Inter-Regular.ttf"
SANS_MED = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"
SANS_SEMI = "/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"

TALKS = [
    {
        "time": "10:00 AM",
        "title": "The RPwD Act, 2016: Rights, Responsibilities and Reach – An Overview",
        "person": "Dr. Shwetha Prabhu",
        "role": "Associate Professor and Head of the Department",
        "crr": "CRR A18456",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "time": "11:00 AM",
        "title": "Know the 21: Types of Disabilities Recognised under the RPwD Act, 2016",
        "person": "Ms. Swathi Chinnasamy",
        "role": "Assistant Professor",
        "crr": "CRR A81760",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "time": "12:00 PM",
        "title": "Learning, Intellectual and Autism Spectrum Disabilities: Rights and Entitlements under the RPwD Act, 2016 – A Psychologist’s Perspective",
        "person": "Ms. Vasudha K G",
        "role": "Assistant Professor, Department of Psychiatry, KMC Mangaluru (MAHE)",
        "crr": "CRR A85535",
        "photo": PUBLIC / "faculty" / "vasudha-kg.jpg",
    },
    {
        "time": "01:00 PM",
        "title": "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
        "person": "Dr. Satyapal Puri Goswami",
        "role": "",
        "crr": "CRR A00260",
        "photo": PUBLIC / "faculty" / "satyapal-goswami.jpg",
    },
]

TEAM = [
    {
        "name": "Dr. Shwetha Prabhu",
        "role": "Organising chairperson",
        "detail": "Associate Professor and\nHead of the Department",
        "crr": "CRR A18456",
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "name": "Ms. Swathi Chinnasamy",
        "role": "Organising secretary",
        "detail": "Assistant Professor",
        "crr": "CRR A81760",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "name": "Ms. Rachana R Uchil",
        "role": "Organising secretary",
        "detail": "Clinical Supervisor",
        "crr": "",
        "photo": PUBLIC / "department" / "rachana-uchil.jpg",
    },
]


def d(value: float) -> int:
    return int(value * SCALE)


def face(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, d(size))


def wrap(text: str, font: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split():
        trial = word if current == "" else f"{current} {word}"
        if font.getlength(trial) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def shadow(canvas: Image.Image, box: tuple[int, int, int, int], radius: int, blur: int = 14, alpha: int = 46) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    left, top, right, bottom = box
    ImageDraw.Draw(layer).rounded_rectangle((left, top + d(8), right, bottom + d(8)), radius=radius, fill=(12, 35, 64, alpha))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def crop_square(path: Path, size: int) -> Image.Image:
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


def circled(path: Path, size: int) -> Image.Image:
    photo = crop_square(path, size)
    ring = d(6)
    gap = d(4)
    outer = size + (ring + gap) * 2
    canvas = Image.new("RGBA", (outer, outer), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((0, 0, outer - 1, outer - 1), fill=ORANGE)
    draw.ellipse((ring, ring, outer - 1 - ring, outer - 1 - ring), fill=WHITE)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((1, 1, size - 2, size - 2), fill=255)
    framed = Image.new("RGBA", (size, size))
    framed.paste(photo, (0, 0))
    framed.putalpha(mask)
    canvas.alpha_composite(framed, (ring + gap, ring + gap))
    return canvas


def logo(path: Path, height: int) -> Image.Image:
    mark = Image.open(path).convert("RGBA")
    ratio = height / mark.height
    return mark.resize((max(1, int(mark.width * ratio)), height), Image.Resampling.LANCZOS)


def downscale(image: Image.Image) -> Image.Image:
    return image.resize((image.width // SCALE, image.height // SCALE), Image.Resampling.LANCZOS).convert("RGB")


def save_pptx(path: Path, pages: list[Image.Image]) -> None:
    presentation = Presentation()
    first = pages[0]
    presentation.slide_width = Emu(first.width * 914400 / 144)
    presentation.slide_height = Emu(first.height * 914400 / 144)
    presentation.core_properties.title = path.stem.replace("-", " ").title()
    for page in pages:
        slide = presentation.slides.add_slide(presentation.slide_layouts[6])
        holder = OUT / f".{path.stem}-{id(page)}.png"
        page.save(holder, "PNG")
        slide.shapes.add_picture(str(holder), 0, 0, width=presentation.slide_width, height=presentation.slide_height)
        holder.unlink()
    presentation.save(path)


def draw_logos(canvas: Image.Image, x: int, y: int) -> None:
    college = logo(BRAND / "yenepoya-medical-college.png", d(58))
    council = logo(BRAND / "rci.png", d(60))
    canvas.alpha_composite(college, (d(x), d(y)))
    canvas.alpha_composite(council, (d(x) + college.width + d(16), d(y - 1)))


def centered(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, y: int, fill: tuple[int, int, int, int], width: int = 1080) -> None:
    draw.text(((d(width) - font.getlength(text)) / 2, d(y)), text, font=font, fill=fill)


def first_flyer() -> Image.Image:
    width, height = 1080, 1680
    canvas = Image.new("RGBA", (d(width), d(height)), WHITE)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, d(width), d(12)), fill=ORANGE)

    college = logo(BRAND / "yenepoya-medical-college.png", d(72))
    canvas.alpha_composite(college, (d(36), d(28)))
    draw.line((d(196), d(36), d(196), d(96)), fill=LINE, width=d(2))
    dept = face(SANS_BOLD, 16)
    draw.text((d(216), d(40)), "DEPARTMENT OF AUDIOLOGY AND", font=dept, fill=NAVY)
    draw.text((d(216), d(64)), "SPEECH LANGUAGE PATHOLOGY", font=dept, fill=NAVY)

    council = logo(BRAND / "rci.png", d(168))
    canvas.alpha_composite(council, (d(540), d(200)))
    draw = ImageDraw.Draw(canvas)
    approval = face(SANS_BOLD, 13)
    for index, line in enumerate(["RCI CRE", "APPROVAL AWAITED"]):
        line_w = approval.getlength(line)
        draw.text((d(540) + (council.width - line_w) / 2, d(384 + index * 18)), line, font=approval, fill=ORANGE)

    kicker = face(SANS_BOLD, 15)
    kicker_lines = ["CONTINUING REHABILITATION", "EDUCATION (CRE) PROGRAMME"]
    kicker_w = max(kicker.getlength(line) for line in kicker_lines)
    pill = (d(36), d(124), d(36) + kicker_w + d(56), d(196))
    draw.rounded_rectangle(pill, radius=d(36), fill=ORANGE)
    for index, line in enumerate(kicker_lines):
        draw.text((d(64), d(136 + index * 24)), line, font=kicker, fill=WHITE)

    draw.text((d(36), d(220)), "BEYOND THE", font=face(SERIF, 64), fill=NAVY)
    diagnosis = face(SERIF, 68)
    word = "DIAGNOSIS"
    word_w = diagnosis.getlength(word)
    highlight = (d(28), d(292), d(28) + word_w + d(36), d(380))
    draw.rounded_rectangle(highlight, radius=d(12), fill=ORANGE)
    draw.text((d(46), d(300)), word, font=diagnosis, fill=WHITE)

    draw.rectangle((d(36), d(408), d(46), d(500)), fill=ORANGE)
    sub = face(SANS_SEMI, 20)
    draw.text((d(64), d(408)), "Disability Assessment, Certification", font=sub, fill=NAVY)
    draw.text((d(64), d(438)), "and Entitlements under the", font=sub, fill=NAVY)
    draw.text((d(64), d(468)), "RPwD Act, 2016", font=sub, fill=NAVY)

    draw.rounded_rectangle((d(28), d(528), d(1052), d(600)), radius=d(28), fill=NAVY)
    centered(draw, "19 DECEMBER 2026", face(SANS_BOLD, 28), 544, WHITE)

    draw.rounded_rectangle((d(28), d(616), d(1052), d(676)), radius=d(24), fill=(255, 241, 232, 255))
    centered(draw, "ONLINE  ·  CISCO WEBEX      ·      ZONAL      ·      ENGLISH      ·      FROM 10:00 IST", face(SANS_BOLD, 15), 634, NAVY)

    schedule = face(SANS_BOLD, 18)
    label = "PROGRAMME SCHEDULE"
    label_w = schedule.getlength(label)
    schedule_pill = ((d(width) - label_w) / 2 - d(28), d(700), (d(width) + label_w) / 2 + d(28), d(748))
    draw.rounded_rectangle(schedule_pill, radius=d(24), fill=NAVY)
    centered(draw, label, schedule, 712, WHITE)
    centered(draw, "RESOURCE SPEAKERS", face(SANS_BOLD, 13), 760, ORANGE)

    talk_lines = {
        "10:00 AM": ["The RPwD Act, 2016: Rights,", "Responsibilities and Reach – An Overview"],
        "11:00 AM": ["Know the 21: Types of Disabilities", "Recognised under the RPwD Act, 2016"],
        "12:00 PM": ["Learning, Intellectual and Autism Spectrum", "Disabilities: Rights and Entitlements under", "the RPwD Act, 2016 – A Psychologist’s", "Perspective"],
        "01:00 PM": ["Rights and Privileges of Persons with", "Communication Disorders: ASLPs to Deal", "with Legal and Legislative Aspects"],
    }
    topic_font = face(SANS_MED, 16)
    name_font = face(SANS_BOLD, 16)
    time_font = face(SANS_BOLD, 18)
    row_h = 132
    for index, talk in enumerate(TALKS):
        top = 792 + index * row_h
        fill = WHITE if index % 2 == 0 else (255, 247, 242, 255)
        draw.rounded_rectangle((d(28), d(top), d(1052), d(top + row_h - 10)), radius=d(16), fill=fill, outline=LINE, width=d(2))
        time_w = time_font.getlength(talk["time"])
        lines = talk_lines[talk["time"]]
        block = len(lines) * 22
        text_top = top + (row_h - 10 - block) / 2
        draw.text((d(48) + (d(150) - time_w) / 2, d(text_top + 8)), talk["time"], font=time_font, fill=ORANGE)
        for line_index, line in enumerate(lines):
            draw.text((d(220), d(text_top + line_index * 22)), line, font=topic_font, fill=INK)
        name_w = name_font.getlength(talk["person"])
        name_box = (d(760), d(top + 36), d(1028), d(top + row_h - 46))
        draw.rounded_rectangle(name_box, radius=d(16), fill=ORANGE)
        draw.text((d(760) + (d(268) - name_w) / 2, d(top + 52)), talk["person"], font=name_font, fill=WHITE)

    seats = (d(28), d(1340), d(430), d(1520))
    shadow(canvas, seats, d(24), alpha=28)
    draw.rounded_rectangle(seats, radius=d(24), fill=NAVY)
    draw.text((d(52), d(1372)), "LIMITED", font=face(SANS_BOLD, 28), fill=WHITE)
    draw.text((d(52), d(1410)), "NUMBER OF", font=face(SANS_BOLD, 28), fill=FLARE)
    draw.text((d(52), d(1448)), "SEATS", font=face(SANS_BOLD, 28), fill=WHITE)

    team = (d(454), d(1340), d(1052), d(1520))
    shadow(canvas, team, d(24), alpha=28)
    draw.rounded_rectangle(team, radius=d(24), fill=WHITE, outline=LINE, width=d(2))
    draw.rectangle((d(454), d(1364), d(464), d(1496)), fill=ORANGE)
    role = face(SANS_BOLD, 13)
    person = face(SANS_SEMI, 18)
    draw.text((d(488), d(1360)), "ORGANISING CHAIRPERSON", font=role, fill=ORANGE)
    draw.text((d(488), d(1382)), "Dr. Shwetha Prabhu", font=person, fill=NAVY)
    draw.text((d(488), d(1424)), "ORGANISING SECRETARY", font=role, fill=ORANGE)
    draw.text((d(488), d(1446)), "Ms. Swathi Chinnasamy", font=person, fill=NAVY)
    draw.text((d(488), d(1474)), "Ms. Rachana R Uchil", font=person, fill=NAVY)

    draw.text((d(36), d(1552)), "Department of Audiology and Speech Language Pathology", font=face(SANS_SEMI, 16), fill=NAVY)
    draw.text((d(36), d(1578)), "Yenepoya Medical College Hospital", font=face(SANS, 16), fill=INK)
    draw.text((d(36), d(1604)), "Yenepoya (Deemed to be University)   ·   yenepoya-cre.vercel.app", font=face(SANS, 16), fill=MUTED)
    return canvas


def programme_cover() -> Image.Image:
    width, height = 1080, 1528
    canvas = Image.new("RGBA", (d(width), d(height)), WHITE)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, d(width), d(12)), fill=ORANGE)
    draw_logos(canvas, 36, 28)
    draw.text((d(760), d(36)), "RCI CRE", font=face(SANS_BOLD, 12), fill=ORANGE)
    draw.text((d(760), d(54)), "APPROVAL AWAITED", font=face(SANS_BOLD, 12), fill=ORANGE)

    draw.text((d(36), d(118)), "BEYOND THE", font=face(SERIF, 48), fill=NAVY)
    draw.text((d(36), d(176)), "DIAGNOSIS", font=face(SERIF, 48), fill=ORANGE)
    draw.text((d(36), d(246)), "Disability assessment, certification and entitlements", font=face(SANS, 18), fill=MUTED)
    draw.text((d(36), d(272)), "under the RPwD Act, 2016.", font=face(SANS, 18), fill=MUTED)

    draw.rounded_rectangle((d(28), d(316), d(1052), d(386)), radius=d(16), fill=NAVY)
    bits = ["19 December 2026", "From 10:00 IST", "Online · Cisco Webex", "Zonal · English"]
    for index, bit in enumerate(bits):
        draw.text((d(52 + index * 250), d(340)), bit, font=face(SANS_BOLD, 16), fill=WHITE if index else FLARE)

    top = 418
    for talk in TALKS:
        box = (d(28), d(top), d(1052), d(top + 250))
        shadow(canvas, box, d(20), alpha=32)
        draw.rounded_rectangle(box, radius=d(20), fill=WHITE, outline=LINE, width=d(2))
        portrait = circled(talk["photo"], d(132))
        canvas.alpha_composite(portrait, (d(48), d(top + 36)))
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle((d(250), d(top + 28), d(390), d(top + 58)), radius=d(15), fill=ORANGE)
        draw.text((d(268), d(top + 34)), talk["time"], font=face(SANS_BOLD, 16), fill=WHITE)
        draw.text((d(250), d(top + 72)), talk["person"], font=face(SANS_BOLD, 22), fill=NAVY)
        meta = talk["role"]
        if talk["crr"]:
            meta = f"{meta}  ·  {talk['crr']}" if meta else talk["crr"]
        role_font = face(SANS, 16)
        role_lines = wrap(meta, role_font, d(740))[:2]
        for line_index, line in enumerate(role_lines):
            draw.text((d(250), d(top + 106 + line_index * 22)), line, font=role_font, fill=MUTED)
        title_font = face(SANS_MED, 18)
        title_y = top + 112 + len(role_lines) * 22 + 8
        for line_index, line in enumerate(wrap(talk["title"], title_font, d(740))[:3]):
            draw.text((d(250), d(title_y + line_index * 24)), line, font=title_font, fill=INK)
        top += 258

    draw.rectangle((0, d(1468), d(width), d(height)), fill=NAVY)
    draw.text((d(36), d(1488)), "yenepoya-cre.vercel.app", font=face(SANS_BOLD, 14), fill=WHITE)
    draw.text((d(860), d(1488)), "1  /  2", font=face(SANS_BOLD, 14), fill=FLARE)
    return canvas


def programme_team() -> Image.Image:
    width, height = 1080, 1528
    canvas = Image.new("RGBA", (d(width), d(height)), WHITE)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, d(width), d(12)), fill=ORANGE)
    draw_logos(canvas, 36, 26)
    draw.text((d(36), d(108)), "Organising team", font=face(SERIF, 40), fill=NAVY)
    draw.rounded_rectangle((d(680), d(116), d(1044), d(160)), radius=d(22), fill=ORANGE)
    draw.text((d(704), d(128)), "RCI CRE APPROVAL AWAITED", font=face(SANS_BOLD, 14), fill=WHITE)

    for index, person in enumerate(TEAM):
        left = 70 + index * 340
        portrait = circled(person["photo"], d(168))
        canvas.alpha_composite(portrait, (d(left + 36), d(188)))
        draw = ImageDraw.Draw(canvas)
        role = face(SANS_BOLD, 13)
        role_w = role.getlength(person["role"].upper())
        draw.text((d(left + 130) - role_w / 2, d(396)), person["role"].upper(), font=role, fill=ORANGE)
        name = face(SANS_BOLD, 18)
        name_w = name.getlength(person["name"])
        draw.text((d(left + 130) - name_w / 2, d(418)), person["name"], font=name, fill=NAVY)
        detail = face(SANS, 15)
        lines = []
        for part in person["detail"].split("\n"):
            lines.extend(wrap(part, detail, d(300)))
        if person["crr"]:
            lines.append(person["crr"])
        for line_index, line in enumerate(lines[:3]):
            line_w = detail.getlength(line)
            draw.text((d(left + 130) - line_w / 2, d(448 + line_index * 20)), line, font=detail, fill=MUTED)

    cards = [
        ("WHO IT IS FOR", "Audiologists\nSpeech-language pathologists\nSpecial educators and occupational therapists\nAnd others"),
        ("HOW TO JOIN", "Register on yenepoya-cre.vercel.app.\nPay on Razorpay.\nThen add the payment id or the receipt screenshot."),
        ("DESK", "yenepoyaaslpconference@gmail.com\n7337798055\naslp@yenepoya.edu.in"),
        ("PLACE", "The CRE day is online,\non Cisco Webex."),
    ]
    for index, (label, body) in enumerate(cards):
        column = index % 2
        row = index // 2
        left = 28 + column * 526
        top = 560 + row * 250
        box = (d(left), d(top), d(left + 500), d(top + 232))
        shadow(canvas, box, d(18), alpha=30)
        draw.rounded_rectangle(box, radius=d(18), fill=WHITE, outline=LINE, width=d(2))
        draw.rectangle((d(left), d(top), d(left + 8), d(top + 232)), fill=ORANGE)
        draw.text((d(left + 28), d(top + 18)), label, font=face(SANS_BOLD, 15), fill=ORANGE)
        body_font = face(SANS, 17)
        for line_index, line in enumerate(body.split("\n")):
            draw.text((d(left + 28), d(top + 52 + line_index * 26)), line, font=body_font, fill=INK)

    draw.rectangle((0, d(1088), d(width), d(1248)), fill=NAVY)
    emblem = logo(BRAND / "india-emblem.png", d(78))
    tree = logo(BRAND / "swavlamban.png", d(86))
    council = logo(BRAND / "rci.png", d(78))
    canvas.alpha_composite(emblem, (d(40), d(1112)))
    draw = ImageDraw.Draw(canvas)
    draw.text((d(130), d(1126)), "GOVERNMENT OF INDIA", font=face(SANS_BOLD, 16), fill=WHITE)
    draw.text((d(130), d(1152)), "Unique Disability ID  ·  Swavlamban", font=face(SANS, 15), fill=SOFT)
    canvas.alpha_composite(tree, (d(620), d(1108)))
    plate = (d(820), d(1104), d(1040), d(1224))
    draw.rounded_rectangle(plate, radius=d(16), fill=WHITE)
    canvas.alpha_composite(council, (d(860), d(1124)))

    draw.text((d(36), d(1284)), "Department of Audiology and Speech Language Pathology", font=face(SANS_SEMI, 17), fill=NAVY)
    draw.text((d(36), d(1312)), "Yenepoya Medical College Hospital", font=face(SANS, 16), fill=INK)
    draw.text((d(36), d(1338)), "Yenepoya (Deemed to be University)", font=face(SANS, 16), fill=MUTED)
    draw.rectangle((0, d(1372), d(width), d(height)), fill=NAVY)
    draw.text((d(36), d(1418)), "CRE-26111620026773   ·   Institute KK048", font=face(SANS_BOLD, 16), fill=WHITE)
    draw.text((d(940), d(1418)), "2  /  2", font=face(SANS_BOLD, 16), fill=FLARE)
    return canvas


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    public = PUBLIC / "brochure"
    first = downscale(first_flyer())
    cover = downscale(programme_cover())
    team = downscale(programme_team())

    first.save(OUT / "block-the-date.png", "PNG", optimize=True)
    first.save(OUT / "block-the-date.pdf", "PDF", resolution=150.0)
    first.save(public / "block-the-date.png", "PNG", optimize=True)
    first.save(public / "block-the-date.pdf", "PDF", resolution=150.0)
    save_pptx(OUT / "block-the-date.pptx", [first])

    cover.save(public / "beyond-the-diagnosis-1.png", "PNG", optimize=True)
    team.save(public / "beyond-the-diagnosis-2.png", "PNG", optimize=True)
    cover.save(OUT / "beyond-the-diagnosis.pdf", "PDF", resolution=150.0, save_all=True, append_images=[team])
    cover.save(public / "beyond-the-diagnosis.pdf", "PDF", resolution=150.0, save_all=True, append_images=[team])
    save_pptx(OUT / "beyond-the-diagnosis.pptx", [cover, team])
    print(public / "block-the-date.png")
    print(public / "beyond-the-diagnosis.pdf")


if __name__ == "__main__":
    build()

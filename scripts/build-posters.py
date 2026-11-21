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


def first_flyer() -> Image.Image:
    width, height = 1080, 1560
    canvas = Image.new("RGBA", (d(width), d(height)), WHITE)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, d(width), d(14)), fill=ORANGE)
    draw_logos(canvas, 36, 32)

    panel = (d(648), d(118), d(1044), d(430))
    shadow(canvas, panel, d(28))
    draw.rounded_rectangle(panel, radius=d(28), fill=NAVY)
    draw.text((d(676), d(136)), "19", font=face(SERIF, 108), fill=WHITE)
    draw.text((d(676), d(268)), "December 2026", font=face(SANS_BOLD, 22), fill=WHITE)
    draw.text((d(676), d(306)), "Saturday", font=face(SANS_BOLD, 18), fill=FLARE)
    draw.text((d(676), d(336)), "From 10:00 IST", font=face(SANS, 16), fill=SOFT)
    draw.text((d(676), d(366)), "Online · Cisco Webex", font=face(SANS_SEMI, 16), fill=WHITE)

    draw.rounded_rectangle((d(36), d(124), d(300), d(168)), radius=d(22), fill=ORANGE)
    draw.text((d(56), d(134)), "BLOCK THE DATE", font=face(SANS_BOLD, 15), fill=WHITE)
    draw.text((d(36), d(184)), "Beyond", font=face(SERIF, 68), fill=NAVY)
    draw.text((d(36), d(262)), "the Diagnosis", font=face(SERIF, 44), fill=ORANGE)
    intro = face(SANS, 18)
    draw.text((d(36), d(328)), "Disability assessment, certification,", font=intro, fill=MUTED)
    draw.text((d(36), d(354)), "and entitlements under the", font=intro, fill=MUTED)
    draw.text((d(36), d(380)), "RPwD Act, 2016.", font=intro, fill=MUTED)
    draw.text((d(36), d(416)), "Zonal CRE  ·  English", font=face(SANS_BOLD, 15), fill=NAVY)

    draw.rounded_rectangle((d(28), d(468), d(1052), d(548)), radius=d(18), fill=ORANGE)
    facts = [("Saturday", "19 December 2026"), ("From", "10:00 IST"), ("Online", "Cisco Webex")]
    for index, (label, value) in enumerate(facts):
        left = 48 + index * 340
        draw.text((d(left), d(482)), label.upper(), font=face(SANS_BOLD, 12), fill=(255, 224, 204, 255))
        draw.text((d(left), d(504)), value, font=face(SANS_BOLD, 18), fill=WHITE)

    draw.text((d(36), d(572)), "OUR SPEAKERS", font=face(SANS_BOLD, 14), fill=ORANGE)
    draw.rectangle((d(196), d(580), d(320), d(584)), fill=ORANGE)

    title_font = face(SANS, 15)
    cell_w, cell_h = 500, 400
    for index, talk in enumerate(TALKS):
        column = index % 2
        row = index // 2
        left = 28 + column * (cell_w + 24)
        top = 612 + row * (cell_h + 20)
        box = (d(left), d(top), d(left + cell_w), d(top + cell_h))
        shadow(canvas, box, d(22), alpha=36)
        draw.rounded_rectangle(box, radius=d(22), fill=WHITE, outline=LINE, width=d(2))
        draw.rectangle((d(left + 22), d(top), d(left + cell_w - 22), d(top + 8)), fill=ORANGE)
        portrait = circled(talk["photo"], d(132))
        canvas.alpha_composite(portrait, (d(left + (cell_w - portrait.width / SCALE) / 2), d(top + 28)))
        draw = ImageDraw.Draw(canvas)
        name = face(SANS_BOLD, 18)
        name_w = name.getlength(talk["person"])
        draw.text((d(left) + (d(cell_w) - name_w) / 2, d(top + 196)), talk["person"], font=name, fill=NAVY)
        time_font = face(SANS_BOLD, 14)
        time_w = time_font.getlength(talk["time"])
        draw.text((d(left) + (d(cell_w) - time_w) / 2, d(top + 224)), talk["time"], font=time_font, fill=ORANGE)
        lines = wrap(talk["title"], title_font, d(cell_w - 48))[:5]
        for line_index, line in enumerate(lines):
            line_w = title_font.getlength(line)
            draw.text((d(left) + (d(cell_w) - line_w) / 2, d(top + 258 + line_index * 22)), line, font=title_font, fill=INK)

    draw.line((d(36), d(1468), d(1044), d(1468)), fill=LINE, width=d(2))
    draw.text((d(36), d(1484)), "Department of Audiology and Speech Language Pathology", font=face(SANS_SEMI, 14), fill=NAVY)
    draw.text((d(36), d(1508)), "Yenepoya Medical College Hospital", font=face(SANS, 13), fill=INK)
    draw.text((d(36), d(1530)), "Yenepoya (Deemed to be University)   ·   yenepoya-cre.vercel.app", font=face(SANS, 13), fill=MUTED)
    return canvas


def programme_cover() -> Image.Image:
    width, height = 1080, 1528
    canvas = Image.new("RGBA", (d(width), d(height)), WHITE)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, d(width), d(12)), fill=ORANGE)
    draw_logos(canvas, 36, 28)
    draw.text((d(760), d(36)), "RCI CRE", font=face(SANS_BOLD, 12), fill=ORANGE)
    draw.text((d(760), d(54)), "APPROVAL AWAITED", font=face(SANS_BOLD, 12), fill=ORANGE)

    draw.text((d(36), d(112)), "BEYOND THE", font=face(SERIF, 54), fill=NAVY)
    draw.text((d(36), d(176)), "DIAGNOSIS", font=face(SERIF, 54), fill=ORANGE)
    draw.text((d(36), d(252)), "Disability assessment, certification and entitlements", font=face(SANS, 16), fill=MUTED)
    draw.text((d(36), d(276)), "under the RPwD Act, 2016.", font=face(SANS, 16), fill=MUTED)

    draw.rounded_rectangle((d(28), d(316), d(1052), d(390)), radius=d(16), fill=NAVY)
    bits = ["Saturday 19 December 2026", "From 10:00 IST", "Online · Cisco Webex", "Zonal · English"]
    for index, bit in enumerate(bits):
        draw.text((d(48 + index * 250), d(342)), bit, font=face(SANS_BOLD, 13), fill=WHITE if index else FLARE)

    top = 418
    for talk in TALKS:
        box = (d(28), d(top), d(1052), d(top + 250))
        shadow(canvas, box, d(20), alpha=32)
        draw.rounded_rectangle(box, radius=d(20), fill=WHITE, outline=LINE, width=d(2))
        portrait = circled(talk["photo"], d(132))
        canvas.alpha_composite(portrait, (d(48), d(top + 36)))
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle((d(250), d(top + 28), d(390), d(top + 58)), radius=d(15), fill=ORANGE)
        draw.text((d(266), d(top + 34)), talk["time"], font=face(SANS_BOLD, 14), fill=WHITE)
        draw.text((d(250), d(top + 70)), talk["person"], font=face(SANS_BOLD, 22), fill=NAVY)
        meta = talk["role"]
        if talk["crr"]:
            meta = f"{meta}  ·  {talk['crr']}" if meta else talk["crr"]
        role_font = face(SANS, 14)
        role_lines = wrap(meta, role_font, d(740))[:2]
        for line_index, line in enumerate(role_lines):
            draw.text((d(250), d(top + 104 + line_index * 20)), line, font=role_font, fill=MUTED)
        title_font = face(SANS_MED, 16)
        title_y = top + 108 + len(role_lines) * 20 + 8
        for line_index, line in enumerate(wrap(talk["title"], title_font, d(740))[:3]):
            draw.text((d(250), d(title_y + line_index * 22)), line, font=title_font, fill=INK)
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
    draw.text((d(36), d(108)), "Organising team", font=face(SERIF, 42), fill=NAVY)
    draw.rounded_rectangle((d(700), d(118), d(1044), d(158)), radius=d(20), fill=ORANGE)
    draw.text((d(724), d(128)), "RCI CRE APPROVAL AWAITED", font=face(SANS_BOLD, 12), fill=WHITE)

    for index, person in enumerate(TEAM):
        left = 70 + index * 340
        portrait = circled(person["photo"], d(168))
        canvas.alpha_composite(portrait, (d(left + 36), d(188)))
        draw = ImageDraw.Draw(canvas)
        role = face(SANS_BOLD, 12)
        role_w = role.getlength(person["role"].upper())
        draw.text((d(left + 130) - role_w / 2, d(400)), person["role"].upper(), font=role, fill=ORANGE)
        name = face(SANS_BOLD, 16)
        name_w = name.getlength(person["name"])
        draw.text((d(left + 130) - name_w / 2, d(422)), person["name"], font=name, fill=NAVY)
        detail = face(SANS, 13)
        lines = []
        for part in person["detail"].split("\n"):
            lines.extend(wrap(part, detail, d(300)))
        if person["crr"]:
            lines.append(person["crr"])
        for line_index, line in enumerate(lines[:3]):
            line_w = detail.getlength(line)
            draw.text((d(left + 130) - line_w / 2, d(450 + line_index * 18)), line, font=detail, fill=MUTED)

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
        draw.text((d(left + 28), d(top + 18)), label, font=face(SANS_BOLD, 14), fill=ORANGE)
        body_font = face(SANS, 16)
        for line_index, line in enumerate(body.split("\n")):
            draw.text((d(left + 28), d(top + 52 + line_index * 26)), line, font=body_font, fill=INK)

    draw.rectangle((0, d(1088), d(width), d(1248)), fill=NAVY)
    emblem = logo(BRAND / "india-emblem.png", d(78))
    tree = logo(BRAND / "swavlamban.png", d(86))
    council = logo(BRAND / "rci.png", d(78))
    canvas.alpha_composite(emblem, (d(40), d(1112)))
    draw = ImageDraw.Draw(canvas)
    draw.text((d(130), d(1128)), "GOVERNMENT OF INDIA", font=face(SANS_BOLD, 14), fill=WHITE)
    draw.text((d(130), d(1154)), "Unique Disability ID  ·  Swavlamban", font=face(SANS, 13), fill=SOFT)
    canvas.alpha_composite(tree, (d(620), d(1108)))
    plate = (d(820), d(1104), d(1040), d(1224))
    draw.rounded_rectangle(plate, radius=d(16), fill=WHITE)
    canvas.alpha_composite(council, (d(860), d(1124)))

    draw.text((d(36), d(1288)), "Department of Audiology and Speech Language Pathology", font=face(SANS_SEMI, 16), fill=NAVY)
    draw.text((d(36), d(1316)), "Yenepoya Medical College Hospital", font=face(SANS, 15), fill=INK)
    draw.text((d(36), d(1342)), "Yenepoya (Deemed to be University)", font=face(SANS, 15), fill=MUTED)
    draw.rectangle((0, d(1372), d(width), d(height)), fill=NAVY)
    draw.text((d(36), d(1410)), "CRE-26111620026773   ·   Institute KK048", font=face(SANS_BOLD, 14), fill=WHITE)
    draw.text((d(940), d(1410)), "2  /  2", font=face(SANS_BOLD, 14), fill=FLARE)
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

"""Render the share flyer: speakers, timed talks, and a dimensional layout."""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont
from pptx import Presentation
from pptx.util import Inches

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
PUBLIC = ROOT / "public"
OUT = Path("/opt/cursor/artifacts")

W, H = 1080, 1840
SCALE = 2

NAVY = (12, 35, 64, 255)
DEEP = (7, 21, 38, 255)
ORANGE = (194, 65, 12, 255)
FLARE = (255, 122, 26, 255)
WHITE = (255, 255, 255, 255)
SOFT = (214, 222, 232, 255)
INK = (17, 24, 39, 255)

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
        "photo": PUBLIC / "department" / "shwetha-prabhu.jpg",
    },
    {
        "time": "11:00 AM",
        "title": "Know the 21: Types of Disabilities Recognised under the RPwD Act, 2016",
        "person": "Ms. Swathi Chinnasamy",
        "photo": PUBLIC / "faculty" / "swathi-c.jpg",
    },
    {
        "time": "12:00 PM",
        "title": "Learning, Intellectual and Autism Spectrum Disabilities: Rights and Entitlements under the RPwD Act, 2016 – A Psychologist’s Perspective",
        "person": "Ms. Vasudha K G",
        "photo": PUBLIC / "faculty" / "vasudha-kg.jpg",
    },
    {
        "time": "01:00 PM",
        "title": "Rights and Privileges of Persons with Communication Disorders: ASLPs to Deal with Legal and Legislative Aspects",
        "person": "Dr. Satyapal Puri Goswami",
        "photo": PUBLIC / "faculty" / "satyapal-goswami.jpg",
    },
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size * SCALE)


def px(value: float) -> int:
    return int(value * SCALE)


def wrap(text: str, face: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split():
        trial = word if current == "" else f"{current} {word}"
        if face.getlength(trial) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def glow(canvas: Image.Image, cx: int, cy: int, radius: int, color: tuple[int, int, int], peak: int) -> None:
    diameter = radius * 2
    mask = Image.new("L", (diameter, diameter), 0)
    pixels = mask.load()
    for y in range(diameter):
        for x in range(diameter):
            distance = ((x - radius) ** 2 + (y - radius) ** 2) ** 0.5 / radius
            if distance < 1:
                pixels[x, y] = int((1 - distance) ** 2.2 * peak)
    orb = Image.new("RGBA", (diameter, diameter), (*color, 0))
    orb.putalpha(mask)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(orb, (cx - radius, cy - radius), orb)
    canvas.alpha_composite(layer)


def sphere(diameter: int, core: tuple[int, int, int], rim: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    pixels = image.load()
    radius = diameter / 2
    for y in range(diameter):
        for x in range(diameter):
            dx = (x - radius) / radius
            dy = (y - radius) / radius
            distance = (dx * dx + dy * dy) ** 0.5
            if distance >= 1:
                continue
            light = max(0.0, 1 - (((dx + 0.35) ** 2 + (dy + 0.42) ** 2) ** 0.5) / 1.15)
            shade = 0.55 + 0.45 * (1 - distance)
            mix = min(1.0, light * 0.85)
            red = int(rim[0] * shade * (1 - mix) + 255 * mix)
            green = int(rim[1] * shade * (1 - mix) + 236 * mix)
            blue = int(rim[2] * shade * (1 - mix) + 220 * mix)
            core_mix = max(0.0, 1 - distance * 1.15)
            red = int(red * (1 - core_mix * 0.15) + core[0] * core_mix * 0.15)
            green = int(green * (1 - core_mix * 0.15) + core[1] * core_mix * 0.15)
            blue = int(blue * (1 - core_mix * 0.15) + core[2] * core_mix * 0.15)
            edge = 1 if distance > 0.92 else 255
            alpha = int(255 * (1 - distance) ** 0.35) if distance > 0.9 else 255
            pixels[x, y] = (red, green, blue, edge if distance > 0.97 else alpha)
    highlight = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    ImageDraw.Draw(highlight).ellipse((diameter * 0.22, diameter * 0.16, diameter * 0.48, diameter * 0.34), fill=(255, 255, 255, 90))
    highlight = highlight.filter(ImageFilter.GaussianBlur(diameter * 0.04))
    image.alpha_composite(highlight)
    return image


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def shadow(canvas: Image.Image, box: tuple[int, int, int, int], radius: int, blur: int, alpha: int = 110, dy: int = 18) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    left, top, right, bottom = box
    ImageDraw.Draw(layer).rounded_rectangle((left, top + dy, right, bottom + dy), radius=radius, fill=(0, 0, 0, alpha))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def clip_round(image: Image.Image, radius: int) -> Image.Image:
    mask = rounded_mask(image.size, radius)
    image.putalpha(ImageChops.multiply(image.getchannel("A"), mask))
    return image


def circle_photo(path: Path, size: int) -> Image.Image:
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
    image = image.crop((left, top, left + side, top + side)).resize((size, size), Image.Resampling.LANCZOS)
    ring = px(7)
    canvas = Image.new("RGBA", (size + ring * 2, size + ring * 2), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).ellipse((0, 0, canvas.size[0] - 1, canvas.size[1] - 1), fill=ORANGE)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((1, 1, size - 2, size - 2), fill=255)
    framed = Image.new("RGBA", (size, size))
    framed.paste(image, (0, 0))
    framed.putalpha(mask)
    canvas.alpha_composite(framed, (ring, ring))
    return canvas


def logo_plate(path: Path, height: int, pad: int) -> Image.Image:
    mark = Image.open(path).convert("RGBA")
    ratio = height / mark.height
    mark = mark.resize((max(1, int(mark.width * ratio)), height), Image.Resampling.LANCZOS)
    plate = Image.new("RGBA", (mark.width + pad * 2, mark.height + pad * 2), (0, 0, 0, 0))
    face = Image.new("RGBA", plate.size, WHITE)
    plate.alpha_composite(clip_round(face, px(16)))
    plate.alpha_composite(mark, (pad, pad))
    return plate


def build_image() -> Image.Image:
    canvas = Image.new("RGBA", (px(W), px(H)), DEEP)
    glow(canvas, px(980), px(80), px(420), (255, 122, 26), 150)
    glow(canvas, px(80), px(1500), px(360), (28, 78, 140), 120)
    glow(canvas, px(540), px(420), px(300), (194, 65, 12), 50)

    draw = ImageDraw.Draw(canvas)
    watermark = font(SERIF, 168)
    draw.text((px(760), px(188)), "19", font=watermark, fill=(255, 255, 255, 235))

    orange = sphere(px(230), (255, 122, 26), (194, 65, 12))
    canvas.alpha_composite(orange, (px(930), px(-70)))
    blue = sphere(px(150), (186, 214, 240), (18, 52, 96))
    canvas.alpha_composite(blue, (px(-50), px(1040)))

    college = logo_plate(BRAND / "yenepoya-medical-college.png", px(58), px(12))
    council = logo_plate(BRAND / "rci.png", px(62), px(10))
    shadow(canvas, (px(40), px(36), px(40) + college.width, px(36) + college.height), px(16), px(8), 70, px(8))
    canvas.alpha_composite(college, (px(40), px(36)))
    council_x = px(40) + college.width + px(16)
    shadow(canvas, (council_x, px(36), council_x + council.width, px(36) + council.height), px(16), px(8), 70, px(8))
    canvas.alpha_composite(council, (council_x, px(36)))

    draw = ImageDraw.Draw(canvas)
    pill = (px(40), px(150), px(292), px(196))
    shadow(canvas, pill, px(23), px(8), 80, px(6))
    draw.rounded_rectangle(pill, radius=px(23), fill=ORANGE)
    label = font(SANS_BOLD, 15)
    draw.text((px(62), px(160)), "BLOCK THE DATE", font=label, fill=WHITE)

    title = font(SERIF, 78)
    for step in range(10, 0, -1):
        draw.text((px(40 + step), px(214 + step)), "Beyond", font=title, fill=(194, 65, 12, 150))
    draw.text((px(40), px(214)), "Beyond", font=title, fill=WHITE)
    diagnosis = font(SERIF, 58)
    draw.text((px(40), px(312)), "the Diagnosis", font=diagnosis, fill=FLARE)

    body = font(SANS, 22)
    subtitle = "Four talks on disability assessment, certification, and entitlements under the RPwD Act, 2016."
    for index, line in enumerate(wrap(subtitle, body, px(700))):
        draw.text((px(40), px(400 + index * 32)), line, font=body, fill=SOFT)

    chips = [("Saturday", "19 December"), ("From", "10:00 IST"), ("Online", "Cisco Webex")]
    chip_w, chip_h = 310, 86
    for index, (top_line, bottom_line) in enumerate(chips):
        left = 40 + index * (chip_w + 16)
        box = (px(left), px(486), px(left + chip_w), px(486 + chip_h))
        shadow(canvas, box, px(22), px(12), 90, px(10))
        glass = Image.new("RGBA", (px(chip_w), px(chip_h)), (16, 36, 64, 210))
        ImageDraw.Draw(glass).rounded_rectangle((px(1), px(1), px(chip_w - 2), px(chip_h - 2)), radius=px(22), outline=(255, 255, 255, 80), width=px(2))
        canvas.alpha_composite(clip_round(glass, px(22)), (px(left), px(486)))
        draw = ImageDraw.Draw(canvas)
        small = font(SANS_MED, 14)
        strong = font(SANS_BOLD, 20)
        draw.text((px(left + 22), px(500)), top_line.upper(), font=small, fill=FLARE)
        draw.text((px(left + 22), px(526)), bottom_line, font=strong, fill=WHITE)

    draw.text((px(44), px(598)), "THE TALKS", font=font(SANS_BOLD, 14), fill=FLARE)

    photo_size = px(112)
    card_top = 636
    card_h = 228
    for index, talk in enumerate(TALKS):
        top = card_top + index * (card_h + 16)
        box = (px(40), px(top), px(1040), px(top + card_h))
        shadow(canvas, box, px(28), px(16), 120, px(14))
        card = Image.new("RGBA", (px(1000), px(card_h)), (14, 32, 58, 230))
        card_draw = ImageDraw.Draw(card)
        card_draw.rounded_rectangle((px(1), px(1), px(999), px(card_h - 2)), radius=px(28), outline=(255, 255, 255, 50), width=px(2))
        card_draw.rounded_rectangle((0, px(28), px(8), px(card_h - 28)), radius=px(4), fill=FLARE)
        canvas.alpha_composite(clip_round(card, px(28)), (px(40), px(top)))

        portrait = circle_photo(talk["photo"], photo_size)
        portrait_shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        blob = Image.new("RGBA", portrait.size, (0, 0, 0, 0))
        ImageDraw.Draw(blob).ellipse((0, px(8), portrait.size[0], portrait.size[1]), fill=(0, 0, 0, 120))
        portrait_shadow.alpha_composite(blob.filter(ImageFilter.GaussianBlur(px(8))), (px(68), px(top + 36)))
        canvas.alpha_composite(portrait_shadow)
        canvas.alpha_composite(portrait, (px(68), px(top + 28)))

        draw = ImageDraw.Draw(canvas)
        text_x = 250
        draw.text((px(text_x), px(top + 28)), talk["time"], font=font(SANS_BOLD, 16), fill=FLARE)
        draw.text((px(text_x), px(top + 56)), talk["person"], font=font(SANS_BOLD, 26), fill=WHITE)
        title_face = font(SANS_MED, 17)
        lines = wrap(talk["title"], title_face, px(740))[:4]
        for line_index, line in enumerate(lines):
            draw.text((px(text_x), px(top + 100 + line_index * 26)), line, font=title_face, fill=SOFT)

    draw.rectangle((0, px(1668), px(W), px(H)), fill=NAVY)
    draw.text((px(40), px(1690)), "Department of Audiology and Speech Language Pathology", font=font(SANS_SEMI, 16), fill=WHITE)
    draw.text((px(40), px(1720)), "Yenepoya Medical College Hospital", font=font(SANS, 15), fill=SOFT)
    draw.text((px(40), px(1748)), "Yenepoya (Deemed to be University)", font=font(SANS, 15), fill=SOFT)
    draw.text((px(40), px(1786)), "yenepoya-cre.vercel.app", font=font(SANS_BOLD, 18), fill=FLARE)
    approval = (px(620), px(1776), px(1040), px(1818))
    draw.rounded_rectangle(approval, radius=px(21), fill=ORANGE)
    note = font(SANS_BOLD, 13)
    note_text = "RCI CRE APPROVAL AWAITED"
    note_w = note.getlength(note_text)
    draw.text((px(830) - note_w / 2, px(1788)), note_text, font=note, fill=WHITE)
    return canvas


def build() -> Path:
    image = build_image()
    OUT.mkdir(parents=True, exist_ok=True)
    master = image.resize((W, H), Image.Resampling.LANCZOS).convert("RGB")
    png = OUT / "block-the-date.png"
    pdf = OUT / "block-the-date.pdf"
    pptx_path = OUT / "block-the-date.pptx"
    master.save(png, "PNG", optimize=True)
    master.save(pdf, "PDF", resolution=150.0)

    presentation = Presentation()
    presentation.slide_width = Inches(7.5)
    presentation.slide_height = Inches(7.5 * H / W)
    presentation.core_properties.title = "Block the date — Beyond the Diagnosis"
    presentation.core_properties.subject = "Share flyer with the four talks and speakers."
    slide = presentation.slides.add_slide(presentation.slide_layouts[6])
    slide.shapes.add_picture(str(png), 0, 0, width=presentation.slide_width, height=presentation.slide_height)
    presentation.save(pptx_path)
    return png


if __name__ == "__main__":
    print(build())

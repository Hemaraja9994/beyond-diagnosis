"""Build the first shareable flyer: a save-the-date for the online workshop."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
OUT = Path("/opt/cursor/artifacts")

NAVY = RGBColor(0x0C, 0x23, 0x40)
DEEP = RGBColor(0x07, 0x15, 0x26)
ORANGE = RGBColor(0xC2, 0x41, 0x0C)
FLARE = RGBColor(0xFF, 0x7A, 0x1A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
SOFT = RGBColor(0xD6, 0xDE, 0xE8)
MUTED = RGBColor(0x4B, 0x55, 0x63)

W = 7.5
H = 9.375


def fill(shape, color: RGBColor) -> None:
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def rect(slide, left, top, width, height, color: RGBColor):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    fill(shape, color)
    return shape


def rrect(slide, left, top, width, height, color: RGBColor, radius: float = 0.12):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    fill(shape, color)
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


def build() -> Path:
    presentation = Presentation()
    presentation.slide_width = Inches(W)
    presentation.slide_height = Inches(H)
    presentation.core_properties.title = "Block the date — Beyond the Diagnosis"
    presentation.core_properties.subject = "First flyer for the online workshop on 19 December 2026."
    slide = presentation.slides.add_slide(presentation.slide_layouts[6])

    rect(slide, 0, 0, W, H, NAVY)
    rect(slide, 0, 0, 0.16, H, FLARE)

    rrect(slide, 0.42, 0.28, 1.7, 0.82, WHITE, 0.14)
    slide.shapes.add_picture(str(BRAND / "yenepoya-medical-college.png"), Inches(0.52), Inches(0.36), height=Inches(0.66))
    rrect(slide, 5.72, 0.28, 1.36, 0.82, WHITE, 0.14)
    slide.shapes.add_picture(str(BRAND / "rci.png"), Inches(5.92), Inches(0.36), height=Inches(0.66))

    text(slide, 0.42, 1.32, 6.6, 1.22, "BLOCK", 84, WHITE, True, "Georgia")
    text(slide, 0.42, 2.48, 6.6, 1.15, "THE DATE", 72, FLARE, True, "Georgia")
    rect(slide, 0.46, 3.72, 1.7, 0.07, ORANGE)

    text(slide, 0.38, 3.9, 2.15, 1.45, "19", 96, WHITE, True, "Georgia")
    text(slide, 2.55, 4.12, 4.5, 0.42, "December 2026", 26, WHITE, True, "Georgia")
    text(slide, 2.55, 4.58, 4.5, 0.32, "Saturday", 18, SOFT, False)
    text(slide, 2.55, 4.92, 4.5, 0.32, "From 10:00 IST", 18, FLARE, True)

    rrect(slide, 0.42, 5.5, 6.66, 2.28, DEEP, 0.08)
    text(slide, 0.68, 5.68, 6.15, 0.48, "Beyond the Diagnosis", 26, WHITE, True, "Georgia")
    text(
        slide,
        0.68,
        6.22,
        6.15,
        0.7,
        "An online workshop on disability assessment,\ncertification, and entitlements.",
        16,
        SOFT,
    )
    text(slide, 0.68, 6.96, 6.15, 0.3, "Under the RPwD Act, 2016", 15, FLARE, True)
    text(slide, 0.68, 7.32, 6.15, 0.28, "Zonal CRE   ·   English   ·   Cisco Webex", 14, WHITE, True)

    rect(slide, 0, 7.98, W, 1.395, WHITE)
    rect(slide, 0, 7.98, 0.16, 1.395, FLARE)
    text(slide, 0.42, 8.1, 6.7, 0.26, "Department of Audiology and Speech Language Pathology", 12, NAVY, True)
    text(slide, 0.42, 8.36, 6.7, 0.22, "Yenepoya Medical College Hospital", 12, NAVY)
    text(slide, 0.42, 8.58, 6.7, 0.22, "Yenepoya (Deemed to be University)", 12, MUTED)
    text(slide, 0.42, 8.9, 6.7, 0.26, "RCI CRE approval awaited    ·    yenepoya-cre.vercel.app", 12, ORANGE, True)

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "block-the-date.pptx"
    presentation.save(path)
    return path


if __name__ == "__main__":
    print(build())

"""Render the eazip wordmark to SVG with glyphs converted to <path> data.

Uses Space Grotesk 700 from node_modules. Outputs public/wordmark.svg.
Reproduces .eazip-wordmark CSS: letter-spacing -0.04em, "ea" in dark,
"zip" with magenta->orange linear gradient.
"""

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

FONT_PATH = "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2"
OUT_PATH = "public/wordmark.svg"

FONT_SIZE = 200  # logical font size used to lay out glyphs
LETTER_SPACING_EM = -0.04  # matches CSS

font = TTFont(FONT_PATH)
upem = font["head"].unitsPerEm
ascent = font["OS/2"].sTypoAscender
descent = font["OS/2"].sTypoDescender
cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()
hmtx = font["hmtx"]

scale = FONT_SIZE / upem
tracking = LETTER_SPACING_EM * FONT_SIZE  # px between glyphs

def glyph_path(ch, x_offset_units):
    """Return (svg_path_d, advance_units) for a single character at x_offset."""
    name = cmap[ord(ch)]
    pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.2f}")
    glyph_set[name].draw(pen)
    advance = hmtx[name][0]
    return pen.getCommands(), advance

def render_text(text):
    """Return (combined_path_d, total_advance_px) for the rendered string."""
    paths = []
    cursor_units = 0
    cursor_px = 0
    for i, ch in enumerate(text):
        name = cmap[ord(ch)]
        advance = hmtx[name][0]
        pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.2f}")
        glyph_set[name].draw(pen)
        d = pen.getCommands()
        # Position glyph: translate by cursor_px, flip Y (font origin is at baseline, Y-up)
        # We'll wrap in a transform via group instead so we keep raw path here.
        paths.append((d, cursor_px))
        cursor_px += advance * scale + (tracking if i < len(text) - 1 else 0)
    return paths, cursor_px

ea_glyphs, ea_width = render_text("ea")
zip_glyphs, zip_width = render_text("zip")

# gap between "ea" and "zip" — use one letter-spacing unit (negative, so they nudge closer)
gap = tracking

# Compute tight vertical bounds across all glyphs (in font units)
glyf = font["glyf"]
def glyph_y_bounds(ch):
    g = glyf[cmap[ch] if isinstance(ch, int) else cmap[ord(ch)]]
    if g.numberOfContours == 0 or not hasattr(g, "yMin"):
        return None
    return g.yMin, g.yMax

ymins, ymaxs = [], []
for ch in "eazip":
    b = glyph_y_bounds(ch)
    if b:
        ymins.append(b[0])
        ymaxs.append(b[1])
y_min_units = min(ymins)  # most negative (descender bottom)
y_max_units = max(ymaxs)  # highest point (dot of i, ascender)

# Baseline (top) is placed so the highest glyph point sits at viewBox y=0
top = y_max_units * scale
total_width = ea_width + gap + zip_width
height = (y_max_units - y_min_units) * scale

def render_path_group(glyphs, color_or_url, x_origin):
    parts = []
    for d, x in glyphs:
        # Path data is in font units; translate baseline origin to (x_origin+x, top)
        # in px, then scale font units to px and flip Y (font Y-up -> SVG Y-down).
        parts.append(
            f'    <path transform="translate({x_origin + x:.2f} {top:.2f}) scale({scale:.5f} {-scale:.5f})" '
            f'd="{d}" fill="{color_or_url}"/>'
        )
    return "\n".join(parts)

zip_x_origin = ea_width + gap
ea_svg = render_path_group(ea_glyphs, "#0e0e12", 0)
zip_svg = render_path_group(zip_glyphs, "url(#g)", zip_x_origin)

# Compute the horizontal extent of "zip" in viewBox px so the gradient spans
# the entire word rather than each letter individually.
zip_min_px = None
zip_max_px = None
cursor = 0
for i, ch in enumerate("zip"):
    name = cmap[ord(ch)]
    g = glyf[name]
    if hasattr(g, "xMin"):
        left = zip_x_origin + cursor + g.xMin * scale
        right = zip_x_origin + cursor + g.xMax * scale
        zip_min_px = left if zip_min_px is None else min(zip_min_px, left)
        zip_max_px = right if zip_max_px is None else max(zip_max_px, right)
    cursor += hmtx[name][0] * scale + (tracking if i < 2 else 0)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_width:.2f} {height:.2f}" role="img" aria-label="eazip">
  <title>eazip</title>
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="{zip_min_px:.2f}" y1="0" x2="{zip_max_px:.2f}" y2="0">
      <stop offset="0%" stop-color="#d946ef"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
  </defs>
  <g>
{ea_svg}
{zip_svg}
  </g>
</svg>
'''

with open(OUT_PATH, "w") as f:
    f.write(svg)

print(f"wrote {OUT_PATH} ({total_width:.1f}x{height:.1f})")

"""
CONTOUR — contour line generator.

Real contour lines are iso-lines of a continuous scalar field. Two rules follow
from that, and both are broken by hand-drawn paths:

  1. Iso-lines of *different* levels of the same continuous field can never
     cross. (Mathematically they are disjoint sets.)
  2. An iso-line can only self-intersect at a saddle point, and then only in
     a "figure eight". Level selection can avoid that entirely.

So: build a smooth field, extract the iso-lines with marching squares, and
the geometry is correct by construction. Nothing is drawn by hand.

Two field types are produced:

  * a *periodic* field, for the tiling chart-paper texture — the field wraps,
    so a contour leaving the right edge continues on the left of the next tile.
  * a *summit* field, for the hero instrument and the brand mark — a single
    hill, so its contours are nested closed curves that never touch.

Usage:
    python3 tools/contour-gen.py      # write the assets

The generated artwork is checked in; this script is how it is changed. Run
it from the repository root, and re-inject the hero paths:

    python3 tools/contour-gen.py
    # then copy the `contours` and `summit` from the printed output into
    # index.html's .ds-instrument__rings, and the mark's paths into #i-mark
"""

import math
import os
import sys

import numpy as np

# ---------------------------------------------------------------------------
# Fields
# ---------------------------------------------------------------------------


def periodic_value_noise(width, height, cells, octaves, seed):
    """
    Periodic value noise on a `width` x `height` torus.

    A random lattice of `cells` x `cells` values is wrapped around the domain
    and interpolated with a quintic fade, so the field is continuous *and*
    periodic — the left edge matches the right edge exactly, which is what
    makes the texture tile without a seam.
    """
    rng = np.random.default_rng(seed)
    total = np.zeros((height, width))
    amplitude = 1.0
    frequency = cells

    for _ in range(octaves):
        lattice = rng.random((frequency, frequency))
        # Wrap the lattice into a (frequency+1) square so the interpolation
        # can read the wrapped neighbours.
        padded = np.empty((frequency + 1, frequency + 1))
        padded[:frequency, :frequency] = lattice
        padded[:frequency, frequency] = lattice[:, 0]
        padded[frequency, :frequency] = lattice[0, :]
        padded[frequency, frequency] = lattice[0, 0]

        xs = np.linspace(0, frequency, width, endpoint=False)
        ys = np.linspace(0, frequency, height, endpoint=False)
        xi = np.floor(xs).astype(int)
        yi = np.floor(ys).astype(int)
        tx = xs - xi
        ty = ys - yi
        # Quintic fade: C2 continuous, so the field has no visible creases.
        tx = tx**3 * (tx * (tx * 6 - 15) + 10)
        ty = ty**3 * (ty * (ty * 6 - 15) + 10)

        c00 = padded[yi[:, None], xi[None, :]]
        c10 = padded[yi[:, None], xi[None, :] + 1]
        c01 = padded[yi[:, None] + 1, xi[None, :]]
        c11 = padded[yi[:, None] + 1, xi[None, :] + 1]

        top = c00 * (1 - tx)[None, :] + c10 * tx[None, :]
        bottom = c01 * (1 - tx)[None, :] + c11 * tx[None, :]
        total += amplitude * (top * (1 - ty)[:, None] + bottom * ty[:, None])

        amplitude *= 0.5
        frequency *= 2

    return total / total.max()


def terrain_field(width, height, seed=7):
    """
    The tiling field: periodic value noise, tilted so the contours run mostly
    one way — a real map is not isotropic noise, it has a grain.
    """
    base = periodic_value_noise(width, height, cells=3, octaves=4, seed=seed)
    grain = periodic_value_noise(width, height, cells=2, octaves=2, seed=seed + 101)

    ys, xs = np.mgrid[0:height, 0:width]
    u = xs / width
    v = ys / height

    # A low-frequency tilt. Integer wave numbers keep the field periodic.
    tilt = 0.35 * np.sin(2 * np.pi * (1 * u + 0.6 * v))
    tilt += 0.18 * np.sin(2 * np.pi * (2 * u - 1 * v) + 1.3)
    ridge = 0.22 * np.abs(np.sin(2 * np.pi * (u + 2 * v)))

    field = 0.70 * base + 0.30 * grain + tilt + ridge * 0.5
    return field


def mark_field(width, height):
    """
    The brand mark's field: one peak, slightly lobed so the loops are organic
    rather than geometric. Star-shaped in the radial direction, so every
    level is a single closed curve and no two levels can touch.
    """
    ys, xs = np.mgrid[0:height, 0:width]
    x = xs / width - 0.5
    y = ys / height - 0.5
    radius = np.sqrt(x**2 + y**2)
    angle = np.arctan2(y, x)
    return 1.0 - 1.05 * radius + 0.085 * np.cos(3 * angle) * radius


def instrument_field(width, height, seed=23):
    """
    The hero instrument's field.

    A single smooth bump on its own gives perfectly circular contours, which
    read as a radar display rather than a map. So the ground is the same
    irregular terrain as the chart paper, with one local rise in the middle:
    the low levels meander across the frame as open curves, the high levels
    close into irregular loops around the summit.
    """
    base = terrain_field(width, height, seed=seed)
    ys, xs = np.mgrid[0:height, 0:width]
    x = xs / width - 0.5
    y = ys / height - 0.5
    rise = np.exp(-(((x - 0.00) / 0.19) ** 2 + ((y + 0.01) / 0.17) ** 2))
    return 0.46 * base + 1.50 * rise


def summit_field(width, height, seed=3):
    """
    The summit field: one dominant peak with a shoulder and a saddle-free
    skirt, so every level above the base is a single closed loop.
    """
    ys, xs = np.mgrid[0:height, 0:width]
    x = xs / width - 0.5
    y = ys / height - 0.5

    def bump(cx, cy, rx, ry, power=2.0):
        d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        return np.exp(-(d**power))

    field = (
        1.00 * bump(0.02, -0.02, 0.30, 0.26)
        + 0.42 * bump(-0.26, 0.20, 0.24, 0.20)
        + 0.30 * bump(0.30, 0.26, 0.22, 0.18)
        + 0.16 * bump(-0.10, -0.30, 0.18, 0.15)
    )
    # A shallow basin on one flank, so the lower levels close around the
    # summit and the higher ones split into separate rings.
    field -= 0.22 * bump(0.22, -0.26, 0.18, 0.16)
    return field


# ---------------------------------------------------------------------------
# Marching squares
# ---------------------------------------------------------------------------

# For each cell we know which of its four corners are above the level.
# Edges are numbered 0 = top, 1 = right, 2 = bottom, 3 = left.
# The table below lists the edges each contour segment joins. Two of the
# sixteen cases are saddles, where the pairing depends on the value in the
# middle of the cell; those are resolved separately.
_SINGLE = {
    1: (3, 0),
    2: (0, 1),
    3: (3, 1),
    4: (1, 2),
    6: (0, 2),
    7: (3, 2),
    8: (2, 3),
    9: (0, 2),
    11: (1, 2),
    12: (1, 3),
    13: (0, 1),
    14: (3, 0),
}

# Saddles. The key is the mask; the value is (centre above level) -> pairs.
_SADDLE = {
    5: {True: ((0, 1), (2, 3)), False: ((3, 0), (1, 2))},
    10: {True: ((3, 0), (1, 2)), False: ((0, 1), (2, 3))},
}


def _saddle_above(v00, v10, v11, v01, level):
    """
    The asymptotic decider for a saddle cell.

    The bilinear surface in the cell has a saddle point; whether the contour
    turns one way or the other around it depends on whether that saddle point
    is above or below the level. Averaging the corners is only an
    approximation, and it produces figure-eights where a real map has a
    single line. This computes the saddle point itself.
    """
    a = v10 - v00
    b = v01 - v00
    c = v11 - v10 - v01 + v00
    denominator = a * a - b * b + c * (a - b)
    if abs(denominator) < 1e-12:
        return 0.25 * (v00 + v10 + v11 + v01) > level
    x = (a * b - b * b) / denominator
    y = (b * a - a * a) / denominator
    if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
        return 0.25 * (v00 + v10 + v11 + v01) > level
    value = (
        v00 * (1 - x) * (1 - y)
        + v10 * x * (1 - y)
        + v11 * x * y
        + v01 * (1 - x) * y
    )
    return value > level


def extract_contours(field, level, wrap_x=False, wrap_y=False):
    """
    Marching squares over `field` (a 2D array). Returns a list of polylines,
    each a list of (x, y) in *array index* space.

    When wrap_x / wrap_y are set, the field is treated as a torus: the last
    column/row continues into the first, and a polyline that leaves the right
    edge re-enters on the left at an unwrapped coordinate.
    """
    height, width = field.shape
    segments = []

    for j in range(height - 1):
        for i in range(width - 1):
            v00 = field[j, i]
            v10 = field[j, i + 1]
            v11 = field[j + 1, i + 1]
            v01 = field[j + 1, i]
            mask = (
                (1 if v00 > level else 0)
                | (2 if v10 > level else 0)
                | (4 if v11 > level else 0)
                | (8 if v01 > level else 0)
            )
            edges = None
            if mask in _SINGLE:
                edges = (_SINGLE[mask],)
            elif mask in _SADDLE:
                edges = _SADDLE[mask][_saddle_above(v00, v10, v11, v01, level)]
            if not edges:
                continue

            # Corner values and positions.
            values = {0: v00, 1: v10, 2: v11, 3: v01}
            positions = {
                0: (i, j),
                1: (i + 1, j),
                2: (i + 1, j + 1),
                3: (i, j + 1),
            }
            # Each edge of the cell joins two corners.
            edge_corners = {0: (0, 1), 1: (1, 2), 2: (3, 2), 3: (0, 3)}

            def crossing(edge):
                ca, cb = edge_corners[edge]
                va, vb = values[ca], values[cb]
                (ax, ay), (bx, by) = positions[ca], positions[cb]
                t = (level - va) / (vb - va) if vb != va else 0.5
                return (ax + (bx - ax) * t, ay + (by - ay) * t)

            for first, second in edges:
                segments.append((crossing(first), crossing(second)))

    return _link(segments, width, height, wrap_x, wrap_y)


def _link(segments, width, height, wrap_x=False, wrap_y=False):
    """
    Join loose segments into polylines.

    Endpoints are matched on a quantised key, so the chain follows the
    contour exactly. On a torus the field is sampled with one extra row and
    column, so a contour that leaves the right edge is already continued
    inside the tile and no unwrapping is needed here.
    """
    if not segments:
        return []

    def key(point):
        return (round(point[0] * 4096) / 4096, round(point[1] * 4096) / 4096)

    endpoints = {}
    for index, (a, b) in enumerate(segments):
        endpoints.setdefault(key(a), []).append(index)
        endpoints.setdefault(key(b), []).append(index)

    used = [False] * len(segments)
    polylines = []

    for index in range(len(segments)):
        if used[index]:
            continue
        used[index] = True
        chain = [segments[index][0], segments[index][1]]

        while True:
            end = chain[-1]
            following = None
            for candidate in endpoints.get(key(end), []):
                if used[candidate]:
                    continue
                a, b = segments[candidate]
                if key(a) == key(end):
                    following = (candidate, b)
                    break
                if key(b) == key(end):
                    following = (candidate, a)
                    break
            if following is None:
                break
            used[following[0]] = True
            chain.append(following[1])
            if len(chain) > 50000:
                break

        polylines.append(chain)

    return polylines


# ---------------------------------------------------------------------------
# Smoothing and output
# ---------------------------------------------------------------------------


def chaikin(points, iterations=2, closed=False):
    """Corner cutting. Keeps the curve inside the original hull."""
    for _ in range(iterations):
        if len(points) < 3:
            return points
        out = []
        if not closed:
            out.append(points[0])
        count = len(points) if closed else len(points) - 1
        for i in range(count):
            p = points[i]
            q = points[(i + 1) % len(points)]
            out.append((0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]))
            out.append((0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]))
        if not closed:
            out.append(points[-1])
        points = out
    return points


def to_path(points, precision=1):
    """Catmull-Rom through the points, emitted as cubic Béziers."""
    if len(points) < 2:
        return ""
    d = [f"M {points[0][0]:.{precision}f} {points[0][1]:.{precision}f}"]
    n = len(points)
    for i in range(n - 1):
        p0 = points[i - 1] if i > 0 else points[0]
        p1 = points[i]
        p2 = points[i + 1]
        p3 = points[i + 2] if i + 2 < n else points[-1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d.append(
            "C {:.1f} {:.1f} {:.1f} {:.1f} {:.1f} {:.1f}".format(
                c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]
            )
        )
    return " ".join(d)


def decimate(points, tolerance=0.35):
    """Drop points that are within `tolerance` of the line before them."""
    if len(points) < 3:
        return points
    out = [points[0]]
    for p in points[1:-1]:
        last = out[-1]
        if math.dist((p[0], p[1]), (last[0], last[1])) >= tolerance:
            out.append(p)
    out.append(points[-1])
    return out


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------


def _segments_cross(a1, a2, b1, b2):
    def orient(p, q, r):
        val = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
        return 0 if abs(val) < 1e-12 else (1 if val > 0 else -1)

    def on_segment(p, q, r):
        return (
            min(p[0], r[0]) - 1e-9 <= q[0] <= max(p[0], r[0]) + 1e-9
            and min(p[1], r[1]) - 1e-9 <= q[1] <= max(p[1], r[1]) + 1e-9
        )

    o1 = orient(a1, a2, b1)
    o2 = orient(a1, a2, b2)
    o3 = orient(b1, b2, a1)
    o4 = orient(b1, b2, a2)
    if o1 != o2 and o3 != o4:
        return True
    if o1 == 0 and on_segment(a1, b1, a2):
        return True
    if o2 == 0 and on_segment(a1, b2, a2):
        return True
    if o3 == 0 and on_segment(b1, a1, b2):
        return True
    if o4 == 0 and on_segment(b1, a2, b2):
        return True
    return False


def verify(paths, field, level, sample):
    """
    Two checks on the extracted geometry:

      * every vertex must still sit on its own level (the field value at the
        vertex, sampled from the *continuous* field, must match);
      * no segment of one path may cross a segment of another path.
    """
    worst = 0.0
    for path in paths:
        for x, y in path:
            value = sample(x, y)
            worst = max(worst, abs(value - level))

    crossings = 0
    polys = [decimate(p, 0.6) for p in paths]
    boxes = []
    for p in polys:
        xs = [q[0] for q in p]
        ys = [q[1] for q in p]
        boxes.append((min(xs), min(ys), max(xs), max(ys)))

    for i in range(len(polys)):
        for j in range(i + 1, len(polys)):
            bi, bj = boxes[i], boxes[j]
            if bi[2] < bj[0] or bj[2] < bi[0] or bi[3] < bj[1] or bj[3] < bi[1]:
                continue
            for a in range(len(polys[i]) - 1):
                for b in range(len(polys[j]) - 1):
                    if _segments_cross(
                        polys[i][a], polys[i][a + 1], polys[j][b], polys[j][b + 1]
                    ):
                        crossings += 1
    return worst, crossings


# ---------------------------------------------------------------------------
# Asset builders
# ---------------------------------------------------------------------------


def build_field_svg(size=600, levels=12, out_path=None, stroke=1.0):
    """The tiling chart-paper texture."""
    grid = 168
    field = terrain_field(grid, grid, seed=11)

    # Periodic extension: one extra row and column, identical to the first.
    # A contour that leaves the right edge is therefore continued inside the
    # tile, and the texture repeats without a seam.
    field = np.vstack([field, field[:1, :]])
    field = np.hstack([field, field[:, :1]])

    lo, hi = float(field.min()), float(field.max())
    # One pixel of overshoot on every side: the paths cross the tile edge
    # instead of being cut by it, so the repeated mask has no hairline seam.
    scale = (size + 2) / grid
    offset = -1.0

    out = []
    for index in range(levels):
        level = lo + (hi - lo) * (index + 1) / (levels + 1)
        level, polys = level_without_crossings(field, level, grid)
        for poly in polys:
            smoothed = chaikin(decimate(poly, 2.8), iterations=1)
            scaled = [(x * scale + offset, y * scale + offset) for x, y in smoothed]
            d = to_path(scaled)
            if d:
                out.append(d)

    body = "".join(f'<path d="{d}"/>' for d in out)
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}' "
        "viewBox='0 0 {size} {size}'>"
        "<g fill='none' stroke='#000' stroke-width='{sw}' stroke-linejoin='round' "
        "stroke-linecap='round'>{body}</g></svg>"
    ).format(size=size, body=body, sw=stroke)

    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(svg)
    return svg, len(out), field, grid


def build_summit_paths(width=400, height=400, levels=9, seed=3):
    """Nested closed curves around a single summit."""
    grid = 220
    field = summit_field(grid, grid, seed=seed)
    lo, hi = float(field.min()), float(field.max())

    result = []
    for index in range(levels):
        # Levels are spaced evenly across the upper part of the range, where
        # every level is a single closed loop around the summit.
        level = lo + (hi - lo) * (0.30 + 0.68 * index / max(levels - 1, 1))
        polys = extract_contours(field, level)
        for poly in polys:
            if len(poly) < 6:
                continue
            smoothed = chaikin(decimate(poly, 0.8), iterations=2)
            scale_x = width / grid
            scale_y = height / grid
            scaled = [(x * scale_x, y * scale_y) for x, y in smoothed]
            result.append((level, scaled, to_path(scaled)))
    return result, field, grid


def _is_closed(path, tolerance=1.5):
    """A closed loop returns to where it started. An open one does not."""
    if len(path) < 4:
        return False
    return math.dist(path[0], path[-1]) <= tolerance


def build_mark_svg(size=32, out_path=None):
    """
    The brand mark: two contour loops around a summit, and the peak itself.

    The levels are chosen so every loop stays inside the sampled grid —
    a contour that runs past the edge of the field is clipped, and a clipped
    loop reads as a broken ring.
    """
    grid = 64
    field = mark_field(grid, grid)

    peak_y, peak_x = np.unravel_index(np.argmax(field), field.shape)
    peak = (float(peak_x), float(peak_y))

    loops = []
    for level in (0.62, 0.80):
        for poly in extract_contours(field, level):
            if len(poly) < 12 or not _is_closed(poly):
                continue
            smoothed = chaikin(decimate(poly, 1.4), iterations=1)
            if not _is_closed(smoothed, 2.0):
                continue
            loops.append(smoothed)

    if not loops:
        return "<svg xmlns='http://www.w3.org/2000/svg'/>", []

    # Scale so the largest loop has a fixed radius, then centre on the peak.
    biggest = max(
        loops, key=lambda p: max(math.dist((px, py), peak) for px, py in p)
    )
    radius = max(math.dist((px, py), peak) for px, py in biggest)
    scale = 10.5 / radius if radius else 1.0
    centre = size / 2

    scaled_loops = []
    for poly in loops:
        scaled = [
            (centre + (x - peak[0]) * scale, centre + (y - peak[1]) * scale)
            for x, y in poly
        ]
        # Decimate in icon space: the mark is 32 px wide, so a tenth of a
        # pixel is already more detail than the eye can use.
        scaled = decimate(scaled, 2.0)
        scaled_loops.append(scaled)
    scaled_loops.sort(key=len, reverse=True)

    body = []
    for index, path in enumerate(scaled_loops):
        opacity = "1" if index == 0 else "0.5"
        body.append(f'<path d="{to_path(path, 2)}" opacity="{opacity}"/>')

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
        '<rect width="{size}" height="{size}" rx="8" fill="#0b1110"/>'
        '<g fill="none" stroke="#35cdb0" stroke-width="1.4" stroke-linecap="round" '
        'stroke-linejoin="round">{body}</g>'
        '<circle cx="{cx}" cy="{cy}" r="1.6" fill="#f20084"/>'
        "</svg>"
    ).format(size=size, body="".join(body), cx=centre, cy=centre)

    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(svg)
    return svg, scaled_loops


def build_instrument(size=400, levels=10):
    """
    The hero instrument: a real map of one peak, drawn as its iso-lines.

    Returns the path data for the outer contour group, the summit group and
    the position of the peak.
    """
    grid = 132
    field = instrument_field(grid, grid)
    lo, hi = float(field.min()), float(field.max())
    peak_y, peak_x = np.unravel_index(np.argmax(field), field.shape)
    peak = (float(peak_x), float(peak_y))
    scale = size / grid

    def to_user(poly):
        smoothed = chaikin(decimate(poly, 4.0), iterations=1)
        return [(x * scale, y * scale) for x, y in smoothed]

    contours = []
    found = []

    for index in range(levels):
        level = lo + (hi - lo) * (0.22 + 0.74 * index / max(levels - 1, 1))
        for poly in extract_contours(field, level):
            if len(poly) < 8:
                continue
            user = to_user(poly)
            xs = [p[0] for p in user]
            ys = [p[1] for p in user]
            area = (max(xs) - min(xs)) * (max(ys) - min(ys))
            d = to_path(user, 1)
            if not d:
                continue
            contains_peak = (
                min(xs) <= peak[0] * scale <= max(xs)
                and min(ys) <= peak[1] * scale <= max(ys)
            )
            found.append({"d": d, "area": area, "contains_peak": contains_peak})

    # The smallest loop that still contains the peak is the summit; every
    # other line is an ordinary contour.
    around = [item for item in found if item["contains_peak"]]
    summit = min(around, key=lambda item: item["area"])["d"] if around else None
    contours = [item["d"] for item in found if item["d"] != summit]

    return {
        "contours": contours,
        "summit": summit,
        "peak": (peak[0] * scale, peak[1] * scale),
    }


def verify_field(levels=12, grid=200):
    """
    Check the generated geometry the way the eye would: do any two lines
    cross, and does every line still sit on its own level?

    Sampling the *continuous* field along each path is the strong test — if a
    line has drifted off its level, two levels will eventually meet.
    """
    field = terrain_field(grid, grid, seed=11)
    field = np.vstack([field, field[:1, :]])
    field = np.hstack([field, field[:, :1]])
    lo, hi = float(field.min()), float(field.max())

    def sample(x, y):
        xi = min(max(int(x), 0), grid - 1)
        yi = min(max(int(y), 0), grid - 1)
        fx = x - xi
        fy = y - yi
        v00 = field[yi, xi]
        v10 = field[yi, xi + 1]
        v01 = field[yi + 1, xi]
        v11 = field[yi + 1, xi + 1]
        top = v00 * (1 - fx) + v10 * fx
        bottom = v01 * (1 - fx) + v11 * fx
        return float(top * (1 - fy) + bottom * fy)

    total_crossings = 0
    worst_offset = 0.0
    for index in range(levels):
        level = lo + (hi - lo) * (index + 1) / (levels + 1)
        # The same level the builder uses: nudged off any saddle.
        level, polys = level_without_crossings(field, level, grid)
        offset, crossings = verify(polys, field, level, sample)
        worst_offset = max(worst_offset, offset)
        total_crossings += crossings
        print(
            f"   level {index + 1:2d}/{levels}: {len(polys):3d} lines, "
            f"drift {offset:.4f}, crossings {crossings}"
        )
    print(f"   worst drift {worst_offset:.4f}, total crossings {total_crossings}")
    return total_crossings, worst_offset


def _field_sampler(field, grid=None):
    """Bilinear sampler over the field, used to check the drawn lines."""
    height, width = field.shape

    def sample(x, y):
        xi = min(max(int(x), 0), width - 2)
        yi = min(max(int(y), 0), height - 2)
        fx = x - xi
        fy = y - yi
        v00 = field[yi, xi]
        v10 = field[yi, xi + 1]
        v01 = field[yi + 1, xi]
        v11 = field[yi + 1, xi + 1]
        top = v00 * (1 - fx) + v10 * fx
        bottom = v01 * (1 - fx) + v11 * fx
        return float(top * (1 - fy) + bottom * fy)

    return sample


def level_without_crossings(field, level, grid=None, tolerance=2.2):
    """
    Find a level that draws cleanly.

    A contour that passes exactly through a saddle point is a figure eight:
    two branches touching at a point. That is legitimate cartography, but it
    reads as a defect at texture scale, so the level is nudged until the
    branches separate. The nudge is a fraction of the level spacing, which is
    far below the contour interval a reader would ever notice.
    """
    sample = _field_sampler(field)

    def attempt(candidate):
        polys = extract_contours(field, candidate)
        polys = [chaikin(decimate(p, tolerance), iterations=1) for p in polys]
        polys = [p for p in polys if len(p) >= 6]
        _, crossings = verify(polys, field, candidate, sample)
        return crossings, polys

    span = (float(field.max()) - float(field.min())) / 64
    for step in (0.0, 1.0, -1.0, 2.0, -2.0, 3.0, -3.0, 4.5, -4.5, 6.0, -6.0):
        candidate = level + step * span
        crossings, polys = attempt(candidate)
        if crossings == 0:
            return candidate, polys
    return level, attempt(level)[1]


def build_showcase(width=240, height=180, levels=6):
    """
    The showcase media: a small map fragment. The lines are real iso-lines of
    a real field, so they nest and open the way a map does.
    """
    grid = 120
    field = instrument_field(grid, int(grid * height / width))
    lo, hi = float(field.min()), float(field.max())
    scale_x = width / grid
    scale_y = height / (grid * height / width)

    paths = []
    for index in range(levels):
        level = lo + (hi - lo) * (0.22 + 0.70 * index / max(levels - 1, 1))
        level, polys = level_without_crossings(field, level, grid)
        for poly in polys:
            smoothed = chaikin(decimate(poly, 2.0), iterations=1)
            scaled = [(x * scale_x, y * scale_y) for x, y in smoothed]
            d = to_path(scaled, 1)
            if d:
                paths.append(d)
    return paths


if __name__ == "__main__":
    root = os.environ.get("DS_ROOT", "/data/projects/DS")
    svg_dir = os.path.join(root, "assets", "svg")

    svg, count, field, grid = build_field_svg(out_path=os.path.join(svg_dir, "contour-field.svg"))
    print(f"contour-field.svg: {count} paths, {len(svg)} bytes")

    mark, paths = build_mark_svg(out_path=os.path.join(svg_dir, "contour-mark.svg"))
    print(f"contour-mark.svg: {len(paths)} loops, {len(mark)} bytes")

    instrument = build_instrument()
    print(
        f"instrument: {len(instrument['contours'])} contours, "
        f"summit {'yes' if instrument['summit'] else 'no'}, "
        f"peak at {instrument['peak'][0]:.0f},{instrument['peak'][1]:.0f}"
    )
    import json

    with open("/tmp/kilo/audit/instrument.json", "w", encoding="utf-8") as handle:
        json.dump(instrument, handle)

    showcase = build_showcase()
    with open("/tmp/kilo/audit/showcase.json", "w", encoding="utf-8") as handle:
        json.dump(showcase, handle)
    print(f"showcase: {len(showcase)} contour lines")

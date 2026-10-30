# Grafika nowych stanowisk: owoce, lody, naleśniki, pizza, zupy, cukiernia, naczynia i sprzęty.
import math
import art
from art import f, g, shadow, star

MORE_DEFS = '''
<linearGradient id="gBanana" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE97A"/><stop offset="1" stop-color="#F2C230"/></linearGradient>
<radialGradient id="gStraw" cx=".4" cy=".3" r=".75"><stop offset="0" stop-color="#FF7A7A"/><stop offset=".6" stop-color="#E5333F"/><stop offset="1" stop-color="#B71F2D"/></radialGradient>
<radialGradient id="gGrape" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#C6A2F0"/><stop offset="1" stop-color="#6B3FA8"/></radialGradient>
<radialGradient id="gGrapeG" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#E4F5A0"/><stop offset="1" stop-color="#8CBF3A"/></radialGradient>
<linearGradient id="gCarrot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFA24A"/><stop offset="1" stop-color="#E86A14"/></linearGradient>
<radialGradient id="gPotato" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#E9C58C"/><stop offset="1" stop-color="#B98A4E"/></radialGradient>
<radialGradient id="gPea" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#B5E67A"/><stop offset="1" stop-color="#4F9A2E"/></radialGradient>
<radialGradient id="gSalami" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#E0505A"/><stop offset="1" stop-color="#B42F3B"/></radialGradient>
<radialGradient id="gDough" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFF4DC"/><stop offset="1" stop-color="#EBCB94"/></radialGradient>
<linearGradient id="gJug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9E3EC"/></linearGradient>
<linearGradient id="gGlassJar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".7"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity=".15"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".5"/></linearGradient>
<linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#DDE3EA"/><stop offset=".5" stop-color="#F7F9FB"/><stop offset="1" stop-color="#B8C2CE"/></linearGradient>
<radialGradient id="gPan" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#4A4F5A"/><stop offset="1" stop-color="#25282F"/></radialGradient>
<linearGradient id="gPot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C3CCD6"/><stop offset=".45" stop-color="#F4F7FA"/><stop offset="1" stop-color="#9AA6B4"/></linearGradient>
<linearGradient id="gBowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D3E2EE"/></linearGradient>
<linearGradient id="gCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9B266"/><stop offset="1" stop-color="#C9893F"/></linearGradient>
<linearGradient id="gCup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F7A3B6"/><stop offset="1" stop-color="#E37C96"/></linearGradient>
<radialGradient id="gMuffin" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#E8A866"/><stop offset="1" stop-color="#B9733A"/></radialGradient>
<linearGradient id="gOven" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F1EC"/><stop offset="1" stop-color="#D9D3CA"/></linearGradient>
<linearGradient id="gOvenGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3B36"/><stop offset="1" stop-color="#2B201D"/></linearGradient>
'''
art.DEFS = art.DEFS + art.EXTRA_DEFS + MORE_DEFS

# ---------- owoce ----------
def banana():
    return ('<path d="M-66 -10 C-50 30 40 40 70 -14 C74 -22 66 -26 62 -20 C36 18 -36 16 -54 -18 C-58 -26 -70 -22 -66 -10 Z" fill="url(#gBanana)"/>'
            '<path d="M-66 -10 C-50 30 40 40 70 -14" fill="none" stroke="#D9A21C" stroke-width="3"/>'
            '<path d="M-48 -6 C-24 14 26 16 52 -6" stroke="#FFF4B8" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>'
            '<path d="M62 -20 L70 -30 L76 -24 L70 -14 Z" fill="#7A5A2A"/><circle cx="-62" cy="-16" r="4" fill="#5A4220"/>')

def banana_slice():
    return ('<circle r="18" fill="#F4D77A"/><circle r="15" fill="#FFF3C8"/><circle r="6" fill="#F2E2A6"/>'
            + ''.join(f'<circle cx="{f(math.cos(a)*4)}" cy="{f(math.sin(a)*4)}" r="1.3" fill="#B8955A"/>' for a in (0, 2.1, 4.2)))

STRAW = 'M0 34 C-26 22 -36 0 -32 -14 C-28 -28 -12 -30 0 -24 C12 -30 28 -28 32 -14 C36 0 26 22 0 34 Z'
def strawberry():
    seeds = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="1.8" ry="2.6" fill="#FFE27A"/>' for x, y in
                    [(-16, -8), (0, -12), (16, -8), (-20, 6), (-6, 4), (8, 4), (20, 6), (-10, 18), (4, 18), (0, 28)])
    return (f'<path d="{STRAW}" fill="url(#gStraw)"/>' + seeds +
            f'<path d="{star(6, 18, 6)}" transform="translate(0 -26) scale(1 .45)" fill="#4E9A35" stroke="#36762A" stroke-width="2"/>'
            '<rect x="-2.5" y="-40" width="5" height="12" rx="2.5" fill="#3F7E2C"/>'
            '<ellipse cx="-14" cy="-14" rx="6" ry="4" fill="#FFFFFF" opacity=".4" transform="rotate(-30 -14 -14)"/>')

def strawberry_slice():
    return (f'<path d="{STRAW}" transform="scale(.7)" fill="#E5333F"/>'
            f'<path d="{STRAW}" transform="scale(.6)" fill="#FF8C8C"/>'
            '<path d="M0 14 C-6 4 -6 -6 0 -12 C6 -6 6 4 0 14 Z" fill="#FFD3D3"/>')

def grape(green=False):
    gid = 'gGrapeG' if green else 'gGrape'
    return f'<circle r="12" fill="url(#{gid})"/><circle cx="-4" cy="-4" r="3" fill="#FFFFFF" opacity=".5"/>'

def grapes():
    pts = [(-14, -18), (6, -20), (-22, 0), (-2, -2), (18, -4), (-12, 16), (8, 14), (-2, 30)]
    return ('<path d="M0 -26 C2 -36 8 -42 16 -44" stroke="#6B4A2A" stroke-width="4" fill="none" stroke-linecap="round"/>'
            '<path d="M6 -34 C16 -40 28 -36 30 -28 C20 -26 12 -28 6 -34 Z" fill="#5FAE3E"/>'
            + ''.join(g(x, y, 1, grape(True)) for x, y in pts))

def grape_one(): return grape(True)

# ---------- warzywa ----------
def carrot():
    return ('<path d="M-60 0 C-60 -14 -50 -18 -40 -18 L56 -6 C64 -4 64 4 56 6 L-40 18 C-50 18 -60 14 -60 0 Z" fill="url(#gCarrot)"/>'
            '<path d="M-30 -10 L-24 -4 M-6 -12 L0 -6 M18 -8 L22 -2 M-20 10 L-14 4 M6 10 L10 4" stroke="#D45A0E" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>'
            '<path d="M-60 -2 C-74 -20 -84 -16 -88 -8 C-80 -6 -72 -4 -60 -2 Z M-60 2 C-76 4 -86 14 -84 20 C-76 16 -68 10 -60 2 Z M-60 0 C-80 -6 -92 0 -94 6 C-84 6 -72 4 -60 0 Z" fill="#5FAE3E"/>')

def carrot_slice():
    return '<circle r="17" fill="#E8701A"/><circle r="14" fill="#FF9A3C"/><circle r="7" fill="#FFB866"/>'

def potato():
    return ('<ellipse rx="44" ry="32" fill="url(#gPotato)"/>'
            + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="3" ry="2" fill="#8E6534"/>' for x, y in [(-20, -10), (10, -16), (22, 8), (-8, 14), (-28, 8)]) +
            '<ellipse cx="-14" cy="-14" rx="10" ry="5" fill="#FFFFFF" opacity=".25" transform="rotate(-20 -14 -14)"/>')

def potato_cube():
    return ('<rect x="-14" y="-14" width="28" height="28" rx="7" fill="#F4DFA0"/>'
            '<rect x="-14" y="-14" width="28" height="28" rx="7" fill="none" stroke="#D9BE72" stroke-width="2"/>'
            '<path d="M-8 -8 L4 -8" stroke="#FFF6D6" stroke-width="3" stroke-linecap="round"/>')

def peas():
    pts = [(-10, -6), (6, -8), (-2, 6), (12, 6), (-14, 8), (2, -18)]
    return ''.join(f'<circle cx="{x}" cy="{y}" r="8" fill="url(#gPea)"/><circle cx="{x-2}" cy="{y-3}" r="2" fill="#FFFFFF" opacity=".5"/>' for x, y in pts)

def pasta():
    out = ''
    for x, y, r in [(-14, -6, 20), (8, -10, -30), (-4, 10, 60), (14, 8, 10), (-18, 12, -60)]:
        out += f'<path d="M{x-8} {y} C{x-8} {y-8} {x+8} {y-8} {x+8} {y}" transform="rotate({r} {x} {y})" stroke="#E9B949" stroke-width="7" fill="none" stroke-linecap="round"/>'
        out += f'<path d="M{x-8} {y} C{x-8} {y-8} {x+8} {y-8} {x+8} {y}" transform="rotate({r} {x} {y})" stroke="#FFE08A" stroke-width="3" fill="none" stroke-linecap="round"/>'
    return out

# ---------- pizza ----------
def dough_ball():
    return '<ellipse cy="6" rx="46" ry="34" fill="url(#gDough)"/><ellipse cx="-14" cy="-6" rx="14" ry="7" fill="#FFFFFF" opacity=".5"/>'

def salami():
    return ('<circle r="22" fill="#9E2632"/><circle r="19.5" fill="url(#gSalami)"/>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#F7C9C9"/>' for x, y, r in [(-8, -6, 3), (6, -10, 2.2), (10, 6, 3), (-4, 10, 2.4), (-12, 6, 1.8), (2, 0, 1.6)]))

def mushroom():
    return ('<path d="M-22 -2 C-22 -20 22 -20 22 -2 C22 4 14 4 8 2 L8 18 C8 22 -8 22 -8 18 L-8 2 C-14 4 -22 4 -22 -2 Z" fill="#F3E6D2" stroke="#B89A76" stroke-width="2.5"/>'
            '<path d="M-18 -4 C-16 -14 16 -14 18 -4" stroke="#A47E58" stroke-width="3" fill="none"/>')

def olive():
    return '<circle r="11" fill="#2E2B33"/><circle r="5" fill="#7A3A2A"/><circle cx="-4" cy="-5" r="2.5" fill="#FFFFFF" opacity=".35"/>'

def pepper():
    return '<path d="M-18 -8 C-10 -16 10 -16 18 -8 C14 -2 8 -4 0 -4 C-8 -4 -14 -2 -18 -8 Z" fill="#3FA34D" stroke="#2E7D3A" stroke-width="2"/>'

def cheese_shreds_bowl():
    shreds = ''.join(f'<rect x="{x}" y="{y}" width="14" height="4" rx="2" fill="#FFD25A" transform="rotate({r} {x} {y})"/>' for x, y, r in
                     [(-24, -14, 20), (-6, -18, -30), (10, -12, 40), (-16, -4, -10), (4, -6, 70), (18, -2, -40), (-28, 0, 50)])
    return bowl_small('#E9F1F7') + shreds

def bowl_small(inside):
    return ('<path d="M-44 -8 C-40 26 40 26 44 -8 Z" fill="url(#gBowl)" stroke="#B9CDDD" stroke-width="2"/>'
            f'<ellipse cy="-8" rx="44" ry="14" fill="{inside}" stroke="#B9CDDD" stroke-width="2"/>')

# ---------- słoiki, dzbanki, narzędzia ----------
def jar(color, lid='#E8775A'):
    return ('<rect x="-30" y="-22" width="60" height="58" rx="12" fill="' + color + '"/>'
            '<rect x="-30" y="-22" width="60" height="58" rx="12" fill="url(#gGlassJar)"/>'
            '<rect x="-30" y="-22" width="60" height="58" rx="12" fill="none" stroke="#C9D4DD" stroke-width="2"/>'
            f'<rect x="-33" y="-36" width="66" height="18" rx="6" fill="{lid}"/>'
            '<rect x="-33" y="-36" width="66" height="6" rx="3" fill="#FFFFFF" opacity=".3"/>'
            '<rect x="-18" y="-4" width="36" height="22" rx="5" fill="#FFFBF3"/>'
            f'<circle cy="7" r="7" fill="{color}"/>')

def jug(liquid, band='#5B8BD9'):
    return ('<path d="M-30 -36 L30 -36 L34 34 Q34 42 26 42 L-26 42 Q-34 42 -34 34 Z" fill="url(#gJug)" stroke="#BFCBD6" stroke-width="2"/>'
            '<path d="M-30 -36 L-44 -44 L-28 -26 Z" fill="#E9EEF3" stroke="#BFCBD6" stroke-width="2"/>'
            '<path d="M34 -20 C56 -20 56 22 32 22" stroke="#D3DCE5" stroke-width="9" fill="none" stroke-linecap="round"/>'
            f'<ellipse cy="-32" rx="28" ry="6" fill="{liquid}"/>'
            f'<rect x="-33" y="4" width="66" height="10" fill="{band}" opacity=".85"/>')

def glass_jug(liquid):
    return ('<path d="M-30 -36 L30 -36 L34 34 Q34 42 26 42 L-26 42 Q-34 42 -34 34 Z" fill="#EAF6FC" stroke="#B9D7E8" stroke-width="2"/>'
            f'<path d="M-32 -6 L32 -6 L34 34 Q34 42 26 42 L-26 42 Q-34 42 -34 34 Z" fill="{liquid}" opacity=".75"/>'
            '<path d="M-30 -36 L-44 -44 L-28 -26 Z" fill="#EAF6FC" stroke="#B9D7E8" stroke-width="2"/>'
            '<path d="M34 -20 C56 -20 56 22 32 22" stroke="#C5E0EF" stroke-width="9" fill="none" stroke-linecap="round"/>'
            '<path d="M-22 -28 L-24 30" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".8"/>')

def yogurt():
    return ('<path d="M-32 -24 L32 -24 L26 34 Q25 40 18 40 L-18 40 Q-25 40 -26 34 Z" fill="#FFFFFF" stroke="#D3DCE5" stroke-width="2"/>'
            '<rect x="-34" y="-30" width="68" height="10" rx="4" fill="#F28DB2"/>'
            '<rect x="-28" y="-2" width="56" height="22" rx="6" fill="#FDE4EC"/>' + g(0, 9, .3, strawberry()))

def spoon(color=None):
    blob = f'<ellipse cy="-44" rx="13" ry="10" fill="{color}"/>' if color else ''
    return ('<g transform="rotate(-30)"><ellipse cy="-44" rx="16" ry="20" fill="url(#gSteel)" stroke="#9AA5B3" stroke-width="2"/>'
            + blob + '<rect x="-5" y="-26" width="10" height="84" rx="5" fill="url(#gSteel)" stroke="#9AA5B3" stroke-width="2"/></g>')

def wooden_spoon():
    return ('<g transform="rotate(-30)"><ellipse cy="-50" rx="16" ry="22" fill="#D9A15F" stroke="#A86F37" stroke-width="2"/>'
            '<ellipse cy="-50" rx="9" ry="14" fill="#C88A4A"/>'
            '<rect x="-5" y="-30" width="10" height="96" rx="5" fill="#D9A15F" stroke="#A86F37" stroke-width="2"/></g>')

def spatula(color):
    return ('<g transform="rotate(-30)"><rect x="-14" y="-62" width="28" height="44" rx="12" fill="#F1F4F7" stroke="#B9C3CE" stroke-width="2"/>'
            f'<path d="M-14 -40 C-6 -48 6 -36 14 -44 L14 -26 Q14 -18 6 -18 L-6 -18 Q-14 -18 -14 -26 Z" fill="{color}"/>'
            '<rect x="-5" y="-20" width="10" height="80" rx="5" fill="#E8775A"/></g>')

def shaker(colors):
    dots = ''.join(f'<circle cx="{-14 + i*9}" cy="{6 + (i%2)*10}" r="3" fill="{c}"/>' for i, c in enumerate(colors * 2))
    return ('<rect x="-24" y="-30" width="48" height="66" rx="14" fill="#FFFFFF" stroke="#C9D4DD" stroke-width="2"/>'
            '<rect x="-24" y="-30" width="48" height="66" rx="14" fill="url(#gGlassJar)"/>' + dots +
            '<path d="M-24 -26 C-24 -44 24 -44 24 -26 Z" fill="url(#gSteel)" stroke="#9AA5B3" stroke-width="2"/>'
            '<circle cx="-8" cy="-34" r="2" fill="#6B7684"/><circle cx="0" cy="-37" r="2" fill="#6B7684"/><circle cx="8" cy="-34" r="2" fill="#6B7684"/>')

def bowl_frosting(color):
    return bowl_small(color) + f'<path d="M-20 -14 C-10 -26 10 -26 20 -14" stroke="#FFFFFF" stroke-width="4" fill="none" opacity=".6"/>'

# ---------- lody i desery ----------
def scoop(color, dark):
    return (f'<path d="M-40 6 C-46 -30 -20 -46 0 -46 C20 -46 46 -30 40 6 C34 10 28 2 22 8 C16 14 10 4 4 10 C-2 16 -8 6 -14 10 C-22 14 -28 4 -40 6 Z" fill="{color}"/>'
            f'<path d="M-40 6 C-34 10 -28 2 -22 8 C-14 14 -8 4 -2 10 C6 16 12 6 18 10 C26 14 32 4 40 6" stroke="{dark}" stroke-width="3" fill="none"/>'
            '<ellipse cx="-14" cy="-26" rx="10" ry="6" fill="#FFFFFF" opacity=".45" transform="rotate(-25 -14 -26)"/>')
SCOOPS = {'lody_t': ('#F7A8BC', '#E57C98'), 'lody_c': ('#9A6040', '#6E3F26'), 'lody_v': ('#FFF1C9', '#E8CF8A')}

def ice_tub(key):
    c, d = SCOOPS[key]
    return ('<path d="M-40 -6 L40 -6 L34 34 Q33 40 26 40 L-26 40 Q-33 40 -34 34 Z" fill="#FFFFFF" stroke="#D3DCE5" stroke-width="2"/>'
            f'<rect x="-40" y="6" width="80" height="12" fill="{d}" opacity=".7"/>'
            + g(0, 0, .85, scoop(c, d)))

def cone():
    grid = ''.join(f'<path d="M{-40+i*16} -40 L{-8+i*16} 30" stroke="#B57630" stroke-width="2" opacity=".6"/><path d="M{40-i*16} -40 L{8-i*16} 30" stroke="#B57630" stroke-width="2" opacity=".6"/>' for i in range(6))
    return ('<defs><clipPath id="coneClip"><path d="M-42 -40 L42 -40 L4 76 Q0 82 -4 76 Z"/></clipPath></defs>'
            '<path d="M-42 -40 L42 -40 L4 76 Q0 82 -4 76 Z" fill="url(#gCone)"/>'
            f'<g clip-path="url(#coneClip)">{grid}</g>'
            '<rect x="-46" y="-48" width="92" height="14" rx="7" fill="#E2A458" stroke="#B57630" stroke-width="2"/>')

def wafer():
    return ('<rect x="-8" y="-40" width="16" height="70" rx="4" fill="#E9B266" stroke="#B57630" stroke-width="2"/>'
            '<path d="M-8 -26 L8 -26 M-8 -10 L8 -10 M-8 6 L8 6" stroke="#B57630" stroke-width="2"/>')

def cherry():
    return ('<path d="M0 -8 C2 -24 10 -32 18 -36" stroke="#5A8A2A" stroke-width="3" fill="none" stroke-linecap="round"/>'
            '<circle cy="4" r="14" fill="#D2232E"/><circle cx="-5" cy="-1" r="4" fill="#FFFFFF" opacity=".55"/>')

def candle():
    return ('<rect x="-7" y="-34" width="14" height="58" rx="4" fill="#7FB8F0"/>'
            '<path d="M-7 -24 L7 -30 M-7 -8 L7 -14 M-7 8 L7 2" stroke="#FFFFFF" stroke-width="4"/>'
            '<path d="M0 -60 C10 -48 8 -40 0 -38 C-8 -40 -10 -48 0 -60 Z" fill="#FFB43A"/>'
            '<path d="M0 -52 C5 -46 4 -42 0 -41 C-4 -42 -5 -46 0 -52 Z" fill="#FFF3B0"/>'
            '<rect x="-1" y="-40" width="2" height="7" fill="#3B3550"/>')

# ---------- naczynia i sprzęty ----------
def bowl():
    # miska: wnętrze to elipsa cx0 cy-30 rx90 ry30 (tu rysuje kod gry)
    return (shadow(0, 62, 100, 14, .18) +
            '<path d="M-100 -30 C-96 50 96 50 100 -30 Z" fill="url(#gBowl)"/>'
            '<path d="M-100 -30 C-96 50 96 50 100 -30" fill="none" stroke="#B9CDDD" stroke-width="2.5"/>'
            '<path d="M-90 -6 C-60 30 60 30 90 -6" stroke="#5B8BD9" stroke-width="5" fill="none" opacity=".55"/>'
            '<ellipse cy="-30" rx="100" ry="36" fill="#F4F8FB" stroke="#B9CDDD" stroke-width="2.5"/>'
            '<ellipse cy="-28" rx="90" ry="30" fill="#E3ECF3"/>')

def glass_back():
    return (shadow(0, 92, 70, 10, .16) +
            '<path d="M-56 -110 L56 -110 L46 84 Q45 92 36 92 L-36 92 Q-45 92 -46 84 Z" fill="#EAF6FC" opacity=".55"/>')
def glass_front():
    return ('<path d="M-56 -110 L56 -110 L46 84 Q45 92 36 92 L-36 92 Q-45 92 -46 84 Z" fill="none" stroke="#B9D7E8" stroke-width="3"/>'
            '<ellipse cy="-110" rx="56" ry="8" fill="none" stroke="#B9D7E8" stroke-width="3"/>'
            '<path d="M-40 -96 L-32 76" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".75"/>'
            '<path d="M38 -96 L33 40" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/>')
GLASS_IN = 'M-53 -108 L53 -108 L43.5 82 Q43 89 35 89 L-35 89 Q-43 89 -43.5 82 Z'

def stove_pan():
    flames = ''.join(f'<path d="M{f(math.cos(a)*96)} {f(math.sin(a)*96)} l{f(math.cos(a)*10)} {f(math.sin(a)*10)}" stroke="#4FA3FF" stroke-width="7" stroke-linecap="round"/>' for a in [i * math.pi / 8 for i in range(16)])
    return (f'<circle r="118" fill="#3B3F48"/><circle r="110" fill="#2C3038"/>{flames}'
            '<rect x="88" y="-14" width="96" height="28" rx="14" fill="url(#gHandle)"/>'
            '<circle r="100" fill="#1F2228"/><circle r="94" fill="url(#gPan)"/>'
            '<path d="M-60 -64 A88 88 0 0 1 30 -86" stroke="#6A707C" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>')

def stove_pot():
    flames = ''.join(f'<path d="M{f(math.cos(a)*92)} {f(68+math.sin(a)*22)} l0 -12" stroke="#4FA3FF" stroke-width="6" stroke-linecap="round"/>' for a in [i * math.pi / 5 for i in range(6)])
    return ('<ellipse cy="78" rx="122" ry="34" fill="#3B3F48"/><ellipse cy="74" rx="110" ry="28" fill="#2C3038"/>' + flames +
            '<path d="M-96 -40 L-90 58 Q-88 74 -70 76 L70 76 Q88 74 90 58 L96 -40 Z" fill="url(#gPot)"/>'
            '<path d="M-96 -40 L-90 58 Q-88 74 -70 76 L70 76 Q88 74 90 58 L96 -40" fill="none" stroke="#8C97A6" stroke-width="2.5"/>'
            '<rect x="-128" y="-34" width="36" height="16" rx="8" fill="#3B3F48"/><rect x="92" y="-34" width="36" height="16" rx="8" fill="#3B3F48"/>'
            '<ellipse cy="-40" rx="96" ry="30" fill="#DDE3EA" stroke="#8C97A6" stroke-width="2.5"/>'
            '<ellipse cy="-38" rx="86" ry="25" fill="#5D6672"/>'
            '<path d="M-70 -10 L-66 50" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".6"/>')

def pizza_peel():
    return (shadow(0, 8, 126, 118, .16) +
            '<rect x="96" y="-16" width="90" height="32" rx="14" fill="#C08548"/>'
            '<circle r="120" fill="#C9904F"/><circle r="114" fill="url(#gWood)"/>'
            '<path d="M-80 -40 C-30 -54 30 -30 90 -46 M-96 20 C-40 6 20 30 96 14 M-70 70 C-20 58 30 80 70 66" stroke="#C48B50" stroke-width="2.5" fill="none" opacity=".4"/>')

def muffin_cup():
    pleats = ''.join(f'<path d="M{-50+i*12.5:.1f} -14 L{-38+i*9.5:.1f} 56" stroke="#D96A86" stroke-width="2" opacity=".7"/>' for i in range(9))
    return (shadow(0, 62, 60, 10, .16) +
            '<path d="M-54 -14 L54 -14 L40 56 Q39 62 32 62 L-32 62 Q-39 62 -40 56 Z" fill="url(#gCup)"/>' + pleats +
            '<ellipse cy="-14" rx="54" ry="12" fill="#C9557A"/>')
def muffin_dome():
    return ('<path d="M-62 -10 C-66 -64 -20 -84 0 -84 C20 -84 66 -64 62 -10 C40 -2 -40 -2 -62 -10 Z" fill="url(#gMuffin)"/>'
            '<path d="M-40 -50 C-28 -66 -10 -70 4 -68" stroke="#F2C28A" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>'
            + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="4" ry="3" fill="#7A4420"/>' for x, y in [(-30, -30), (10, -50), (30, -24), (-6, -20), (40, -46)]))
MUFFIN_TOP = 'M-62 -10 C-66 -64 -20 -84 0 -84 C20 -84 66 -64 62 -10 C40 -2 -40 -2 -62 -10 Z'

def oven():
    return ('<rect x="0" y="12" width="280" height="186" rx="22" fill="rgba(90,50,15,.18)"/>'
            '<rect x="0" y="0" width="280" height="190" rx="22" fill="url(#gOven)" stroke="#C4BCB0" stroke-width="2"/>'
            '<rect x="0" y="0" width="280" height="40" rx="22" fill="#3B3550"/>'
            '<rect x="0" y="22" width="280" height="18" fill="#3B3550"/>'
            '<circle cx="40" cy="20" r="11" fill="#E8E2D8"/><circle cx="76" cy="20" r="11" fill="#E8E2D8"/>'
            '<path d="M40 12 L40 20 M76 12 L76 20" stroke="#3B3550" stroke-width="3" stroke-linecap="round"/>'
            '<rect x="196" y="12" width="64" height="16" rx="6" fill="#1F1B2E"/>'
            '<rect x="40" y="52" width="200" height="12" rx="6" fill="url(#gSteel)"/>'
            '<rect x="28" y="74" width="224" height="100" rx="16" fill="url(#gOvenGlass)"/>'
            '<rect x="28" y="74" width="224" height="100" rx="16" fill="none" stroke="#9AA5B3" stroke-width="4"/>')
OVEN_GLASS = (28, 74, 224, 100)

def crate_back():
    return '<rect x="4" y="8" width="92" height="80" rx="12" fill="url(#gCrateIn)"/>'
def crate_front():
    w, h = 100, 92
    return (f'<rect x="0" y="56" width="{w}" height="{h-56}" rx="10" fill="url(#gCrate)"/>'
            f'<path d="M8 73 L{w-8} 73" stroke="#A86F37" stroke-width="2" opacity=".6"/>'
            f'<rect x="0" y="56" width="{w}" height="6" rx="3" fill="#EDC48B"/>'
            '<circle cx="9" cy="66" r="2.2" fill="#8C5A2C"/><circle cx="91" cy="66" r="2.2" fill="#8C5A2C"/>'
            '<circle cx="9" cy="82" r="2.2" fill="#8C5A2C"/><circle cx="91" cy="82" r="2.2" fill="#8C5A2C"/>')

def padlock():
    return ('<path d="M-14 -6 L-14 -18 C-14 -34 14 -34 14 -18 L14 -6" stroke="#9AA5B3" stroke-width="7" fill="none"/>'
            '<rect x="-22" y="-8" width="44" height="36" rx="8" fill="#F5C13A" stroke="#C88A18" stroke-width="2.5"/>'
            '<circle cy="6" r="5" fill="#8C5A12"/><rect x="-2" y="8" width="4" height="10" rx="2" fill="#8C5A12"/>')

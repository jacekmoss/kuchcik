# Kształty grafiki Kuchcika (SVG). Te same co na kanwie projektowej.
import math

def f(v): return ('%.1f' % v).rstrip('0').rstrip('.')

DEFS = '''
<linearGradient id="gCrust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3A55C"/><stop offset="1" stop-color="#B26B2C"/></linearGradient>
<radialGradient id="gCrumb" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#FDF0CF"/><stop offset="1" stop-color="#EFCB86"/></radialGradient>
<linearGradient id="gButter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B8"/><stop offset="1" stop-color="#F8D765"/></linearGradient>
<radialGradient id="gDish" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CFE2F0"/></radialGradient>
<linearGradient id="gCheese" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE07A"/><stop offset="1" stop-color="#F2B032"/></linearGradient>
<linearGradient id="gCheeseSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4B83C"/><stop offset="1" stop-color="#E49A22"/></linearGradient>
<radialGradient id="gHam" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#F9BDC2"/><stop offset="1" stop-color="#E7838F"/></radialGradient>
<radialGradient id="gLettuce" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#C7EA8C"/><stop offset=".6" stop-color="#8ACB55"/><stop offset="1" stop-color="#4F9A35"/></radialGradient>
<radialGradient id="gTomato" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FF8A6B"/><stop offset=".55" stop-color="#E4422F"/><stop offset="1" stop-color="#B42A1F"/></radialGradient>
<radialGradient id="gTomFlesh" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#FFA48E"/><stop offset="1" stop-color="#EC5844"/></radialGradient>
<linearGradient id="gCuc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#69B24E"/><stop offset=".55" stop-color="#3E8A33"/><stop offset="1" stop-color="#2B6B26"/></linearGradient>
<radialGradient id="gCucFlesh" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#F3FBD6"/><stop offset="1" stop-color="#C3E388"/></radialGradient>
<linearGradient id="gWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EDBE84"/><stop offset="1" stop-color="#D49A5C"/></linearGradient>
<linearGradient id="gCrate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDAA6C"/><stop offset="1" stop-color="#C08548"/></linearGradient>
<linearGradient id="gCrateIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A4E2B"/><stop offset="1" stop-color="#9A693F"/></linearGradient>
<linearGradient id="gWorktop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1D8AE"/><stop offset="1" stop-color="#E8C894"/></linearGradient>
<linearGradient id="gBlade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F8FB"/><stop offset="1" stop-color="#AEB8C5"/></linearGradient>
<linearGradient id="gHandle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A3A2A"/><stop offset="1" stop-color="#3A241A"/></linearGradient>
<radialGradient id="gPlate" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".85" stop-color="#F3F6F8"/><stop offset="1" stop-color="#DCE3E9"/></radialGradient>
<radialGradient id="gPig" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFC9D4"/><stop offset="1" stop-color="#EE8CA3"/></radialGradient>
<radialGradient id="gCoin" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE793"/><stop offset=".7" stop-color="#F5C13A"/><stop offset="1" stop-color="#E0A222"/></radialGradient>
<pattern id="pLinen" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#F6EAD5"/><path d="M0 5H10M5 0V10" stroke="#EADBC0" stroke-width="1.2"/></pattern>
'''

BREAD = 'M-78 72 L-78 -10 C-110 -60 -70 -95 -30 -82 C-10 -100 10 -100 30 -82 C70 -95 110 -60 78 -10 L78 72 Q78 82 68 82 L-68 82 Q-78 82 -78 72 Z'
SHADOW = 'rgba(90,50,15,.18)'

def shadow(cx, cy, rx, ry, a=.18): return f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="rgba(90,50,15,{a})"/>'

def g(x, y, s, inner, rot=0):
    return f'<g transform="translate({f(x)} {f(y)}) rotate({f(rot)}) scale({f(s)})">{inner}</g>'

# ---------- składniki ----------
def bread(butter=False):
    pores = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*.7:.1f}" fill="#E3BD7A" opacity=".55"/>' for x, y, r in
                    [(-34, -34, 4), (18, -48, 3), (36, 8, 4.5), (-14, 22, 3), (8, 46, 4), (-46, 40, 3), (46, -22, 3), (-4, -10, 2.5), (28, 36, 2.5)])
    top = ''
    if butter:
        top = (f'<path d="{BREAD}" transform="translate(0 6) scale(.84)" fill="url(#gButter)"/>'
               '<path d="M-40 -30 C-10 -40 20 -36 46 -28" stroke="#FFF8D6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>'
               '<path d="M-44 20 C-10 12 24 16 50 24" stroke="#F2CB55" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>')
    return (f'<path d="{BREAD}" fill="url(#gCrust)"/>'
            f'<path d="{BREAD}" fill="none" stroke="#9A5A24" stroke-width="2" opacity=".45"/>'
            f'<path d="{BREAD}" transform="translate(0 6) scale(.84)" fill="url(#gCrumb)"/>'
            + (top if butter else pores) +
            '<path d="M-60 -60 C-50 -78 -30 -80 -18 -74" stroke="#F6C987" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>')

def butter_dish():
    return (shadow(0, 30, 54, 10) +
            '<ellipse cx="0" cy="18" rx="54" ry="18" fill="url(#gDish)" stroke="#A9C7DD" stroke-width="2"/>'
            '<ellipse cx="0" cy="15" rx="42" ry="11" fill="#E6F0F7"/>'
            '<path d="M-34 14 L-34 -8 L34 -8 L34 14 Z" fill="#F4CF5E"/>'
            '<path d="M-34 -8 L-22 -24 L46 -24 L34 -8 Z" fill="#FFEDA6"/>'
            '<path d="M34 -8 L46 -24 L46 -2 L34 14 Z" fill="#E6B941"/>'
            '<path d="M-20 -16 C-6 -20 14 -20 28 -17" stroke="#FFFBE6" stroke-width="3" fill="none" stroke-linecap="round"/>')

HOLES = [(-32, -22, 12), (26, -32, 9), (12, 16, 14), (-36, 32, 8), (42, 30, 10), (-6, -46, 6)]
def cheese():
    holes = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#D99320"/><circle cx="{x+r*.22:.1f}" cy="{y+r*.22:.1f}" r="{r*.82:.1f}" fill="#F0B133"/>' for x, y, r in HOLES)
    return ('<rect x="-70" y="-62" width="140" height="124" rx="16" fill="url(#gCheese)"/>'
            '<rect x="-70" y="-62" width="140" height="124" rx="16" fill="none" stroke="#DB9D2A" stroke-width="3"/>'
            + holes +
            '<path d="M-56 -54 L50 -54" stroke="#FFF1B5" stroke-width="5" stroke-linecap="round" opacity=".8"/>')

def cheese_wedge():
    return (shadow(0, 40, 66, 9) +
            '<path d="M-62 6 L58 6 L58 38 Q58 42 54 42 L-58 42 Q-62 42 -62 38 Z" fill="url(#gCheeseSide)"/>'
            '<path d="M-62 6 L30 -40 Q36 -43 40 -38 L58 6 Z" fill="url(#gCheese)"/>'
            '<path d="M30 -40 Q36 -43 40 -38 L58 6 L58 38" fill="none" stroke="#D48F1E" stroke-width="3"/>'
            '<circle cx="-30" cy="24" r="7" fill="#D38A1A"/><circle cx="2" cy="30" r="5" fill="#D38A1A"/><circle cx="32" cy="20" r="8" fill="#D38A1A"/>'
            '<circle cx="-6" cy="-12" r="7" fill="#E7A42C"/><circle cx="22" cy="-22" r="4.5" fill="#E7A42C"/><circle cx="-34" cy="-2" r="4" fill="#E7A42C"/>'
            '<path d="M-48 2 L26 -35" stroke="#FFF1B5" stroke-width="4" stroke-linecap="round" opacity=".8"/>')

HAM = 'M-74 -6 C-76 -46 -36 -66 6 -64 C48 -62 78 -36 76 4 C74 44 40 66 -2 64 C-44 62 -72 34 -74 -6 Z'
def ham():
    return (f'<path d="{HAM}" fill="#F7D6D3"/>'
            f'<path d="{HAM}" fill="none" stroke="#E4A6A6" stroke-width="2.5"/>'
            f'<path d="{HAM}" transform="scale(.86)" fill="url(#gHam)"/>'
            '<path d="M-36 -18 C-20 -30 -2 -26 8 -36" stroke="#FFE3E3" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>'
            '<path d="M6 18 C20 10 34 16 44 6" stroke="#FFE3E3" stroke-width="4" fill="none" stroke-linecap="round" opacity=".65"/>'
            '<path d="M-30 28 C-20 22 -10 26 -4 20" stroke="#FFE3E3" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>')

def frilly(rx, ry, n, amp):
    pts = []
    for i in range(n):
        a = i / n * 2 * math.pi
        pts.append((a, 1.0))
    d = ''
    for i in range(n):
        a0 = i / n * 2 * math.pi; a1 = (i + 1) / n * 2 * math.pi; am = (a0 + a1) / 2
        p0 = (math.cos(a0) * rx, math.sin(a0) * ry)
        p1 = (math.cos(a1) * rx, math.sin(a1) * ry)
        c = (math.cos(am) * (rx + amp), math.sin(am) * (ry + amp))
        if i == 0: d += f'M{f(p0[0])} {f(p0[1])} '
        d += f'Q{f(c[0])} {f(c[1])} {f(p1[0])} {f(p1[1])} '
    return d + 'Z'
LETTUCE = frilly(74, 60, 18, 22)
def lettuce():
    veins = ('<path d="M0 58 L0 -56 M0 30 L-36 6 M0 30 L36 6 M0 0 L-40 -26 M0 0 L40 -26 M0 -28 L-26 -48 M0 -28 L26 -48" '
             'stroke="#E2F5C0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>')
    return (f'<path d="{LETTUCE}" fill="url(#gLettuce)"/>'
            f'<path d="{LETTUCE}" fill="none" stroke="#468C2F" stroke-width="2.5"/>' + veins)

def lettuce_head():
    return (shadow(0, 42, 58, 9) +
            g(-24, 6, .55, lettuce(), -30) + g(24, 6, .55, lettuce(), 30) + g(0, -8, .6, lettuce(), 0) +
            '<ellipse cx="0" cy="14" rx="26" ry="20" fill="#D9F2A8"/>'
            '<path d="M0 30 L0 0 M0 18 L-14 6 M0 18 L14 6" stroke="#F2FBDF" stroke-width="3" fill="none" stroke-linecap="round"/>')

def star(n, r1, r2, rot=-90):
    d = ''
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n); r = r1 if i % 2 == 0 else r2
        d += ('M' if i == 0 else 'L') + f'{f(math.cos(a)*r)} {f(math.sin(a)*r)} '
    return d + 'Z'
def tomato():
    return ('<ellipse cx="0" cy="4" rx="45" ry="40" fill="url(#gTomato)"/>'
            '<path d="M-18 -28 C-26 -6 -24 22 -12 40" stroke="#B62C20" stroke-width="2.5" fill="none" opacity=".35"/>'
            '<path d="M18 -28 C26 -6 24 22 12 40" stroke="#B62C20" stroke-width="2.5" fill="none" opacity=".35"/>'
            '<ellipse cx="-18" cy="-14" rx="11" ry="6" fill="#FFFFFF" opacity=".45" transform="rotate(-30 -18 -14)"/>'
            f'<path d="{star(5, 20, 7)}" transform="translate(0 -32) scale(1 .55)" fill="#4E9A35" stroke="#36762A" stroke-width="2"/>'
            '<rect x="-3" y="-48" width="6" height="14" rx="3" fill="#3F7E2C"/>')

def tomato_slice():
    ch = ''
    for k in range(3):
        a = k / 3 * 2 * math.pi + .3; x, y = math.cos(a) * 12, math.sin(a) * 12
        ch += f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="8.5" ry="6.5" fill="#F7A06F" transform="rotate({f(math.degrees(a))} {f(x)} {f(y)})"/>'
        for j in (-1, 1):
            sx, sy = x + math.cos(a + 1.6) * 3 * j, y + math.sin(a + 1.6) * 3 * j
            ch += f'<ellipse cx="{f(sx)}" cy="{f(sy)}" rx="2.4" ry="1.5" fill="#FFF0B8" transform="rotate({f(math.degrees(a))} {f(sx)} {f(sy)})"/>'
    return ('<circle r="27" fill="#C8301F"/><circle r="23.5" fill="url(#gTomFlesh)"/>' + ch +
            '<circle r="5" fill="#FFC3B2"/><path d="M-16 -16 A23 23 0 0 1 4 -23" stroke="#FFD0C2" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>')

def cucumber():
    bumps = ''.join(f'<circle cx="{x}" cy="{y}" r="1.8" fill="#24601F"/>' for x, y in
                    [(-44, -8), (-26, 6), (-10, -10), (8, 8), (24, -6), (40, 6), (-36, 10), (14, -12), (48, -8)])
    return ('<path d="M-64 0 C-64 -16 -54 -21 -40 -21 L44 -21 C58 -21 66 -12 66 0 C66 12 58 21 44 21 L-40 21 C-54 21 -64 16 -64 0 Z" fill="url(#gCuc)"/>'
            '<path d="M-50 -10 L50 -10" stroke="#8ACB6A" stroke-width="3" stroke-linecap="round" opacity=".55"/>'
            '<path d="M-46 2 L46 2" stroke="#8ACB6A" stroke-width="2" stroke-linecap="round" opacity=".35"/>' + bumps +
            '<ellipse cx="-62" cy="0" rx="4" ry="6" fill="#8A6A2E"/>')

def cucumber_slice():
    seeds = ''
    for k in range(7):
        a = k / 7 * 2 * math.pi; x, y = math.cos(a) * 7.5, math.sin(a) * 7.5
        seeds += f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="2.3" ry="1.4" fill="#FBFFEE" transform="rotate({f(math.degrees(a))} {f(x)} {f(y)})"/>'
    return ('<circle r="21" fill="#2F7A2A"/><circle r="18.5" fill="#A9D77A"/><circle r="17" fill="url(#gCucFlesh)"/>'
            '<circle r="11" fill="#D6EEA2" opacity=".7"/>' + seeds)

# ---------- narzędzia ----------
def chef_knife():
    return ('<path d="M-120 2 C-110 -16 -60 -26 30 -26 L30 6 L-100 10 C-112 10 -122 8 -120 2 Z" fill="url(#gBlade)"/>'
            '<path d="M-120 2 C-110 -16 -60 -26 30 -26" stroke="#8C97A6" stroke-width="2" fill="none"/>'
            '<path d="M-96 4 L26 2" stroke="#FFFFFF" stroke-width="2" opacity=".8"/>'
            '<rect x="28" y="-28" width="12" height="36" rx="4" fill="#9AA5B3"/>'
            '<rect x="38" y="-22" width="86" height="26" rx="12" fill="url(#gHandle)"/>'
            '<circle cx="62" cy="-9" r="3.5" fill="#D6DCE3"/><circle cx="84" cy="-9" r="3.5" fill="#D6DCE3"/><circle cx="106" cy="-9" r="3.5" fill="#D6DCE3"/>')

def cleaver():
    return ('<rect x="-12" y="-150" width="24" height="60" rx="11" fill="url(#gHandle)"/>'
            '<circle cy="-132" r="3.5" fill="#D6DCE3"/><circle cy="-110" r="3.5" fill="#D6DCE3"/>'
            '<rect x="-8" y="-96" width="16" height="10" rx="3" fill="#9AA5B3"/>'
            '<path d="M-36 -88 L36 -88 Q40 -88 40 -84 L40 -4 Q40 2 34 2 L-34 2 Q-40 2 -40 -4 L-40 -84 Q-40 -88 -36 -88 Z" fill="url(#gBlade)"/>'
            '<path d="M-40 -8 L40 -8 L40 -4 Q40 2 34 2 L-34 2 Q-40 2 -40 -4 Z" fill="#FFFFFF" opacity=".85"/>'
            '<circle cx="20" cy="-68" r="7" fill="#C7CFD9" stroke="#9AA5B3" stroke-width="2"/>'
            '<path d="M-30 -80 L-30 -18" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".6"/>')

def butter_knife(butter=True):
    return ('<g transform="rotate(-32)">'
            '<path d="M-12 -46 Q0 -60 12 -46 L12 22 L-12 22 Z" fill="url(#gBlade)" stroke="#9AA5B3" stroke-width="2"/>'
            + ('<ellipse cx="0" cy="-26" rx="12" ry="15" fill="url(#gButter)"/>' if butter else '') +
            '<rect x="-11" y="20" width="22" height="64" rx="10" fill="#D4925A"/>'
            '<rect x="-11" y="20" width="22" height="64" rx="10" fill="none" stroke="#A86A36" stroke-width="2"/>'
            '<path d="M-4 30 L-4 74" stroke="#F0C18E" stroke-width="3" stroke-linecap="round"/></g>')

def cutting_board(x, y, w, h):
    grain = ''.join(f'<path d="M{x+20} {y+t} C{x+w*.3} {y+t-10} {x+w*.6} {y+t+12} {x+w-40} {y+t-4}" stroke="#C48B50" stroke-width="2" fill="none" opacity=".35"/>'
                    for t in (36, 70, 104, 138, 162))
    return (shadow(x + w / 2, y + h + 10, w / 2, 14, .2) +
            f'<rect x="{x}" y="{y+9}" width="{w}" height="{h}" rx="26" fill="#A9703B"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="26" fill="url(#gWood)"/>'
            f'<rect x="{x+7}" y="{y+7}" width="{w-14}" height="{h-14}" rx="20" fill="none" stroke="#F6D3A2" stroke-width="2" opacity=".7"/>'
            + grain +
            f'<circle cx="{x+w-28}" cy="{y+30}" r="11" fill="#9A6332"/><circle cx="{x+w-28}" cy="{y+32}" r="9" fill="#E9C894"/>'
            f'<path d="M{x+60} {y+150} l18 -6 M{x+120} {y+40} l14 8" stroke="#B87D44" stroke-width="2" stroke-linecap="round" opacity=".5"/>')

def placemat_plate(x, y, w, h, cx, cy):
    stripes = ''.join(f'<rect x="{x+12}" y="{y+yy}" width="{w-24}" height="5" fill="#E8775A" opacity=".75"/>' for yy in (16, 26, h - 31, h - 21))
    return (shadow(x + w / 2, y + h + 6, w / 2, 10, .15) +
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="url(#pLinen)"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="none" stroke="#E2CFAE" stroke-width="2"/>' + stripes +
            f'<ellipse cx="{cx}" cy="{cy+6}" rx="112" ry="104" fill="rgba(90,50,15,.16)"/>'
            f'<circle cx="{cx}" cy="{cy}" r="106" fill="url(#gPlate)"/>'
            f'<circle cx="{cx}" cy="{cy}" r="106" fill="none" stroke="#D2DAE1" stroke-width="2"/>'
            f'<circle cx="{cx}" cy="{cy}" r="95" fill="none" stroke="#E8775A" stroke-width="3" opacity=".8"/>'
            f'<circle cx="{cx}" cy="{cy}" r="80" fill="#F5F8FA" stroke="#E4EAEF" stroke-width="2"/>')

def crate(x, y, inner):
    w, h = 100, 92
    return (shadow(x + w / 2, y + h + 4, 52, 7, .2) +
            f'<rect x="{x+4}" y="{y+8}" width="{w-8}" height="{h-12}" rx="12" fill="url(#gCrateIn)"/>'
            + g(x + w / 2, y + 44, 1, inner) +
            f'<rect x="{x}" y="{y+56}" width="{w}" height="{h-56}" rx="10" fill="url(#gCrate)"/>'
            f'<path d="M{x+8} {y+73} L{x+w-8} {y+73}" stroke="#A86F37" stroke-width="2" opacity=".6"/>'
            f'<rect x="{x}" y="{y+56}" width="{w}" height="6" rx="3" fill="#EDC48B"/>'
            f'<circle cx="{x+9}" cy="{y+66}" r="2.2" fill="#8C5A2C"/><circle cx="{x+w-9}" cy="{y+66}" r="2.2" fill="#8C5A2C"/>'
            f'<circle cx="{x+9}" cy="{y+82}" r="2.2" fill="#8C5A2C"/><circle cx="{x+w-9}" cy="{y+82}" r="2.2" fill="#8C5A2C"/>')

def bin_contents():
    return {
        'chleb': g(-8, 4, .4, bread(), -8) + g(10, 0, .4, bread(), 8),
        'maslo': g(0, 2, .78, butter_dish()),
        'ser': g(0, 2, .62, cheese_wedge()),
        'szynka': g(-6, 8, .42, ham(), -10) + g(6, 0, .42, ham(), 6) + g(0, -8, .42, ham(), 0),
        'salata': g(0, 0, .72, lettuce_head()),
        'pomidor': g(-16, 6, .58, tomato()) + g(18, 0, .58, tomato()),
        'ogorek': g(0, 8, .62, cucumber(), -12) + g(4, -8, .62, cucumber(), 8),
    }

def worktop():
    planks = ''
    for i, y in enumerate(range(362, 720, 92)):
        planks += f'<path d="M0 {y} L1280 {y}" stroke="#D7B37C" stroke-width="2"/><path d="M0 {y+2} L1280 {y+2}" stroke="#FAE6C4" stroke-width="1.5" opacity=".8"/>'
        for xx in ((i * 377) % 900 + 140, (i * 377) % 900 + 640):
            planks += f'<path d="M{xx} {y+2} L{xx} {y+92}" stroke="#D7B37C" stroke-width="2"/>'
    grain = ''.join(f'<path d="M{x0} {y0} C{x0+120} {y0-8} {x0+260} {y0+10} {x0+400} {y0-2}" stroke="#E2BF88" stroke-width="2" fill="none" opacity=".7"/>'
                    for x0, y0 in [(30, 400), (700, 420), (300, 500), (900, 520), (60, 610), (620, 640), (980, 690), (200, 700)])
    return f'<rect x="0" y="362" width="1280" height="358" fill="url(#gWorktop)"/>{planks}{grain}<rect x="0" y="362" width="1280" height="12" fill="rgba(90,50,15,.12)"/>'

# ---------- karta przepisu ----------
def recipe_card(steps, cur):
    h = len(steps) * 118 + 22
    out = (f'<rect x="18" y="22" width="142" height="{h}" rx="26" fill="rgba(59,53,80,.14)"/>'
           f'<rect x="14" y="14" width="142" height="{h}" rx="26" fill="#FFFBF3" stroke="#EADCC6" stroke-width="2"/>')
    for i, (kind, art) in enumerate(steps):
        tx, ty, tw, th = 29, 28 + i * 118, 112, 104
        done, now = i < cur, i == cur
        fill = '#E2F4EA' if done else '#FFFFFF' if now else '#F4EEE6'
        op = '1' if done or now else '.5'
        out += f'<g opacity="{op}"><rect x="{tx}" y="{ty}" width="{tw}" height="{th}" rx="20" fill="{fill}"/>'
        if now: out += f'<rect x="{tx}" y="{ty}" width="{tw}" height="{th}" rx="20" fill="none" stroke="#E8775A" stroke-width="5"/>'
        out += g(tx + tw / 2, ty + th / 2, 1, art)
        if done:
            out += (f'<circle cx="{tx+tw-8}" cy="{ty+8}" r="16" fill="#5DB98A"/>'
                    f'<path d="M{tx+tw-16} {ty+8} L{tx+tw-10} {ty+14} L{tx+tw} {ty+2}" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
        out += '</g>'
    return out

def dots(n, filled):
    return ''.join(f'<circle cx="{(k-(n-1)/2)*22:.1f}" cy="34" r="8" fill="{"#E8775A" if k < filled else "#FFFFFF"}" stroke="#E8775A" stroke-width="2.5"/>' for k in range(n))

_uid = [0]
def uid(p):
    _uid[0] += 1
    return f'{p}{_uid[0]}'

def coin(r):
    s = r / 20
    return (f'<g transform="scale({f(s)})">'
            '<circle cy="2.6" r="20" fill="#A86C0E"/>'
            '<circle r="20" fill="url(#gCoinRim)"/>'
            '<circle r="15.5" fill="url(#gCoin)"/>'
            '<circle r="15.5" fill="none" stroke="#C98912" stroke-width="1.4"/>'
            f'<path d="{star(5, 9.5, 4.2)}" transform="translate(.8 1.4)" fill="#C2820F"/>'
            f'<path d="{star(5, 9.5, 4.2)}" fill="#FFD95A"/>'
            f'<path d="{star(5, 9.5, 4.2)}" fill="none" stroke="#FFF3BF" stroke-width="1" opacity=".8"/>'
            '<path d="M-14 -6 A15 15 0 0 1 -4 -15" stroke="#FFFBE3" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
            '<path d="M13 -15 L14.2 -12.2 L17 -11 L14.2 -9.8 L13 -7 L11.8 -9.8 L9 -11 L11.8 -12.2 Z" fill="#FFFFFF"/>'
            '</g>')

PIG_BODY = 'M-62 4 C-62 -34 -26 -50 8 -50 C46 -50 70 -24 70 6 C70 36 44 50 6 50 C-30 50 -62 38 -62 4 Z'
def piggy_art():
    clip = uid('slot')
    legs = ''.join(f'<rect x="{lx-10}" y="22" width="20" height="30" rx="9" fill="{c}"/><rect x="{lx-10}" y="44" width="20" height="8" rx="4" fill="#C9607F"/>'
                   for lx, c in ((-20, '#E0809A'), (44, '#E0809A'), (-42, '#F096AC'), (22, '#F096AC')))
    return (shadow(4, 52, 70, 11, .18) + legs +
            '<path d="M4 -42 L18 -70 L30 -40 Z" fill="#DE7894"/>'
            f'<path d="{PIG_BODY}" fill="url(#gPig)"/>'
            f'<path d="{PIG_BODY}" fill="none" stroke="#DB7391" stroke-width="2"/>'
            '<ellipse cx="10" cy="32" rx="44" ry="12" fill="#E06F8E" opacity=".18"/>'
            '<path d="M-34 -38 L-26 -70 L-6 -44 Z" fill="#F29AB0"/><path d="M-29 -44 L-25 -60 L-14 -45 Z" fill="#FFC6D3"/>'
            '<ellipse cx="-62" cy="8" rx="16" ry="20" fill="#F08CA5"/>'
            '<ellipse cx="-67" cy="8" rx="11" ry="16" fill="url(#gSnout)" stroke="#D86B8A" stroke-width="2"/>'
            '<ellipse cx="-70" cy="2" rx="2.6" ry="4.4" fill="#B84E6E"/><ellipse cx="-64" cy="13" rx="2.6" ry="4.4" fill="#B84E6E"/>'
            '<path d="M-46 -16 Q-38 -25 -30 -16" stroke="#3B3550" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
            '<ellipse cx="-34" cy="6" rx="10" ry="6" fill="#FF7E9D" opacity=".5"/>'
            '<path d="M-48 32 Q-40 38 -30 34" stroke="#DB7391" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>'
            f'<defs><clipPath id="{clip}"><rect x="-20" y="-90" width="60" height="42"/></clipPath></defs>'
            f'<g clip-path="url(#{clip})">{g(11, -56, .62, coin(20))}</g>'
            '<rect x="-6" y="-51" width="34" height="9" rx="4.5" fill="#9E405E"/>'
            '<rect x="-6" y="-46" width="34" height="4" rx="2" fill="#C45C7C"/>'
            '<path d="M68 -6 C88 -16 90 8 76 6 C68 4 72 -8 80 -4" stroke="#DE7894" stroke-width="5" fill="none" stroke-linecap="round"/>'
            '<path d="M-6 -38 C18 -42 42 -34 56 -18" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>'
            '<ellipse cx="44" cy="-20" rx="5" ry="3" fill="#FFFFFF" opacity=".6" transform="rotate(30 44 -20)"/>')

def money_badge(x, y, money):
    w = 54 + len(str(money)) * 22
    return (f'<rect x="{x}" y="{y+3}" width="{w}" height="48" rx="24" fill="rgba(90,50,15,.15)"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="48" rx="24" fill="#FFFBF3" stroke="#EAD3A8" stroke-width="2"/>'
            + g(x + 25, y + 23, .9, coin(20)) +
            f'<text x="{x+50}" y="{y+36}" font-family="Outfit" font-weight="800" font-size="32" fill="#3B3550">{money}</text>')

def piggy(x, y, money=3):
    return g(x, y, 1, piggy_art()) + money_badge(x - 52, y + 62, money)

def chef_hat():
    return ('<path d="M-46 4 C-74 2 -78 -40 -50 -46 C-46 -74 -10 -84 4 -62 C20 -86 58 -74 54 -44 C80 -38 76 2 48 4 Z" fill="url(#gHat)"/>'
            '<path d="M-20 -30 C-22 -14 -18 -4 -14 4 M14 -36 C16 -18 14 -6 12 4" stroke="#D9DEE6" stroke-width="3" fill="none" stroke-linecap="round"/>'
            '<path d="M-46 4 L48 4 L46 30 Q46 36 40 36 L-40 36 Q-46 36 -46 30 Z" fill="#FFFFFF"/>'
            '<path d="M-46 4 L48 4 L48 12 L-46 12 Z" fill="#E4E8EE"/>'
            '<path d="M-46 4 L48 4 L46 30 Q46 36 40 36 L-40 36 Q-46 36 -46 30 Z" fill="none" stroke="#CDD4DD" stroke-width="2"/>'
            '<path d="M-40 -40 C-34 -56 -18 -60 -8 -54" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>')

def sandwich_art():
    return (bread(True) + g(2, -2, .78, lettuce()) + g(0, 0, 1, cheese(), -6)
            + g(-34, 26, 1, tomato_slice()) + g(32, 30, 1, tomato_slice()))

def app_icon(size=360):
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFFFFF" opacity=".14"/>' for x, y, r in ((70, 90, 10), (440, 130, 7), (90, 420, 6), (452, 400, 9), (400, 60, 5)))
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 512 512" role="img" aria-label="Ikona aplikacji Kuchcik" xmlns="http://www.w3.org/2000/svg">'
            '<rect width="512" height="512" rx="114" fill="url(#gIconBg)"/>'
            '<circle cx="256" cy="300" r="190" fill="#FFFFFF" opacity=".08"/>' + dots +
            '<ellipse cx="256" cy="420" rx="176" ry="42" fill="rgba(90,30,15,.22)"/>'
            '<ellipse cx="256" cy="408" rx="176" ry="46" fill="url(#gPlate)"/>'
            '<ellipse cx="256" cy="404" rx="134" ry="30" fill="#F2F5F8" stroke="#E2E8EE" stroke-width="2"/>'
            + g(256, 318, 1.42, sandwich_art()) + g(268, 140, 1.5, chef_hat(), 8) +
            '<path d="M424 230 L430 244 L444 250 L430 256 L424 270 L418 256 L404 250 L418 244 Z" fill="#FFF3C4"/>'
            '</svg>')

def wordmark(size=140, hat=True):
    w = int(size * 4.4); h = int(size * 1.6)
    hatg = g(size * .62, size * .42, size / 210, chef_hat(), -14) if hat else ''
    t = f'x="{w/2:.0f}" y="{size*1.28:.0f}" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="{size}" letter-spacing="2"'
    sw = f'{size*.11:.0f}'
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="Kuchcik" xmlns="http://www.w3.org/2000/svg">'
            f'<text {t} fill="#9E3A26" transform="translate(0 {size*.06:.0f})" stroke="#9E3A26" stroke-width="{sw}" stroke-linejoin="round">Kuchcik</text>'
            f'<text {t} fill="#FFF3DF" stroke="#D2513A" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke">Kuchcik</text>'
            f'<text {t} fill="url(#gWord)">Kuchcik</text>'
            + hatg + '</svg>')

EXTRA_DEFS = '''
<linearGradient id="gCoinRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE68C"/><stop offset="1" stop-color="#D8961B"/></linearGradient>
<radialGradient id="gSnout" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFC4D1"/><stop offset="1" stop-color="#F39AB0"/></radialGradient>
<linearGradient id="gHat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6EAF0"/></linearGradient>
<radialGradient id="gIconBg" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="#F7A07E"/><stop offset=".6" stop-color="#E8775A"/><stop offset="1" stop-color="#C9523A"/></radialGradient>
<linearGradient id="gWord" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#FFF6E6"/><stop offset="1" stop-color="#FFE0B5"/></linearGradient>
'''

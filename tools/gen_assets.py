# Generuje ../assets.js: obrazki (SVG) gry. Uruchom: python tools/gen_assets.py
import os, re, json
import art
import art_more as m
from art import g

def defs_for(svg):
    ids = set(re.findall(r'url\(#([A-Za-z0-9]+)\)', svg))
    lines = [ln for ln in art.DEFS.strip().splitlines() if any(f'id="{i}"' in ln for i in ids)]
    return ''.join(lines)

SPR = {}
def add(name, inner, x, y, w, h, r=3):
    SPR[name] = (inner, x, y, w, h, r)

# składniki (kładzione na danie)
add('chleb', art.bread(), -112, -104, 224, 194)
add('ser', art.cheese(), -74, -66, 148, 132)
add('szynka', art.ham(), -80, -70, 160, 140)
add('salata', art.lettuce(), -100, -86, 200, 172)
add('pomidor', art.tomato(), -48, -50, 96, 96)
add('pomidor_s', art.tomato_slice(), -28, -28, 56, 56)
add('ogorek', art.cucumber(), -68, -24, 136, 48)
add('ogorek_s', art.cucumber_slice(), -22, -22, 44, 44)
add('banan', m.banana(), -72, -34, 152, 74)
add('banan_s', m.banana_slice(), -19, -19, 38, 38)
add('truskawka', m.strawberry(), -36, -42, 72, 80)
add('truskawka_s', m.strawberry_slice(), -26, -22, 52, 50)
add('winogrona', m.grapes(), -36, -48, 72, 92)
add('winogrono', m.grape_one(), -13, -13, 26, 26)
add('marchewka', m.carrot(), -96, -22, 160, 44)
add('marchewka_s', m.carrot_slice(), -18, -18, 36, 36)
add('ziemniak', m.potato(), -46, -34, 92, 68)
add('ziemniak_s', m.potato_cube(), -16, -16, 32, 32)
add('groszek', m.peas(), -24, -28, 48, 46)
add('makaron', m.pasta(), -30, -22, 60, 44)
add('ciasto_p', m.dough_ball(), -48, -30, 96, 72)
add('salami', m.salami(), -23, -23, 46, 46)
add('pieczarki', m.mushroom(), -25, -19, 50, 44)
add('oliwki', m.olive(), -12, -12, 24, 24)
add('wisienka', m.cherry(), -16, -38, 40, 58)
add('swieczka', m.candle(), -12, -62, 24, 88)
add('wafelek', m.wafer(), -10, -42, 20, 74)
for k, (c, d) in m.SCOOPS.items():
    add(k, m.scoop(c, d), -46, -48, 92, 62)
    add(k + '_box', m.ice_tub(k), -42, -42, 84, 84)

# zawartość skrzynek
add('maslo_box', art.butter_dish(), -56, -26, 112, 68)
add('ser_box', art.cheese_wedge(), -64, -44, 128, 94)
add('salata_box', art.lettuce_head(), -76, -62, 152, 116)
add('dzem_box', m.jar('#D9334A', '#F2C744'), -34, -38, 68, 76)
add('czekolada_box', m.jar('#6E3F26', '#E8775A'), -34, -38, 68, 76)
add('sos_box', m.jar('#D2442E', '#5FAE3E'), -34, -38, 68, 76)
add('mleko_box', m.jug('#FFFFFF', '#5B8BD9'), -46, -46, 104, 90)
add('ciasto_n_box', m.jug('#F6E2A8', '#E8775A'), -46, -46, 104, 90)
add('ciasto_m_box', m.jug('#E9C27A', '#F28DB2'), -46, -46, 104, 90)
add('woda_box', m.glass_jug('#9FD3F0'), -46, -46, 104, 90)
add('jogurt_box', m.yogurt(), -36, -32, 72, 74)
add('posypka_box', m.shaker(['#E8775A', '#5B8BD9', '#F2C744', '#7BC8A4']), -26, -46, 52, 84)
add('cukier_box', m.shaker(['#FFFFFF', '#F4F4F4']), -26, -46, 52, 84)
add('sertarty_box', m.cheese_shreds_bowl(), -46, -26, 92, 50)
add('lukier_box', m.bowl_frosting('#F7B6C8'), -46, -26, 92, 50)
add('groszek_box', m.bowl_small('#E9F1F7') + g(0, -10, .9, m.peas()), -46, -36, 92, 60)
add('makaron_box', m.bowl_small('#E9F1F7') + g(0, -12, .9, m.pasta()), -46, -36, 92, 60)

# narzędzia trzymane w palcach
add('noz_maslo', art.butter_knife(True), -60, -66, 104, 140)
add('lyzka_dzem', m.spoon('#D9334A'), -52, -74, 88, 140)
add('lyzka_czekolada', m.spoon('#6E3F26'), -52, -74, 88, 140)
add('lyzka_sos', m.spoon('#D2442E'), -52, -74, 88, 140)
add('szpatulka', m.spatula('#F7B6C8'), -56, -72, 96, 140)
add('lyzka_drewno', m.wooden_spoon(), -56, -80, 100, 150)

# naczynia, sprzęty, scena
add('worktop', art.worktop(), 0, 362, 1280, 358, 2)
add('crate_back', m.crate_back(), 0, 0, 100, 92)
add('crate_front', m.crate_front(), 0, 0, 100, 92)
add('deska', art.cutting_board(0, 0, 280, 190), -4, -4, 288, 222)
add('talerz', art.placemat_plate(0, 0, 350, 214, 175, 110), -2, -4, 354, 230)
add('talerz_maly', '<circle r="106" fill="url(#gPlate)"/><circle r="106" fill="none" stroke="#D2DAE1" stroke-width="2"/><circle r="95" fill="none" stroke="#E8775A" stroke-width="3" opacity=".8"/><circle r="80" fill="#F5F8FA" stroke="#E4EAEF" stroke-width="2"/>', -108, -108, 216, 216)
add('miska', m.bowl(), -104, -70, 208, 150)
add('szklanka_tyl', m.glass_back(), -60, -122, 120, 226)
add('szklanka_przod', m.glass_front(), -60, -122, 120, 226)
add('patelnia', m.stove_pan(), -122, -122, 310, 244)
add('garnek', m.stove_pot(), -132, -74, 264, 190)
add('lopata', m.pizza_peel(), -124, -124, 314, 256)
add('foremka', m.muffin_cup(), -56, -28, 112, 98)
add('muffin', m.muffin_dome(), -66, -86, 132, 82)
add('rozek', m.cone(), -48, -50, 96, 132)
add('piekarnik', m.oven(), -2, -2, 284, 214)
add('tasak', art.cleaver(), -42, -152, 84, 158)
add('noz', art.chef_knife(), -122, -30, 248, 40)
add('swinka', art.piggy_art(), -90, -78, 184, 136)
add('moneta', art.coin(20), -21, -21, 42, 46, 4)
add('czapka', art.chef_hat(), -80, -84, 160, 124)
add('ikona', art.app_icon(512).split('>', 1)[1].rsplit('</svg>', 1)[0], 0, 0, 512, 512, 1)
add('klodka', m.padlock(), -26, -40, 52, 72)

out = {}
for name, (inner, x, y, w, h, r) in SPR.items():
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{round(w*r)}" height="{round(h*r)}" viewBox="{x} {y} {w} {h}">'
           f'<defs>{defs_for(inner)}</defs>{inner}</svg>')
    out[name] = [svg, x, y, w, h, r]

dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets.js')
with open(dst, 'w', encoding='utf-8') as fh:
    fh.write('/* Kuchcik – obrazki gry (SVG). Plik generowany przez tools/gen_assets.py – nie edytuj ręcznie. */\n')
    fh.write('window.KUCHCIK_ART = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(out), 'obrazków,', os.path.getsize(dst) // 1024, 'KB')

# ikona aplikacji (logo) – zwykła i „maskable” z tłem na całym kwadracie
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
icon = art.app_icon(512)
icon = icon.replace(' role="img" aria-label="Ikona aplikacji Kuchcik"', '').replace('<svg width="512" height="512" viewBox="0 0 512 512"', '<svg width="512" height="512" viewBox="0 0 512 512"', 1)
inner = icon.split('>', 1)[1].rsplit('</svg>', 1)[0]
with open(os.path.join(root, 'icon.svg'), 'w', encoding='utf-8') as fh:
    fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>{defs_for(inner)}</defs>{inner}</svg>\n')
mask = inner.replace('<rect width="512" height="512" rx="114" fill="url(#gIconBg)"/>', '', 1)
with open(os.path.join(root, 'tools', 'icon-maskable.svg'), 'w', encoding='utf-8') as fh:
    fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>{defs_for(inner)}</defs><rect width="512" height="512" fill="url(#gIconBg)"/><g transform="translate(51 51) scale(.8)">{mask}</g></svg>\n')
print('ikony zapisane')

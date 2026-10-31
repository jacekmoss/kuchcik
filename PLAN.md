# Kuchcik — plan gry

Gra kucharska dla dzieci w wieku 4–5 lat, które nie umieją czytać. Prowadzisz małą kuchnię. Do lady przychodzą **ludzie** (pani, pan, babcia, dziadek, chłopiec, dziewczynka…) i pokazują w dymku obrazek dania. Dziecko patrzy na obrazkowy przepis, przygotowuje danie krok po kroku i podaje je klientowi. Klient je, cieszy się i **płaci monetami**, które lecą do skarbonki.

Technika i styl są takie jak w Rybkach i Tropicielu: Canvas, czysty JS, lektor, działanie offline, GitHub Pages z automatycznym pushem.

## 1. Założenia dla małego dziecka
- **Zero czytania.** Przepis, zamówienie i licznik to obrazki. Lektor (`speechSynthesis`, polski głos) mówi wszystko. Klient mówi własnym głosem: dziecko wyżej, dziadek niżej.
- **Brak porażki (tryb łatwy).** Nie ma czasu, żyć ani złych klientów. W trybie trudnym złe danie rozczarowuje klienta.
- **Zły składnik delikatnie odskakuje** z dźwiękiem „hmm?”, a lektor mówi, czego teraz potrzeba. Po 5 s bez ruchu właściwy składnik świeci. Po 8 s rączka-podpowiedź pokazuje gest. Po 10 s lektor powtarza polecenie.
- **Liczenie bez cyfr.** „3 plasterki” to 3 kółka w przepisie, które się wypełniają, a lektor liczy na głos.
- **Pieniądze zamiast naklejek.** Za każde danie klient płaci monetami (tyle, ile kroków miał przepis). Monety lecą do skarbonki, a obok widać ich liczbę.
- Duże cele dotyku. Składnik upuszczony blisko celu i tak trafia na miejsce.

## 2. Pętla rozgrywki
1. Klient wchodzi z dzwonkiem do drzwi, macha i mówi: „Dzień dobry! Poproszę kanapkę z serem.” W dymku jest obrazek kanapki.
2. Lewy pasek to karta przepisu z obrazkowymi krokami. Bieżący krok pulsuje, a zrobione kroki dostają zielony ptaszek. Stuknięcie w kartę powtarza polecenie.
3. Gotowanie na stanowiskach (minigry).
4. Ostatni krok to przeciągnięcie gotowej kanapki do klienta. Klient je, cieszy się (serduszko w dymku) i płaci.
5. Po 3–4 klientach poziom się kończy: fanfary, konfetti, gwiazdki i stan skarbonki.

## 3. Stanowiska i minigry
| Stanowisko | Gest | Czego uczy | Stan |
|---|---|---|---|
| Spiżarnia (rząd skrzynek) | przeciągnij składnik | rozpoznawanie | ✅ prototyp |
| Smarowanie masłem | jeździj nożem po chlebie, aż pokryjesz 80% | motoryka | ✅ prototyp |
| Krojenie | połóż warzywo na desce i stukaj, każde stuknięcie odcina plasterek | liczenie | ✅ prototyp |
| Składanie | warstwy w kolejności z przepisu | sekwencja | ✅ prototyp |
| Podawanie | przeciągnij kanapkę do klienta | — | ✅ prototyp |
| Mieszanie | kręcenie łyżką w kółko, kropki liczą obroty | motoryka, liczenie | ✅ |
| Smażenie | naleśnik się rumieni, stuknij, żeby przewrócić | obserwacja | ✅ |
| Piekarnik | włóż danie, pierścień-zegar, dzwonek, stuknij piekarnik | cierpliwość | ✅ |
| Nalewanie | przytrzymaj dzbanek nad naczyniem, puść przy kresce | zatrzymanie w porę | ✅ |
| Smarowanie | masło, dżem, czekolada, sos, lukier | motoryka | ✅ |
| Posypywanie | potrząsaj nad daniem (ser, posypka, cukier puder) | motoryka | ✅ |

## 4. Stanowiska (każde ma 10 poziomów, przejście poziomu odblokowuje następny – jak krainy w Tropicielu)

Mapa poziomów: na górze zakładki **Łatwy** / **Trudny** (osobny postęp), pod nimi 7 kolumn-stanowisk, w każdej 10 kółek
ułożonych wężykiem. Zamknięte mają kłódkę, przejście daje monetę na kółku. Trudność rośnie: więcej klientów (2→4),
dłuższe przepisy, więcej sztuk do liczenia, od poziomu 5 nalewanie nie zatrzymuje się samo przy kresce, od 7 węższy
zakres „w sam raz”, dłuższe smażenie/pieczenie, podpowiedzi pojawiają się później, więcej monet.

### Tryb trudny
- Zostaje obrazkowy przepis po lewej (ptaszek, gdy składnik został użyty – bez sprawdzania liczby, kropki się nie wypełniają).
- Lektor mówi tylko zamówienie klienta (stuknięcie w przepis je powtarza). Nie liczy plasterków ani obrotów łyżki, nie ma rączki ani świecącej skrzynki.
- Nic nie jest blokowane: każdy składnik można położyć, warzywo kroi się tyle razy, ile dziecko stuknie (plasterki spadają na danie po chwili bez stukania).
- Mieszanie: łyżka leży obok naczynia. Gotowanie i smażenie: płomyk przy garnku/patelni. Nieprzewrócony naleśnik i niewyjęta z piekarnika pizza/muffinka się przypalają.
- Danie można podać w każdej chwili. Klient sprawdza składniki i ich liczbę, smarowanie, posypanie, poziom płynu, liczbę obrotów (n albo n+1), ugotowanie/upieczenie i kolejność gałek lodów.
- Złe danie: klient jest smutny i odchodzi bez płacenia (smutna buźka na pasku klientów). Poziom zaliczony, gdy zadowolona jest co najmniej połowa klientów; gwiazdki: 3 = wszyscy, 2 = zaliczony, inaczej przycisk „jeszcze raz”.
- Dobre danie w trybie trudnym daje 1 monetę więcej.

| # | Stanowisko | Dania | Czynności |
|---|---|---|---|
| 1 | Kanapki | z serem, z sałatą i szynką, z pomidorem, z serem i ogórkiem, wielka | kładzenie, smarowanie, krojenie |
| 2 | Owocowy bar | miseczka bananów, sałatka, tęczowa sałatka, jogurt z owocami, koktajl truskawkowy i bananowy | krojenie, nalewanie, mieszanie |
| 3 | Lodziarnia | gałki w kolejności z obrazka, posypka, wafelek, wisienka, polewa | kolejność kolorów, posypywanie |
| 4 | Naleśnikarnia | z dżemem, z czekoladą i bananem, z truskawkami, wielki | nalewanie, smażenie i przewracanie |
| 5 | Pizzeria | z serem, z salami, z pieczarkami i oliwkami, ze wszystkim | sos, ser, liczenie dodatków, piekarnik |
| 6 | Zupy | marchewkowa, rosół, pomidorowa, jarzynowa | woda do kreski, krojenie, mieszanie, gotowanie |
| 7 | Cukiernia | muffinka, z lukrem, kolorowa z wisienką, urodzinowa ze świeczkami | nalewanie, piekarnik, dekorowanie |

## 4a. Pierwotny pomysł rozdziałów
| # | Rozdział | Dania | Nowość |
|---|---|---|---|
| 1 | Domowa kuchnia | kanapki (ser, pomidor, sałata+szynka, ser+ogórek) | spiżarnia, smarowanie, krojenie |
| 2 | Owocowy bar | sałatka owocowa, koktajl | mieszanie, nalewanie |
| 3 | Naleśnikarnia | naleśniki z dżemem | smażenie |
| 4 | Pizzeria | pizza | piekarnik |
| 5 | Zupy | pomidorowa, marchewkowa | garnek, „wrzuć 3 marchewki” |
| 6 | Cukiernia | muffinki, tort urodzinowy | dekorowanie, świeczki |
| 7 | Lodziarnia na plaży | lody w gałkach | kolejność kolorów |
| 8 | Zimowa kawiarnia | kakao, pierniczki | foremki i kształty |

## 5. Tryby
- **Łatwy (4 lata), 20 poziomów:** jeden klient naraz, 2–4 kroki, podpowiedzi, zawsze sukces.
- **Normalny (5+), 20 poziomów:** kolejka 2–3 klientów, dłuższe przepisy, dwa stanowiska naraz, serduszka cierpliwości (bez porażki, tylko mniej gwiazdek), zamówienia „bez pomidora” (przekreślona ikonka) i napiwek za szybkość.

## 6. Na co wydać pieniądze
- **Szafa kucharza:** czapki, fartuchy.
- **Wystrój kuchni:** kolory ścian, firanki, kwiatki, nowe skrzynki.
- **Nowe składniki** do trybu swobodnego.
- **Książka przepisów:** każde nowe danie wkleja się jako obrazek.
- **Tryb swobodny** „Gotuj, co chcesz”: bez zamówień, a klient i tak chwali.

## 7. Technologia
- `index.html` + `assets.js` + `game.js`, Canvas, bez bibliotek i bez budowania.
- Grafika: kształty SVG w `tools/art.py` i `tools/art_more.py` (te same co na kanwie projektowej „Kuchcik — szata graficzna kuchni”). `python tools/gen_assets.py` generuje `assets.js` oraz ikony; gra raz zamienia SVG na obrazki w pamięci.
- Świat ma 1280×720 jednostek i skaluje się do ekranu (gra poziomo; na telefonie po starcie pełny ekran i próba blokady w poziomie).
- Web Audio do efektów (dzwonek, chrupanie, krojenie, monety, fanfary).
- Pointer Events: mysz, palec i rysik.
- PWA: `manifest.webmanifest`, `sw.js` (najpierw sieć, bez sieci kopia), ikony 192/512/maskable.
- `localStorage`: `kuchcik-prog2` / `kuchcik-prog2-trudny` (odblokowany poziom i przejścia w każdym trybie; stary `kuchcik-prog` z 5 poziomami na stanowisko jest przeliczany), `kuchcik-tryb`, `kuchcik-money`, `kuchcik-sound`.
- Konsola testowa: `__kuchcik.startGame()`, `__kuchcik.loadLevel(n)` (0–69), `__kuchcik.step(sek)`, `__kuchcik.auto()` (wykonuje bieżący krok przepisu), `__kuchcik.unlockAll()`, `__kuchcik.setHard(true)`, `__kuchcik.serveMade(dobre)` (tryb trudny: podaje gotowe dobre albo złe danie).

## 8. Etapy
1. ✅ **Prototyp:** kuchnia z kanapkami, 4 przepisy, klienci-ludzie, monety i skarbonka, podpowiedzi, koniec poziomu.
2. ✅ Nowa szata graficzna (kanwa projektowa), logo, skarbonka i monety.
3. ✅ 7 stanowisk po 5 poziomów z rosnącą trudnością, mapa poziomów z odblokowywaniem.
3a. ✅ 10 poziomów na stanowisko, nowe przepisy, tryb trudny (bez podpowiedzi i blokad, niezadowoleni klienci).
4. ⏳ Test z dzieckiem: czy smarowanie, mieszanie, nalewanie i przewracanie są wykonalne, i czy tempo lektora pasuje.
5. ⏳ Tryb normalny (kolejka klientów, dwa stanowiska naraz).
6. ⏳ Sklep za monety, szafa, wystrój, tryb swobodny.
7. ⏳ Muzyczka w tle, układ pionowy na telefonie, szlif.

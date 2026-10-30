# Kuchcik — plan gry

Gra kucharska dla dzieci w wieku 4–5 lat, które nie umieją czytać. Prowadzisz małą kuchnię. Do lady przychodzą **ludzie** (pani, pan, babcia, dziadek, chłopiec, dziewczynka…) i pokazują w dymku obrazek dania. Dziecko patrzy na obrazkowy przepis, przygotowuje danie krok po kroku i podaje je klientowi. Klient je, cieszy się i **płaci monetami**, które lecą do skarbonki.

Technika i styl są takie jak w Rybkach i Tropicielu: Canvas, czysty JS, lektor, działanie offline, GitHub Pages z automatycznym pushem.

## 1. Założenia dla małego dziecka
- **Zero czytania.** Przepis, zamówienie i licznik to obrazki. Lektor (`speechSynthesis`, polski głos) mówi wszystko. Klient mówi własnym głosem: dziecko wyżej, dziadek niżej.
- **Brak porażki.** Nie ma czasu, żyć ani złych klientów.
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
| Mieszanie | kręcenie palcem w kółko | motoryka | ⏳ |
| Smażenie | przewróć, gdy złote | obserwacja | ⏳ |
| Piekarnik | pierścień-zegar, dzwonek | cierpliwość | ⏳ |
| Nalewanie | przytrzymaj, puść przy kresce | zatrzymanie w porę | ⏳ |
| Dekorowanie | swobodne posypki | kreatywność | ⏳ |

## 4. Rozdziały
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
- `index.html` + `game.js`, Canvas, grafika rysowana kodem (`Path2D`), bez obrazków i bez budowania.
- Świat ma 1280×720 jednostek i skaluje się do ekranu (gra poziomo; na telefonie po starcie pełny ekran i próba blokady w poziomie).
- Web Audio do efektów (dzwonek, chrupanie, krojenie, monety, fanfary).
- Pointer Events: mysz, palec i rysik.
- PWA: `manifest.webmanifest`, `sw.js` (najpierw sieć, bez sieci kopia), ikony 192/512/maskable.
- `localStorage`: `kuchcik-level`, `kuchcik-money`, `kuchcik-sound`.
- Konsola testowa: `__kuchcik.startGame()`, `__kuchcik.loadLevel(n)`, `__kuchcik.step(sek)`, `__kuchcik.auto()` (wykonuje bieżący krok przepisu).

## 8. Etapy
1. ✅ **Prototyp:** kuchnia z kanapkami, 4 przepisy, klienci-ludzie, monety i skarbonka, podpowiedzi, koniec poziomu.
2. ⏳ Test z dzieckiem: czy smarowanie, krojenie i przeciąganie są wykonalne, i czy tempo lektora pasuje.
3. ⏳ Kolejne stanowiska i dania z rozdziałów 2–4, mapa rozdziałów.
4. ⏳ Tryb łatwy: 20 poziomów.
5. ⏳ Tryb normalny.
6. ⏳ Sklep za monety, szafa, wystrój, tryb swobodny.
7. ⏳ Muzyczka w tle, układ pionowy na telefonie, szlif.

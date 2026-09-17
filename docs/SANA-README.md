# SANA — piano alimentare

Web app per gestire un piano alimentare: pasti per giorno della settimana, grammature, più alternative per pasto, tracking giornaliero e storico delle versioni del piano.

## Funzionalità

- **Piano** — un piano per ciascun giorno della settimana (Lun–Dom), ricorrente ogni settimana. Ogni giorno ha più pasti (Colazione, Pranzo, Cena, spuntini, ecc., personalizzabili), ogni pasto può avere più opzioni/alternative, ogni opzione è una lista di alimenti con grammatura. È possibile copiare il piano di un giorno su un altro.
- **Oggi** — mostra il piano del giorno corrente, permette di scegliere quale opzione è stata seguita per ogni pasto e di segnarlo come "Fatto"; si naviga anche sui giorni precedenti/successivi.
- **Storico** — due viste:
  - *Andamento*: aderenza giornaliera (pasti completati / pianificati) degli ultimi giorni.
  - *Piani salvati*: versioni del piano archiviate nel tempo (pulsante "Archivia piano" nella tab Piano), consultabili giorno per giorno in modo read-only — utile per confronti quando la dieta cambia.

## Struttura dati

```
plan/{mon..sun}      { day, label, meals: [{ id, name, options: [{ id, items: [{ id, name, qty }] }] }] }
log/{YYYY-MM-DD}     { date, day, meals: { mealId: { optionId, done, doneAt } } }
planVersions/{id}    { savedAt, label, days: { mon: {...}, tue: {...}, ... } }
```

## Persistenza

- **Dentro Claude**: usa la capability `db` degli Artifact (`window.claude.use('db')`) — un document store persistente e sincronizzato, dedicato a questo artifact.
- **Fallback**: se la capability non è disponibile, i dati vengono salvati in `localStorage` del browser (badge "Salvataggio locale" in alto); in quel caso restano solo su quel dispositivo/browser.

## Portare il codice fuori da Claude

`sana.html` è HTML/CSS/JS puro in un unico file (nessuna libreria esterna, solo i font da Google Fonts). Per ospitarlo su un proprio hosting/repo:

1. Rimuovere le chiamate a `window.claude.*` (capability `db`, `hot`).
2. Collegare uno storage proprio (es. Firebase, Supabase, un piccolo backend REST) al posto delle funzioni `persistPlanDay`, `persistLog`, `saveCurrentPlanAsVersion` e delle subscription in `initData()`.
3. Il resto — rendering, logica dei pasti/opzioni, storico — funziona senza modifiche.

## File

- `sana.html` — intera app (markup, stile, logica) in un unico file.

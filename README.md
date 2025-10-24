# End-Project – Web API & fetch

En enkel single-page web app som hämtar recept från TheMealDB med fetch.
Man kan söka på namn eller ingrediens, sortera resultaten (A–Z / Z–A) och visa detaljer för varje rätt.
Funktioner
•	Hämtar data från TheMeadlDB API med fetch och async/await.
•	Tolkar svar som JSON och visar resultaten dynamiskt som kort i ett grid.
•	Interaktiva kontroller: sökfält (namn/ingrediens) och sorteringsmeny.
•	Detaljvy visar bild, kategori, område, ingredienser och instruktioner.
•	Senaste sökning sparas I localStorage.
Teknik & krav
•	fetch + API: används i performSearch () och openDetails () mot search.php och lookup.php.
•	Array-metoder: sort () för alfabetisk ordning. Filter (Boolean) för att rensa tomma värden. forEach () för att rendera korten.
•	Async/await: hanterar nätverksanrop och fel med try/catch. 
•	Dynamisk rendering: DOM byggs med <template> och DocumentFragment för effektivitet.
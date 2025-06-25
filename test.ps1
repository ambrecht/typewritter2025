$searchPath = "E:\Typewriter2025"
$functionName = "addLineToStack"

# Unterstützt verschiedene Funktionsformen wie:
# const addLineToStack = (...) => { ... }
# function addLineToStack(...) { ... }
# addLineToStack: (...) => { ... }
$pattern = [regex]::Escape($functionName) + '\s*(=|:)?\s*(function|\(.*?\)\s*=>|\basync\b)'

# Alle .ts, .tsx, .js, .jsx-Dateien rekursiv durchsuchen
$files = Get-ChildItem -Path $searchPath -Recurse -Include *.ts, *.tsx, *.js, *.jsx -File

# Ergebnisse zwischenspeichern
$results = @()

foreach ($file in $files) {
    $lines = Get-Content $file.FullName
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        if ($line -match $pattern) {
            # Kontext: 3 Zeilen vor und 3 nach dem Treffer
            $start = [Math]::Max(0, $i - 3)
            $end = [Math]::Min($lines.Length - 1, $i + 3)
            $context = $lines[$start..$end] -join "`n"

            $results += "### Datei: $($file.FullName)`nZeile: $($i + 1)`nTreffer: $line`n--- Kontext ---`n$context`n"
        }
    }
}

# Zusammenführen und ins Clipboard kopieren
$fullOutput = $results -join "`n`n"
Set-Clipboard -Value $fullOutput

Write-Host "✅ Ergebnis wurde in die Zwischenablage kopiert. Füge es hier ein."

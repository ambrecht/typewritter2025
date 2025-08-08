"use client"
import { useTypewriterStore } from "@/store/typewriter-store"

interface FullscreenSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function FullscreenSettings({ isOpen, onClose }: FullscreenSettingsProps) {
  const {
    fontSize,
    stackFontSize,
    setFontSize,
    setStackFontSize,
    lineBreakConfig,
    updateLineBreakConfig,
    setFixedLineLength,
    darkMode,
  } = useTypewriterStore()

  // Wenn nicht geöffnet, nichts rendern
  if (!isOpen) return null

  // Erstelle ein div-Element, das direkt am body angehängt wird
  const settingsContainer = document.createElement("div")
  settingsContainer.id = "fullscreen-settings-container"
  settingsContainer.style.position = "fixed"
  settingsContainer.style.top = "0"
  settingsContainer.style.left = "0"
  settingsContainer.style.width = "100%"
  settingsContainer.style.height = "100%"
  settingsContainer.style.zIndex = "999999"
  settingsContainer.style.backgroundColor = darkMode ? "#111827" : "#ffffff"
  settingsContainer.style.color = darkMode ? "#f3f4f6" : "#1f2937"
  settingsContainer.style.overflow = "auto"

  // Füge das Element zum body hinzu
  document.body.appendChild(settingsContainer)

  // Erstelle den Header
  const header = document.createElement("div")
  header.className = `flex items-center justify-between p-4 border-b ${
    darkMode ? "border-gray-700" : "border-gray-200"
  } sticky top-0 z-10`

  // Zurück-Button
  const backButton = document.createElement("button")
  backButton.className = `flex items-center text-lg font-medium p-3 rounded-full ${
    darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
  }`
  backButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-6 w-6 mr-2">
      <path d="m12 19-7-7 7-7"></path>
      <path d="M19 12H5"></path>
    </svg>
    <span class="font-serif">Zurück</span>
  `
  backButton.onclick = () => {
    document.body.removeChild(settingsContainer)
    onClose()
  }

  header.appendChild(backButton)

  // Titel
  const title = document.createElement("h1")
  title.className = "text-xl font-serif font-medium"
  title.textContent = "Einstellungen"
  header.appendChild(title)

  // Platzhalter für symmetrisches Layout
  const placeholder = document.createElement("div")
  placeholder.className = "w-12"
  header.appendChild(placeholder)

  settingsContainer.appendChild(header)

  // Content-Bereich
  const content = document.createElement("div")
  content.className = "p-6 space-y-8 overflow-y-auto"
  content.style.height = "calc(100svh - 70px)"

  // Füge den Inhalt hinzu (vereinfacht)
  content.innerHTML = `
    <div class="space-y-4">
      <h2 class="text-xl font-serif mb-4">Schriftgröße</h2>
      <p>Aktuelle Schriftgröße: ${fontSize}px</p>
      <p>Aktuelle Stack-Schriftgröße: ${stackFontSize}px</p>
      <p>Maximale Zeichen pro Zeile: ${lineBreakConfig.maxCharsPerLine}</p>
      <p>Automatische Zeilenlänge: ${lineBreakConfig.autoMaxChars ? "Ja" : "Nein"}</p>
      <button id="close-settings" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Schließen</button>
    </div>
  `

  settingsContainer.appendChild(content)

  // Event-Listener für den Schließen-Button
  setTimeout(() => {
    const closeButton = document.getElementById("close-settings")
    if (closeButton) {
      closeButton.onclick = () => {
        document.body.removeChild(settingsContainer)
        onClose()
      }
    }
  }, 0)

  return null
}

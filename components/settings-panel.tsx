"use client"

import { useEffect, useState } from "react"
import { useTypewriterStore } from "@/store/typewriter-store"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    fontSize,
    stackFontSize,
    setFontSize,
    setStackFontSize,
    lineBreakConfig,
    updateLineBreakConfig,
    setFixedLineLength,
    darkMode,
    soundEnabled,
    toggleSoundEnabled,
    soundVolume,
    setSoundVolume,
    playTypewriterClick,
    soundsLoaded,
    loadProgress,
    loadError,
  } = useTypewriterStore()

  const [mounted, setMounted] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  // Überprüfen, ob es sich um ein Android-Gerät handelt
  useEffect(() => {
    setMounted(true)
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    setIsAndroid(isAndroidDevice)
  }, [])

  // Erstelle und entferne das Modal-Element direkt im DOM
  useEffect(() => {
    if (!isOpen || !mounted) return

    // Erstelle ein neues div-Element für das Modal
    const modalRoot = document.createElement("div")
    modalRoot.id = "settings-modal-root"
    modalRoot.style.position = "fixed"
    modalRoot.style.top = "0"
    modalRoot.style.left = "0"
    modalRoot.style.width = "100%"
    modalRoot.style.height = "100%"
    modalRoot.style.zIndex = "2147483647" // Höchstmöglicher z-index
    modalRoot.style.backgroundColor = darkMode ? "#111827" : "#ffffff"
    modalRoot.style.overflow = "auto"

    // Verhindere Scrolling im Hintergrund
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = "hidden"

    // Füge das Modal zum body hinzu
    document.body.appendChild(modalRoot)

    // Rendere den Inhalt des Modals
    renderModalContent(modalRoot)

    // Cleanup-Funktion
    return () => {
      document.body.style.overflow = originalStyle
      if (document.body.contains(modalRoot)) {
        document.body.removeChild(modalRoot)
      }
    }
  }, [
    isOpen,
    mounted,
    darkMode,
    fontSize,
    stackFontSize,
    lineBreakConfig,
    soundEnabled,
    soundVolume,
    soundsLoaded,
    loadProgress,
    loadError,
  ])

  // Funktion zum Rendern des Modal-Inhalts
  const renderModalContent = (container: HTMLElement) => {
    if (!container) return

    // Header
    const header = document.createElement("div")
    header.className = `flex items-center justify-between p-4 border-b ${
      darkMode ? "border-gray-700" : "border-gray-200"
    }`
    header.style.position = "sticky"
    header.style.top = "0"
    header.style.backgroundColor = darkMode ? "#111827" : "#ffffff"
    header.style.zIndex = "10"

    // Zurück-Button
    const backButton = document.createElement("button")
    backButton.className = `flex items-center text-lg font-medium p-3 rounded-full ${
      darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
    }`
    backButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-6 w-6 mr-2">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      <span style="font-family: serif;">Zurück</span>
    `
    backButton.onclick = () => {
      onClose()
    }
    header.appendChild(backButton)

    // Titel
    const title = document.createElement("h1")
    title.className = "text-xl font-medium"
    title.style.fontFamily = "serif"
    title.textContent = "Einstellungen"
    header.appendChild(title)

    // Platzhalter für symmetrisches Layout
    const placeholder = document.createElement("div")
    placeholder.style.width = "48px"
    header.appendChild(placeholder)

    container.appendChild(header)

    // Content
    const content = document.createElement("div")
    content.className = "p-6 space-y-8"
    content.style.height = "calc(100svh - 70px)"
    content.style.overflow = "auto"
    content.style.color = darkMode ? "#f9fafb" : "#111827"

    // Schriftgröße für aktive Zeile
    const fontSizeSection = document.createElement("div")
    fontSizeSection.className = "space-y-4"
    fontSizeSection.innerHTML = `
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem; font-family: serif;">Schreibkopf</h2>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <label style="display: flex; align-items: center; font-size: 1.125rem; font-family: serif;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="margin-right: 0.5rem;">
            <polyline points="4 7 4 4 20 4 20 7"></polyline>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="20"></line>
          </svg>
          Schriftgröße
        </label>
        <div style="display: flex; align-items: center;">
          <button id="decrease-font" style="height: 3.5rem; width: 3.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 1px solid ${darkMode ? "#4b5563" : "#d1d5db"};">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span id="font-size-value" style="margin: 0 1rem; font-family: monospace; width: 3rem; text-align: center; font-size: 1.25rem;">${fontSize}</span>
          <button id="increase-font" style="height: 3.5rem; width: 3.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 1px solid ${darkMode ? "#4b5563" : "#d1d5db"};">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      <div style="padding: 1.25rem; border-radius: 0.5rem; background-color: ${darkMode ? "#1f2937" : "#f3f4f6"}; font-family: serif; overflow: hidden; font-size: ${fontSize}px;">
        <span style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">Beispieltext für Schreibkopf</span>
      </div>
    `
    content.appendChild(fontSizeSection)

    // Trennlinie
    const divider1 = document.createElement("div")
    divider1.style.height = "1px"
    divider1.style.width = "100%"
    divider1.style.backgroundColor = darkMode ? "#374151" : "#e5e7eb"
    content.appendChild(divider1)

    // Schriftgröße für Zeilenstack
    const stackFontSizeSection = document.createElement("div")
    stackFontSizeSection.className = "space-y-4"
    stackFontSizeSection.innerHTML = `
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem; font-family: serif;">Zeilenstack</h2>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <label style="display: flex; align-items: center; font-size: 1.125rem; font-family: serif;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="margin-right: 0.5rem;">
            <line x1="17" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="17" y1="18" x2="3" y2="18"></line>
          </svg>
          Schriftgröße
        </label>
        <div style="display: flex; align-items: center;">
          <button id="decrease-stack-font" style="height: 3.5rem; width: 3.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 1px solid ${darkMode ? "#4b5563" : "#d1d5db"};">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span id="stack-font-size-value" style="margin: 0 1rem; font-family: monospace; width: 3rem; text-align: center; font-size: 1.25rem;">${stackFontSize}</span>
          <button id="increase-stack-font" style="height: 3.5rem; width: 3.5rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 1px solid ${darkMode ? "#4b5563" : "#d1d5db"};">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      <div style="padding: 1.25rem; border-radius: 0.5rem; background-color: ${darkMode ? "#1f2937" : "#f3f4f6"}; font-family: serif; overflow: hidden; font-size: ${stackFontSize}px;">
        <span style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          Beispieltext für den Zeilenstack. Hier sehen Sie, wie bereits geschriebene Zeilen aussehen werden.
        </span>
      </div>
    `
    content.appendChild(stackFontSizeSection)

    // Trennlinie
    const divider2 = document.createElement("div")
    divider2.style.height = "1px"
    divider2.style.width = "100%"
    divider2.style.backgroundColor = darkMode ? "#374151" : "#e5e7eb"
    content.appendChild(divider2)

    // Zeilenlänge
    const lineWidthSection = document.createElement("div")
    lineWidthSection.className = "space-y-4"
    lineWidthSection.innerHTML = `
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem; font-family: serif;">Zeilenlänge</h2>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
        <label style="font-size: 1.125rem; font-family: serif;">Maximale Zeichen pro Zeile</label>
        <span id="line-width-value" style="font-family: monospace; font-size: 1.25rem;">${lineBreakConfig.maxCharsPerLine}</span>
      </div>
      <input type="range" id="line-width-slider" min="20" max="100" value="${lineBreakConfig.maxCharsPerLine}" 
        style="width: 100%; height: 2rem; border-radius: 0.5rem; appearance: none; cursor: pointer; background-color: ${darkMode ? "#1f2937" : "#e5e7eb"};">
      <div style="display: flex; justify-content: space-between; font-size: 0.875rem; font-family: monospace; margin-top: 0.5rem;">
        <span>20</span>
        <span>60</span>
        <span>100</span>
      </div>
    `
    content.appendChild(lineWidthSection)

    // Trennlinie
    const divider3 = document.createElement("div")
    divider3.style.height = "1px"
    divider3.style.width = "100%"
    divider3.style.backgroundColor = darkMode ? "#374151" : "#e5e7eb"
    content.appendChild(divider3)

    // Automatische Zeilenlänge
    const autoLineWidthSection = document.createElement("div")
    autoLineWidthSection.style.padding = "1rem 0"
    autoLineWidthSection.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <label style="font-size: 1.125rem; font-family: serif;">Automatische Zeilenlänge</label>
        <label style="position: relative; display: inline-flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="auto-line-width" ${lineBreakConfig.autoMaxChars ? "checked" : ""} style="position: absolute; opacity: 0; width: 0; height: 0;">
          <div style="width: 4rem; height: 2.25rem; border-radius: 9999px; background-color: ${lineBreakConfig.autoMaxChars ? (darkMode ? "#4b5563" : "#9ca3af") : darkMode ? "#1f2937" : "#e5e7eb"}; position: relative;">
            <div style="position: absolute; top: 0.25rem; left: ${lineBreakConfig.autoMaxChars ? "2.25rem" : "0.25rem"}; background-color: white; border: 1px solid #d1d5db; border-radius: 9999px; height: 1.75rem; width: 1.75rem; transition: all 0.3s;"></div>
          </div>
        </label>
      </div>
      <p style="font-size: 0.875rem; margin-top: 0.5rem; font-family: serif; color: ${darkMode ? "#9ca3af" : "#6b7280"};">
        Passt die Zeilenlänge automatisch an die Bildschirmgröße an
      </p>
    `
    content.appendChild(autoLineWidthSection)
    const soundSettingsSection = document.createElement("div")
    soundSettingsSection.className = "space-y-4"
    soundSettingsSection.innerHTML = `
  <h2 style="font-size: 1.25rem; margin-bottom: 1rem; font-family: serif;">Sound</h2>

  {/* Show error message if sound failed to load */}
  ${
    soundsLoaded === false && loadError
      ? `
    <div style="padding: 0.75rem; margin-bottom: 1rem; border-radius: 0.5rem; background-color: #fef2f2; color: #b91c1c;">
      <p>Sound konnte nicht geladen werden: ${loadError}</p>
      <p style="font-size: 0.875rem; margin-top: 0.25rem;">Bitte stellen Sie sicher, dass die Sound-Dateien zugänglich sind.</p>
    </div>
  `
      : ""
  }

  {/* Show loading progress */}
  ${
    !soundsLoaded && !loadError
      ? `
    <div style="padding: 0.75rem; margin-bottom: 1rem; border-radius: 0.5rem; background-color: #eff6ff; color: #1e40af;">
      <p>Lade Sound-Dateien... ${Math.round(loadProgress * 100)}%</p>
      <div style="width: 100%; height: 0.5rem; background-color: #e5e7eb; border-radius: 9999px; margin-top: 0.5rem;">
        <div style="height: 100%; background-color: #60a5fa; border-radius: 9999px; width: ${loadProgress * 100}%"></div>
      </div>
    </div>
  `
      : ""
  }

  <div style="display: flex; align-items: center; justify-content: space-between;">
    <label style="font-size: 1.125rem; font-family: serif;">Schreibmaschinen-Sound</label>
    <label style="position: relative; display: inline-flex; align-items: center; cursor: pointer;">
      <input
        type="checkbox"
        id="sound-enabled"
        style="position: absolute; opacity: 0; width: 0; height: 0;"
        ${soundEnabled ? "checked" : ""}
      />
      <div
        style="width: 4rem; height: 2.25rem; border-radius: 9999px; background-color: ${soundEnabled ? (darkMode ? "#4b5563" : "#9ca3af") : darkMode ? "#1f2937" : "#e5e7eb"}; position: relative;"
      >
        <div style="position: absolute; top: 0.25rem; left: ${soundEnabled ? "2.25rem" : "0.25rem"}; background-color: white; border: 1px solid #d1d5db; border-radius: 9999px; height: 1.75rem; width: 1.75rem; transition: all 0.3s;"></div>
      </div>
    </label>
  </div>

  <p style="font-size: 0.875rem; font-family: serif; color: ${darkMode ? "#9ca3af" : "#6b7280"};">
    Aktivieren Sie den Sound, um Schreibmaschinen-Klicks beim Tippen zu hören.
  </p>

  <div style="margin-top: 1rem;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <label style="font-size: 1.125rem; font-family: serif;">Lautstärke</label>
      <span style="font-family: monospace;">${Math.round(soundVolume * 100)}%</span>
    </div>
    <input
      type="range"
      id="sound-volume"
      min="0"
      max="100"
      value="${soundVolume * 100}"
      style="width: 100%; height: 2rem; border-radius: 0.5rem; appearance: none; cursor: pointer; background-color: ${darkMode ? "#1f2937" : "#e5e7eb"}; accent-color: ${darkMode ? "#6b7280" : "#9ca3af"};"
    />
  </div>

  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
    <button
      id="test-sound-button"
      style="padding: 0.5rem 1rem; border-radius: 0.5rem; background-color: ${darkMode ? "#374151" : "#e5e7eb"};"
      ${!soundsLoaded || !soundEnabled ? "disabled" : ""}
    >
      ${soundsLoaded ? "Sound testen" : "Sound wird geladen..."}
    </button>
    
    ${
      isAndroid
        ? `
      <button
        id="unlock-android-sound-button"
        style="padding: 0.5rem 1rem; border-radius: 0.5rem; background-color: ${darkMode ? "#2563eb" : "#3b82f6"}; color: white;"
      >
        Android Sound entsperren
      </button>
    `
        : ""
    }
  </div>
`
    content.appendChild(soundSettingsSection)

    container.appendChild(content)

    // Event-Listener hinzufügen
    setTimeout(() => {
      // Schriftgröße für aktive Zeile
      const decreaseFontBtn = document.getElementById("decrease-font")
      const increaseFontBtn = document.getElementById("increase-font")
      const fontSizeValue = document.getElementById("font-size-value")

      if (decreaseFontBtn && increaseFontBtn && fontSizeValue) {
        decreaseFontBtn.onclick = () => {
          const newSize = Math.max(11, fontSize - 2)
          setFontSize(newSize)
          fontSizeValue.textContent = newSize.toString()
          const exampleText = decreaseFontBtn
            .closest("div")
            ?.nextElementSibling as HTMLElement | null
          if (exampleText) {
            exampleText.style.fontSize = `${newSize}px`
          }
        }

        increaseFontBtn.onclick = () => {
          const newSize = Math.min(64, fontSize + 2)
          setFontSize(newSize)
          fontSizeValue.textContent = newSize.toString()
          const exampleText = increaseFontBtn
            .closest("div")
            ?.nextElementSibling as HTMLElement | null
          if (exampleText) {
            exampleText.style.fontSize = `${newSize}px`
          }
        }
      }

      // Schriftgröße für Zeilenstack
      const decreaseStackFontBtn = document.getElementById("decrease-stack-font")
      const increaseStackFontBtn = document.getElementById("increase-stack-font")
      const stackFontSizeValue = document.getElementById("stack-font-size-value")

      if (decreaseStackFontBtn && increaseStackFontBtn && stackFontSizeValue) {
        decreaseStackFontBtn.onclick = () => {
          const newSize = Math.max(11, stackFontSize - 1)
          setStackFontSize(newSize)
          stackFontSizeValue.textContent = newSize.toString()
          const exampleText = decreaseStackFontBtn
            .closest("div")
            ?.nextElementSibling as HTMLElement | null
          if (exampleText) {
            exampleText.style.fontSize = `${newSize}px`
          }
        }

        increaseStackFontBtn.onclick = () => {
          const newSize = Math.min(64, stackFontSize + 1)
          setStackFontSize(newSize)
          stackFontSizeValue.textContent = newSize.toString()
          const exampleText = increaseStackFontBtn
            .closest("div")
            ?.nextElementSibling as HTMLElement | null
          if (exampleText) {
            exampleText.style.fontSize = `${newSize}px`
          }
        }
      }

      // Zeilenlänge
      const lineWidthSlider = document.getElementById("line-width-slider") as HTMLInputElement
      const lineWidthValue = document.getElementById("line-width-value")

      if (lineWidthSlider && lineWidthValue) {
        lineWidthSlider.oninput = () => {
          const newWidth = Number.parseInt(lineWidthSlider.value)
          setFixedLineLength(newWidth)
          lineWidthValue.textContent = newWidth.toString()
        }
      }

      // Automatische Zeilenlänge
      const autoLineWidthCheckbox = document.getElementById("auto-line-width") as HTMLInputElement

      if (autoLineWidthCheckbox) {
        autoLineWidthCheckbox.onchange = () => {
          updateLineBreakConfig({ autoMaxChars: autoLineWidthCheckbox.checked })

          // Aktualisiere die Anzeige
          const toggleBg = autoLineWidthCheckbox.nextElementSibling as HTMLElement | null
          if (toggleBg) {
            toggleBg.style.backgroundColor = autoLineWidthCheckbox.checked
              ? darkMode
                ? "#4b5563"
                : "#9ca3af"
              : darkMode
                ? "#1f2937"
                : "#e5e7eb"

            const toggleHandle = toggleBg.firstElementChild as HTMLElement | null
            if (toggleHandle) {
              toggleHandle.setAttribute(
                "style",
                `position: absolute; top: 0.25rem; left: ${autoLineWidthCheckbox.checked ? "2.25rem" : "0.25rem"}; background-color: white; border: 1px solid #d1d5db; border-radius: 9999px; height: 1.75rem; width: 1.75rem; transition: all 0.3s;`,
              )
            }
          }
        }
      }

      // Sound-Einstellungen
      const soundEnabledCheckbox = document.getElementById("sound-enabled") as HTMLInputElement
      const soundVolumeInput = document.getElementById("sound-volume") as HTMLInputElement
      const testSoundButton = document.getElementById("test-sound-button") as HTMLButtonElement
      const unlockAndroidSoundButton = document.getElementById("unlock-android-sound-button") as HTMLButtonElement

      if (soundEnabledCheckbox) {
        soundEnabledCheckbox.onchange = () => {
          toggleSoundEnabled()
        }
      }

      if (soundVolumeInput) {
        soundVolumeInput.oninput = () => {
          setSoundVolume(Number(soundVolumeInput.value) / 100)
        }
      }

      if (testSoundButton) {
        testSoundButton.onclick = () => {
          playTypewriterClick()
        }
      }

      if (unlockAndroidSoundButton) {
        unlockAndroidSoundButton.onclick = () => {
          // Versuche, den Audio-Kontext zu entsperren und einen Sound abzuspielen
          try {
            // Erstelle einen temporären Audio-Kontext und entsperre ihn
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext
            if (AudioContext) {
              const audioCtx = new AudioContext()
              audioCtx.resume().then(() => console.log("AudioContext entsperrt"))
            }

            // Spiele einen leeren Sound ab, um die Audio-Wiedergabe zu entsperren
            const sound = new Audio()
            sound.volume = 0.01 // Sehr leise
            sound.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" // Leerer Sound
            sound
              .play()
              .then(() => {
                console.log("Audio entsperrt")
                // Nach erfolgreicher Entsperrung einen echten Sound abspielen
                setTimeout(() => {
                  playTypewriterClick()
                }, 500)
              })
              .catch((e) => console.log("Audio-Entsperrversuch:", e))
          } catch (e) {
            console.log("AudioContext-Fehler:", e)
          }
        }
      }
    }, 0)
  }

  // Wenn nicht geöffnet oder nicht gemounted, nichts rendern
  return null
}

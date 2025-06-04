"use client"

import { useState, useEffect } from "react"

/**
 * Gerätekategorien basierend auf Bildschirmbreite
 */
export type DeviceCategory = "tiny-phone" | "small-phone" | "phone" | "tablet" | "large-tablet"

interface UseResponsiveTypographyOptions {
  initialFontSize: number
  initialStackFontSize: number
  setFontSize: (size: number) => void
  setStackFontSize: (size: number) => void
}

/**
 * Hook für responsives Schriftgrößen-Scaling basierend auf Gerätekategorie
 * Besonders wichtig für die Vielfalt an Android-Geräten
 *
 * @param options - Optionen für den Hook
 * @returns Objekt mit Gerätekategorie und optimierten Schriftgrößen
 */
export function useResponsiveTypography({
  initialFontSize,
  initialStackFontSize,
  setFontSize,
  setStackFontSize,
}: UseResponsiveTypographyOptions) {
  const [deviceCategory, setDeviceCategory] = useState<DeviceCategory>("phone")
  const [isAndroid, setIsAndroid] = useState(false)

  // Prüfe, ob es sich um ein Android-Gerät handelt
  useEffect(() => {
    setIsAndroid(navigator.userAgent.includes("Android"))
  }, [])

  /**
   * Bestimmt die Gerätekategorie basierend auf der Bildschirmbreite
   */
  const getDeviceCategory = (): DeviceCategory => {
    const width = window.innerWidth
    if (width < 360) return "tiny-phone"
    if (width < 480) return "small-phone"
    if (width < 600) return "phone"
    if (width < 840) return "tablet"
    return "large-tablet"
  }

  // Aktualisiere die Gerätekategorie und passe Schriftgrößen an
  useEffect(() => {
    // Nur für Android-Geräte oder wenn explizit gewünscht
    if (!isAndroid && !window.location.search.includes("responsive=true")) return

    const handleResize = () => {
      const category = getDeviceCategory()
      setDeviceCategory(category)

      // Setze data-Attribut für CSS-Selektoren
      document.body.dataset.deviceCategory = category

      // Passe Schriftgrößen basierend auf Gerätekategorie an
      switch (category) {
        case "tiny-phone":
          setFontSize(Math.min(initialFontSize, 18))
          setStackFontSize(Math.min(initialStackFontSize, 14))
          break
        case "small-phone":
          setFontSize(Math.min(initialFontSize, 20))
          setStackFontSize(Math.min(initialStackFontSize, 16))
          break
        case "phone":
          // Standardwerte beibehalten
          break
        case "tablet":
        case "large-tablet":
          // Optional: Größere Schriften für Tablets
          break
      }
    }

    // Initial ausführen
    handleResize()

    // Event-Listener für Größenänderungen
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isAndroid, initialFontSize, initialStackFontSize, setFontSize, setStackFontSize])

  /**
   * Berechnet die optimale Schriftgröße basierend auf der Bildschirmbreite
   */
  const calculateOptimalFontSize = (baseSize: number): number => {
    const width = window.innerWidth
    // Basis-Schriftgröße: baseSize-4 bei 320px Breite, baseSize bei 768px Breite
    return Math.max(baseSize - 4, Math.min(baseSize, baseSize - 4 + (width - 320) * (4 / 448)))
  }

  return {
    deviceCategory,
    calculateOptimalFontSize,
    isAndroid,
  }
}

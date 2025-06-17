"use client"

import { useState } from "react"
import { Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTypewriterStore } from "@/store/typewriter-store"

export default function FlowMenu() {
  const { flowMode, startFlowMode, stopFlowMode } = useTypewriterStore()
  const [timerType, setTimerType] = useState<"time" | "words">(flowMode.timerType)
  const [target, setTarget] = useState(flowMode.timerTarget)

  const handleStart = () => {
    const value = Number.parseInt(target as unknown as string)
    if (!Number.isNaN(value) && value > 0) {
      startFlowMode(timerType, value)
    }
  }

  const handleStop = () => stopFlowMode()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Flow Mode" title="Flow Mode">
          <Timer className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-4" align="end">
        <div className="space-y-2">
          <Label className="text-xs">Zieltyp</Label>
          <RadioGroup
            value={timerType}
            onValueChange={(val) => setTimerType(val as "time" | "words")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="flow-time" value="time" />
              <Label htmlFor="flow-time">Zeit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="flow-words" value="words" />
              <Label htmlFor="flow-words">Wörter</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="flow-target" className="text-xs">
            Ziel {timerType === "time" ? "(Minuten)" : "(Wörter)"}
          </Label>
          <Input
            id="flow-target"
            type="number"
            min="1"
            value={target}
            onChange={(e) => setTarget(Number.parseInt(e.target.value))}
          />
        </div>
        {flowMode.enabled ? (
          <Button onClick={handleStop} className="w-full" variant="outline">
            Flow stoppen
          </Button>
        ) : (
          <Button onClick={handleStart} className="w-full" variant="outline">
            Flow starten
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

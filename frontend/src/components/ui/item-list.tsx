"use client"

import { useState } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Plus, X } from "lucide-react"

export function ItemList({ label, items, onChange, placeholder }: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  const [newItem, setNewItem] = useState("")

  const addItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    setNewItem("")
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addItem()
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
              {item}
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
        />
        <Button type="button" variant="outline" size="icon" onClick={addItem} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

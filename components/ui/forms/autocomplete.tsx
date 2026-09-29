"use client"

import * as React from "react"

export interface AutocompleteOption {
  value: string
  label: string
  disabled?: boolean
}

export interface AutocompleteProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  options?: AutocompleteOption[]
  value?: AutocompleteOption | AutocompleteOption[] | null
  defaultValue?: AutocompleteOption | AutocompleteOption[] | null
  onChange?: (value: AutocompleteOption | AutocompleteOption[] | null) => void
  multiple?: boolean
  clearable?: boolean
  maxVisibleChips?: number
  placeholder?: string
  name?: string
  disabled?: boolean
  invalid?: boolean
  onInputChange?: (text: string) => void
  loadOptions?: (query: string) => Promise<AutocompleteOption[]> | AutocompleteOption[]
  minChars?: number
}

const DEFAULT_OPTIONS: AutocompleteOption[] = [
  { value: "france", label: "France" },
  { value: "germany", label: "Germany" },
  { value: "italy", label: "Italy" },
  { value: "spain", label: "Spain" },
  { value: "portugal", label: "Portugal" },
  { value: "japan", label: "Japan" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
]

function normalizeValue(value: AutocompleteOption | AutocompleteOption[] | null | undefined) {
  if (Array.isArray(value)) return value
  if (!value) return []
  return [value]
}

export function Autocomplete({
  options = DEFAULT_OPTIONS,
  value,
  defaultValue,
  onChange,
  multiple = false,
  clearable = true,
  maxVisibleChips = 3,
  placeholder = "Search...",
  name,
  disabled = false,
  invalid = false,
  onInputChange,
  loadOptions,
  minChars = 0,
  ...props
}: AutocompleteProps) {
  const [selectedItems, setSelectedItems] = React.useState<AutocompleteOption[]>(() => {
    if (value !== undefined) return normalizeValue(value)
    if (defaultValue !== undefined) return normalizeValue(defaultValue)
    return []
  })
  const [inputValue, setInputValue] = React.useState(
    !multiple && selectedItems[0] ? selectedItems[0].label : ""
  )
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const normalizedSelected = React.useMemo(() => normalizeValue(value), [value])
  const selectedValues = React.useMemo(
    () => new Set(selectedItems.map((item) => item.value)),
    [selectedItems]
  )

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedItems(normalizeValue(value))
    }
  }, [value])

  React.useEffect(() => {
    if (!multiple && selectedItems[0]) {
      setInputValue(selectedItems[0].label)
    }
    if (!multiple && selectedItems.length === 0) {
      setInputValue("")
    }
  }, [multiple, selectedItems])

  const remoteOptions = React.useMemo(() => {
    if (!loadOptions) return options
    if (query.trim().length < minChars) return []
    const result = loadOptions(query)
    if (result instanceof Promise) {
      return []
    }
    return result
  }, [loadOptions, minChars, options, query])

  const [asyncOptions, setAsyncOptions] = React.useState<AutocompleteOption[]>([])
  React.useEffect(() => {
    if (!loadOptions) return
    if (query.trim().length < minChars) {
      setAsyncOptions([])
      return
    }

    let active = true
    const promise = Promise.resolve(loadOptions(query))
    promise.then((items) => {
      if (!active) return
      setAsyncOptions(items)
    })

    return () => {
      active = false
    }
  }, [loadOptions, minChars, query])

  const listItems = React.useMemo(() => {
    const source = loadOptions ? asyncOptions : remoteOptions
    const filtered = source.filter((item) => {
      if (item.disabled) return false
      if (multiple && selectedValues.has(item.value)) return false
      return item.label.toLowerCase().includes(query.trim().toLowerCase())
    })
    return filtered
  }, [asyncOptions, loadOptions, multiple, query, remoteOptions, selectedValues])

  const commit = React.useCallback(
    (item: AutocompleteOption) => {
      if (item.disabled) return

      const nextSelection = multiple
        ? selectedItems.some((selected) => selected.value === item.value)
          ? selectedItems.filter((selected) => selected.value !== item.value)
          : [...selectedItems, item]
        : [item]

      setSelectedItems(nextSelection)
      onChange?.(multiple ? nextSelection : nextSelection[0] ?? null)
      setQuery("")
      setInputValue(multiple ? "" : item.label)
      if (multiple) {
        requestAnimationFrame(() => inputRef.current?.focus())
      }
      setOpen(false)
    },
    [multiple, onChange, selectedItems]
  )

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    setInputValue(next)
    setQuery(next)
    setOpen(true)
    onInputChange?.(next)

    if (!multiple && next === "") {
      setSelectedItems([])
      onChange?.(null)
    }
  }

  const clearSelection = () => {
    setSelectedItems([])
    setInputValue("")
    setQuery("")
    onChange?.(multiple ? [] : null)
    inputRef.current?.focus()
  }

  const visibleChips = multiple ? selectedItems.slice(0, maxVisibleChips) : []
  const hiddenChipCount = multiple ? Math.max(0, selectedItems.length - maxVisibleChips) : 0

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (event.key === "Escape") {
      setOpen(false)
      if (!multiple && selectedItems[0]) {
        setInputValue(selectedItems[0].label)
      }
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const first = listItems[0]
      if (first) commit(first)
      return
    }

    if (multiple && event.key === "Backspace" && inputValue === "" && selectedItems.length > 0) {
      event.preventDefault()
      const last = selectedItems[selectedItems.length - 1]
      setSelectedItems((items) => items.filter((item) => item.value !== last.value))
      onChange?.(selectedItems.filter((item) => item.value !== last.value))
    }
  }

  const hasSelection = multiple ? selectedItems.length > 0 : !!selectedItems[0]
  const showClear = clearable && !disabled && hasSelection && (inputValue !== "" || multiple)

  return (
    <div {...props} data-autocomplete="" data-open={open ? "true" : undefined} data-multiple={multiple ? "true" : undefined} data-invalid={invalid ? "true" : undefined}>
      {multiple && selectedItems.length > 0 ? (
        <ul data-autocomplete-chips="">
          {visibleChips.map((item) => (
            <li key={item.value} data-autocomplete-chip="">
              <span>{item.label}</span>
              {!disabled && (
                <button
                  type="button"
                  data-autocomplete-chip-remove=""
                  aria-label={`Remove ${item.label}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    const next = selectedItems.filter((selected) => selected.value !== item.value)
                    setSelectedItems(next)
                    onChange?.(next)
                  }}
                >
                  ×
                </button>
              )}
            </li>
          ))}
          {hiddenChipCount > 0 ? <li data-autocomplete-chip-overflow="">+{hiddenChipCount}</li> : null}
        </ul>
      ) : null}

      <div data-autocomplete-input-wrap="">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder={placeholder}
          name={name}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          data-autocomplete-input=""
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {showClear ? (
          <button
            type="button"
            data-autocomplete-clear=""
            aria-label="Clear selection"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSelection}
          >
            ×
          </button>
        ) : null}
      </div>

      {name && !multiple && (
        <input type="hidden" name={name} value={selectedItems[0]?.value ?? ""} disabled={disabled} />
      )}

      {multiple && name ? (
        selectedItems.map((item) => (
          <input key={item.value} type="hidden" name={name} value={item.value} disabled={disabled} />
        ))
      ) : null}

      {open && listItems.length > 0 ? (
        <ul data-autocomplete-list="" role="listbox">
          {listItems.map((item) => (
            <li
              key={item.value}
              role="option"
              aria-selected={selectedValues.has(item.value)}
              data-autocomplete-option=""
              data-selected={selectedValues.has(item.value) ? "true" : undefined}
              onMouseDown={(event) => {
                event.preventDefault()
                commit(item)
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      {open && listItems.length === 0 && query.trim().length >= minChars ? (
        <div data-autocomplete-empty="">No matches found.</div>
      ) : null}
    </div>
  )
}

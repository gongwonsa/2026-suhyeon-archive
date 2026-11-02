interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label>
      <span className="visually-hidden">제목 또는 이름 검색</span>
      <input
        className="search-input"
        type="search"
        placeholder="제목 또는 이름 검색"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

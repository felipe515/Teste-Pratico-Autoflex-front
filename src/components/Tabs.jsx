const tabs = [
  { key: 'products', label: 'Products' },
  { key: 'materials', label: 'Raw Materials' },
  { key: 'production', label: 'Production Suggestion' },
]

export function Tabs({ activeTab, onChange }) {
  return (
    <nav className="tabs" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab ${activeTab === tab.key ? 'tab--active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

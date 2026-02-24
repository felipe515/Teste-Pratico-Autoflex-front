import { useState } from 'react'
import { Tabs } from './components/Tabs'
import { ProductsManager } from './components/ProductsManager'
import { RawMaterialsManager } from './components/RawMaterialsManager'
import { ProductionPlan } from './components/ProductionPlan'

function App() {
  const [activeTab, setActiveTab] = useState('products')
  const [rawMaterials, setRawMaterials] = useState([])

  return (
    <main className="container">
      <header>
        <h1>Production & Stock Management</h1>
        <p>
          Web interface to maintain products, raw materials, and material composition, plus visualize the best
          production suggestion.
        </p>
      </header>

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'products' ? <ProductsManager rawMaterials={rawMaterials} /> : null}
      {activeTab === 'materials' ? <RawMaterialsManager onMaterialsChange={setRawMaterials} /> : null}
      {activeTab === 'production' ? <ProductionPlan /> : null}
    </main>
  )
}

export default App

import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Feedback } from './Feedback'

function normalizeProductionResponse(data) {
  if (Array.isArray(data)) {
    return data.map((item) => ({
      productId: item.productId,
      code: item.productCode ?? item.code,
      name: item.productName ?? item.name,
      quantity: Number(item.producibleQuantity ?? item.quantity ?? 0),
      unitValue: Number(item.productValue ?? item.unitValue ?? 0),
      subtotal: Number(
        item.subtotal ?? Number(item.productValue ?? item.unitValue ?? 0) * Number(item.producibleQuantity ?? item.quantity ?? 0),
      ),
    }))
  }

  if (data && Array.isArray(data.products)) {
    return data.products.map((item) => ({
      productId: item.productId,
      code: item.productCode ?? item.code,
      name: item.productName ?? item.name,
      quantity: Number(item.producibleQuantity ?? item.quantity ?? 0),
      unitValue: Number(item.productValue ?? item.unitValue ?? 0),
      subtotal: Number(item.subtotal ?? 0),
    }))
  }

  return []
}

export function ProductionPlan() {
  const [plan, setPlan] = useState([])
  const [apiTotalValue, setApiTotalValue] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'info' })
  const [loading, setLoading] = useState(true)

  async function loadPlan() {
    setLoading(true)
    setFeedback({ message: '', type: 'info' })

    try {
      const data = await api.productionPlan.list()
      const normalized = normalizeProductionResponse(data)
      const sorted = [...normalized].sort((a, b) => Number(b.unitValue) - Number(a.unitValue))
      setPlan(sorted)

      if (data && typeof data.totalValue === 'number') {
        setApiTotalValue(Number(data.totalValue))
      } else {
        setApiTotalValue(null)
      }
    } catch (error) {
      setFeedback({ message: `Error loading production suggestion: ${error.message}`, type: 'error' })
      setPlan([])
      setApiTotalValue(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlan()
  }, [])

  const calculatedTotalValue = useMemo(
    () => plan.reduce((total, item) => total + Number(item.subtotal || item.unitValue * item.quantity), 0),
    [plan],
  )

  const totalValue = apiTotalValue ?? calculatedTotalValue

  return (
    <section className="manager-grid">
      <Feedback message={feedback.message} type={feedback.type} />
      <article className="card card--full">
        <div className="header-row">
          <h2>Production suggestion based on current stock</h2>
          <button type="button" onClick={loadPlan}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading production suggestion...</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product code</th>
                    <th>Product name</th>
                    <th>Unit value</th>
                    <th>Quantity producible</th>
                    <th>Total value</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>${Number(item.unitValue).toFixed(2)}</td>
                      <td>{Number(item.quantity).toFixed(2)}</td>
                      <td>${Number(item.subtotal || item.unitValue * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="total-value">Estimated production value: ${Number(totalValue).toFixed(2)}</p>
          </>
        )}
      </article>
    </section>
  )
}

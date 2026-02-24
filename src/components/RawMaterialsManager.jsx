import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Feedback } from './Feedback'

const emptyForm = { code: '', name: '', stockQuantity: '' }

export function RawMaterialsManager({ onMaterialsChange }) {
  const [materials, setMaterials] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'info' })
  const [loading, setLoading] = useState(true)

  async function loadMaterials() {
    setLoading(true)
    try {
      const data = await api.rawMaterials.list()
      setMaterials(data)
      onMaterialsChange(data)
    } catch (error) {
      setFeedback({ message: `Error loading raw materials: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
  }, [])

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function startEdit(material) {
    setEditingId(material.id)
    setFormData({
      code: material.code,
      name: material.name,
      stockQuantity: material.stockQuantity,
    })
  }

  function clearForm() {
    setEditingId(null)
    setFormData(emptyForm)
  }

  async function submitMaterial(event) {
    event.preventDefault()

    const payload = {
      code: formData.code,
      name: formData.name,
      stockQuantity: Number(formData.stockQuantity),
    }

    try {
      if (editingId) {
        await api.rawMaterials.update(editingId, payload)
        setFeedback({ message: 'Raw material updated successfully.', type: 'success' })
      } else {
        await api.rawMaterials.create(payload)
        setFeedback({ message: 'Raw material created successfully.', type: 'success' })
      }
      clearForm()
      await loadMaterials()
    } catch (error) {
      setFeedback({ message: `Error saving raw material: ${error.message}`, type: 'error' })
    }
  }

  async function deleteMaterial(materialId) {
    try {
      await api.rawMaterials.delete(materialId)
      setFeedback({ message: 'Raw material removed successfully.', type: 'success' })
      await loadMaterials()
    } catch (error) {
      setFeedback({ message: `Error deleting raw material: ${error.message}`, type: 'error' })
    }
  }

  return (
    <section className="manager-grid">
      <Feedback message={feedback.message} type={feedback.type} />

      <article className="card">
        <h2>Raw material registration</h2>
        <form className="form-grid" onSubmit={submitMaterial}>
          <label>
            Code
            <input name="code" value={formData.code} onChange={handleInputChange} required />
          </label>
          <label>
            Name
            <input name="name" value={formData.name} onChange={handleInputChange} required />
          </label>
          <label>
            Stock quantity
            <input
              name="stockQuantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.stockQuantity}
              onChange={handleInputChange}
              required
            />
          </label>
          <div className="actions-row">
            <button type="submit">{editingId ? 'Update raw material' : 'Create raw material'}</button>
            {editingId ? (
              <button type="button" className="secondary" onClick={clearForm}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="card">
        <h2>Raw materials</h2>
        {loading ? (
          <p>Loading materials...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td>{material.code}</td>
                    <td>{material.name}</td>
                    <td>{Number(material.stockQuantity).toFixed(2)}</td>
                    <td className="actions-row">
                      <button type="button" className="secondary" onClick={() => startEdit(material)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => deleteMaterial(material.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  )
}

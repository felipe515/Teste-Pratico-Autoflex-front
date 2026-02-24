import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { Feedback } from './Feedback'

const emptyProductForm = { code: '', name: '', value: '' }
const emptyCompositionForm = { rawMaterialId: '', quantityRequired: '' }

export function ProductsManager({ rawMaterials }) {
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [composition, setComposition] = useState([])
  const [loading, setLoading] = useState(true)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [editingProduct, setEditingProduct] = useState(null)
  const [compositionForm, setCompositionForm] = useState(emptyCompositionForm)
  const [editingCompositionMaterial, setEditingCompositionMaterial] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'info' })
  const [availableRawMaterials, setAvailableRawMaterials] = useState(rawMaterials ?? [])

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  )

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await api.products.list()
      setProducts(data)
      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id)
      }
    } catch (error) {
      setFeedback({ message: `Error loading products: ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function loadComposition(productId) {
    if (!productId) {
      setComposition([])
      return
    }

    try {
      const data = await api.productMaterials.listByProduct(productId)
      setComposition(data)
    } catch (error) {
      setFeedback({ message: `Error loading composition: ${error.message}`, type: 'error' })
    }
  }

  async function loadRawMaterialsIfNeeded() {
    if ((rawMaterials?.length ?? 0) > 0) {
      setAvailableRawMaterials(rawMaterials)
      return
    }

    try {
      const data = await api.rawMaterials.list()
      setAvailableRawMaterials(data)
    } catch (error) {
      setFeedback({ message: `Error loading raw materials: ${error.message}`, type: 'error' })
    }
  }

  useEffect(() => {
    loadProducts()
    loadRawMaterialsIfNeeded()
  }, [])

  useEffect(() => {
    if ((rawMaterials?.length ?? 0) > 0) {
      setAvailableRawMaterials(rawMaterials)
    }
  }, [rawMaterials])

  useEffect(() => {
    loadComposition(selectedProductId)
  }, [selectedProductId])

  function handleProductInputChange(event) {
    const { name, value } = event.target
    setProductForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleCompositionInputChange(event) {
    const { name, value } = event.target
    setCompositionForm((prev) => ({ ...prev, [name]: value }))
  }

  function startProductEdit(product) {
    setEditingProduct(product.id)
    setProductForm({
      code: product.code,
      name: product.name,
      value: product.value,
    })
  }

  function cancelProductEdit() {
    setEditingProduct(null)
    setProductForm(emptyProductForm)
  }

  async function submitProduct(event) {
    event.preventDefault()

    const payload = {
      code: productForm.code,
      name: productForm.name,
      value: Number(productForm.value),
    }

    try {
      if (editingProduct) {
        await api.products.update(editingProduct, payload)
        setFeedback({ message: 'Product updated successfully.', type: 'success' })
      } else {
        await api.products.create(payload)
        setFeedback({ message: 'Product created successfully.', type: 'success' })
      }

      cancelProductEdit()
      await loadProducts()
    } catch (error) {
      setFeedback({ message: `Error saving product: ${error.message}`, type: 'error' })
    }
  }

  async function deleteProduct(productId) {
    try {
      await api.products.delete(productId)
      setFeedback({ message: 'Product removed successfully.', type: 'success' })
      if (selectedProductId === productId) {
        setSelectedProductId(null)
      }
      await loadProducts()
    } catch (error) {
      setFeedback({ message: `Error deleting product: ${error.message}`, type: 'error' })
    }
  }

  function startCompositionEdit(item) {
    setEditingCompositionMaterial(item.rawMaterialId)
    setCompositionForm({
      rawMaterialId: String(item.rawMaterialId),
      quantityRequired: String(item.quantityRequired),
    })
  }

  function cancelCompositionEdit() {
    setEditingCompositionMaterial(null)
    setCompositionForm(emptyCompositionForm)
  }

  async function submitComposition(event) {
    event.preventDefault()
    if (!selectedProductId) {
      return
    }

    const materialId = Number(compositionForm.rawMaterialId)
    const payload = {
      rawMaterialId: materialId,
      quantityRequired: Number(compositionForm.quantityRequired),
    }

    try {
      if (editingCompositionMaterial) {
        await api.productMaterials.update(selectedProductId, editingCompositionMaterial, payload)
        setFeedback({ message: 'Composition updated successfully.', type: 'success' })
      } else {
        await api.productMaterials.create(selectedProductId, payload)
        setFeedback({ message: 'Composition created successfully.', type: 'success' })
      }

      cancelCompositionEdit()
      await loadComposition(selectedProductId)
    } catch (error) {
      setFeedback({ message: `Error saving composition: ${error.message}`, type: 'error' })
    }
  }

  async function deleteComposition(materialId) {
    if (!selectedProductId) {
      return
    }

    try {
      await api.productMaterials.delete(selectedProductId, materialId)
      setFeedback({ message: 'Composition item removed successfully.', type: 'success' })
      await loadComposition(selectedProductId)
    } catch (error) {
      setFeedback({ message: `Error deleting composition: ${error.message}`, type: 'error' })
    }
  }

  return (
    <section className="manager-grid">
      <Feedback message={feedback.message} type={feedback.type} />

      <article className="card">
        <h2>Product registration</h2>
        <form className="form-grid" onSubmit={submitProduct}>
          <label>
            Code
            <input name="code" value={productForm.code} onChange={handleProductInputChange} required />
          </label>
          <label>
            Name
            <input name="name" value={productForm.name} onChange={handleProductInputChange} required />
          </label>
          <label>
            Value
            <input
              name="value"
              type="number"
              step="0.01"
              min="0"
              value={productForm.value}
              onChange={handleProductInputChange}
              required
            />
          </label>
          <div className="actions-row">
            <button type="submit">{editingProduct ? 'Update product' : 'Create product'}</button>
            {editingProduct ? (
              <button type="button" className="secondary" onClick={cancelProductEdit}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="card">
        <h2>Products</h2>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={product.id === selectedProductId ? 'row-selected' : ''}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>${Number(product.value).toFixed(2)}</td>
                    <td className="actions-row">
                      <button type="button" className="secondary" onClick={() => setSelectedProductId(product.id)}>
                        Use in composition
                      </button>
                      <button type="button" className="secondary" onClick={() => startProductEdit(product)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => deleteProduct(product.id)}>
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

      <article className="card card--full">
        <h2>Material composition {selectedProduct ? `for ${selectedProduct.name}` : ''}</h2>
        {!selectedProduct ? (
          <p>Select one product to manage its materials.</p>
        ) : (
          <>
            <form className="form-grid form-grid--inline" onSubmit={submitComposition}>
              <label>
                Raw material
                <select
                  name="rawMaterialId"
                  value={compositionForm.rawMaterialId}
                  onChange={handleCompositionInputChange}
                  required
                  disabled={Boolean(editingCompositionMaterial)}
                >
                  <option value="">Select</option>
                  {availableRawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity required
                <input
                  name="quantityRequired"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={compositionForm.quantityRequired}
                  onChange={handleCompositionInputChange}
                  required
                />
              </label>
              <div className="actions-row">
                <button type="submit">{editingCompositionMaterial ? 'Update composition' : 'Add material'}</button>
                {editingCompositionMaterial ? (
                  <button type="button" className="secondary" onClick={cancelCompositionEdit}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Material code</th>
                    <th>Material name</th>
                    <th>Quantity required</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {composition.map((item) => (
                    <tr key={item.rawMaterialId}>
                      <td>{item.rawMaterialCode}</td>
                      <td>{item.rawMaterialName}</td>
                      <td>{Number(item.quantityRequired).toFixed(2)}</td>
                      <td className="actions-row">
                        <button type="button" className="secondary" onClick={() => startCompositionEdit(item)}>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => deleteComposition(item.rawMaterialId)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>
    </section>
  )
}

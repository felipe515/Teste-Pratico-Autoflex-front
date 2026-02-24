const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function buildUrl(path) {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  return `${normalizedBase}${path}`
}

async function request(path, options = {}) {
  const hasBody = options.body !== undefined && options.body !== null

  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseQuantity(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : value
  }

  return value
}

function canonicalizeProductMaterialPayload(payload = {}) {
  if (!isObject(payload)) {
    return payload
  }

  const productId = payload.productId ?? payload.product?.id
  const rawMaterialId = payload.rawMaterialId ?? payload.materialId ?? payload.rawMaterial?.id
  const requiredQuantity = parseQuantity(
    payload.requiredQuantity ?? payload.quantityRequired ?? payload.quantity,
  )

  return {
    ...payload,
    ...(productId !== undefined ? { productId } : {}),
    ...(rawMaterialId !== undefined ? { rawMaterialId } : {}),
    ...(requiredQuantity !== undefined ? { requiredQuantity } : {}),
  }
}

function canonicalizeProductMaterialResponse(item) {
  if (!isObject(item)) {
    return item
  }

  const requiredQuantity = parseQuantity(item.requiredQuantity ?? item.quantityRequired ?? item.quantity)
  const quantityRequired = requiredQuantity

  const rawMaterialCode = item.rawMaterialCode ?? item.materialCode ?? item.rawMaterial?.code
  const rawMaterialName = item.rawMaterialName ?? item.materialName ?? item.rawMaterial?.name

  return {
    ...item,
    ...(requiredQuantity !== undefined ? { requiredQuantity } : {}),
    ...(quantityRequired !== undefined ? { quantityRequired } : {}),
    ...(rawMaterialCode !== undefined ? { rawMaterialCode } : {}),
    ...(rawMaterialName !== undefined ? { rawMaterialName } : {}),
  }
}

function normalizeCreateProductMaterialPayload(...args) {
  if (args.length === 1 && isObject(args[0])) {
    return canonicalizeProductMaterialPayload(args[0])
  }

  if (args.length === 2 && isObject(args[1])) {
    const [productId, payload] = args
    return canonicalizeProductMaterialPayload({ productId, ...payload })
  }

  if (args.length >= 3) {
    const [productId, rawMaterialId, requiredQuantity] = args
    return canonicalizeProductMaterialPayload({ productId, rawMaterialId, requiredQuantity })
  }

  return {}
}

function normalizeUpdateProductMaterialPayload(...args) {
  if (args.length === 2 && isObject(args[1])) {
    const [associationId, payload] = args
    return { associationId, payload: canonicalizeProductMaterialPayload(payload) }
  }

  if (args.length >= 3 && isObject(args[2])) {
    const [, associationId, payload] = args
    return { associationId, payload: canonicalizeProductMaterialPayload(payload) }
  }

  if (args.length >= 4) {
    const [, associationId, productId, rawMaterialId, requiredQuantity] = args
    return {
      associationId,
      payload: canonicalizeProductMaterialPayload({ productId, rawMaterialId, requiredQuantity }),
    }
  }

  return { associationId: args[0], payload: canonicalizeProductMaterialPayload(args[1]) }
}

function normalizeDeleteProductMaterialArgs(...args) {
  if (args.length === 1) {
    return args[0]
  }

  return args[1]
}

function withRawMaterialDetails(associations, rawMaterials) {
  if (!Array.isArray(associations) || !Array.isArray(rawMaterials)) {
    return associations
  }

  const rawMaterialById = new Map(rawMaterials.map((material) => [Number(material.id), material]))

  return associations.map((association) => {
    const rawMaterial = rawMaterialById.get(Number(association.rawMaterialId))

    return {
      ...association,
      ...(association.rawMaterialCode === undefined && rawMaterial?.code !== undefined
        ? { rawMaterialCode: rawMaterial.code }
        : {}),
      ...(association.rawMaterialName === undefined && rawMaterial?.name !== undefined
        ? { rawMaterialName: rawMaterial.name }
        : {}),
    }
  })
}

export const api = {
  products: {
    list: () => request('/products'),
    create: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },
  rawMaterials: {
    list: () => request('/raw-materials'),
    create: (payload) => request('/raw-materials', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/raw-materials/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => request(`/raw-materials/${id}`, { method: 'DELETE' }),
  },
  productMaterials: {
    list: async () => {
      const associations = await request('/product-materials')
      return associations.map(canonicalizeProductMaterialResponse)
    },
    listByProduct: async (productId) => {
      const [associations, rawMaterials] = await Promise.all([
        api.productMaterials.list(),
        api.rawMaterials.list(),
      ])

      const filtered = associations.filter(
        ({ productId: currentProductId }) => Number(currentProductId) === Number(productId),
      )

      return withRawMaterialDetails(filtered, rawMaterials)
    },
    create: async (...args) => {
      const payload = normalizeCreateProductMaterialPayload(...args)
      const association = await request('/product-materials', { method: 'POST', body: JSON.stringify(payload) })
      return canonicalizeProductMaterialResponse(association)
    },
    getById: async (associationId) => {
      const association = await request(`/product-materials/${associationId}`)
      return canonicalizeProductMaterialResponse(association)
    },
    update: async (...args) => {
      const { associationId, payload } = normalizeUpdateProductMaterialPayload(...args)
      const association = await request(`/product-materials/${associationId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return canonicalizeProductMaterialResponse(association)
    },
    delete: (...args) => {
      const associationId = normalizeDeleteProductMaterialArgs(...args)
      return request(`/product-materials/${associationId}`, { method: 'DELETE' })
    },
  },
  productionPlan: {
    list: () => request('/production/suggestions'),
  },
}

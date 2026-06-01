import api from './client'

export const productsApi = {
  getAll: (params = {}) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getLowStock: (threshold = 10) => api.get('/products/low-stock/', { params: { threshold } }),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
}
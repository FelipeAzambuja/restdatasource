import axios from "axios"

export class RestDataSource {
  constructor(endpoint, options = {}) {
    if (!endpoint) throw new Error("Endpoint é obrigatório")

    this.endpoint = endpoint
    this.records = []
    this.index = -1

    // Configurações
    this.page = options.page || 1
    this.bufferSize = options.bufferSize || 20
    this.primaryKey = options.primaryKey || "id"

    // Estado de paginação
    this.total = 0
    this.hasMore = true
  }

  normalizeResponse(data) {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (data.items && Array.isArray(data.items)) {
      this.total = data.total || data.items.length
      return data.items
    }
    return []
  }

  // ========= Carregamento de página (buffer) =========
  async load(params = {}) {
    try {
      const query = { page: this.page, limit: this.bufferSize, ...params }
      const { data } = await axios.get(this.endpoint, { params: query })

      this.records = this.normalizeResponse(data)
      this.index = this.records.length ? 0 : -1
      this.hasMore = this.records.length >= this.bufferSize

      return { success: true, data: this.records }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // ========= Navegação =========
  current() {
    return this.index >= 0 && this.index < this.records.length
      ? this.records[this.index]
      : null
  }

  async next(params = {}) {
    if (this.index < this.records.length - 1) {
      this.index++
      return this.current()
    }

    // chegou no final do buffer → carregar próxima página
    if (this.hasMore) {
      this.page++
      const res = await this.load(params)
      return res.success ? this.current() : null
    }

    return null // não tem mais dados
  }

  async prev(params = {}) {
    if (this.index > 0) {
      this.index--
      return this.current()
    }

    // chegou no início do buffer → tentar carregar página anterior
    if (this.page > 1) {
      this.page--
      const res = await this.load(params)
      this.index = this.records.length - 1 // ir para o último da página anterior
      return res.success ? this.current() : null
    }

    return null
  }

  first() {
    this.index = this.records.length ? 0 : -1
    return this.current()
  }

  last() {
    this.index = this.records.length ? this.records.length - 1 : -1
    return this.current()
  }

  // ========= Busca no servidor =========
  async search(params = {}) {
    try {
      this.page = 1
      const { data } = await axios.get(this.endpoint, {
        params: { ...params, limit: this.bufferSize },
      })
      this.records = this.normalizeResponse(data)
      this.index = this.records.length ? 0 : -1
      this.hasMore = this.records.length >= this.bufferSize
      return { success: true, data: this.records }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async findBy(field, value) {
    return this.search({ [field]: value })
  }

  // ========= CRUD =========
  async insert(payload) {
    try {
      if (!payload || typeof payload !== "object") {
        throw new Error("Payload inválido para insert")
      }
      const { data } = await axios.post(this.endpoint, payload)
      const created = data || {}
      this.records.push(created)
      this.index = this.records.length - 1
      return { success: true, data: created }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async update(id, payload) {
    try {
      if (!id) throw new Error("ID é obrigatório para update")
      const { data } = await axios.put(`${this.endpoint}/${id}`, payload)
      const updated = data || {}
      const idx = this.records.findIndex(r => r[this.primaryKey] === id)
      if (idx >= 0) this.records[idx] = updated
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async delete(id) {
    try {
      if (!id) throw new Error("ID é obrigatório para delete")
      await axios.delete(`${this.endpoint}/${id}`)
      const idx = this.records.findIndex(r => r[this.primaryKey] === id)
      if (idx >= 0) {
        this.records.splice(idx, 1)
        if (this.index >= this.records.length) {
          this.index = this.records.length - 1
        }
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
}

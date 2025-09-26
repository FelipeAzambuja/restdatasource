import axios, { AxiosInstance } from "axios"

export class RestDataSource<T = any> {

    axios: AxiosInstance;
    endpoint: string;
    records: T[];
    index: number;
    page: number;
    bufferSize: number;
    primaryKey: string;
    count: number;
    count_pages: number;
    loading: boolean;
    hasMore: boolean;
    data_search: Record<string, string | number | boolean> | null = {};
    last_move: string | null = null;

    dump() {

        return JSON.parse(JSON.stringify({
            records: this.records.length,
            index: this.index,
            page: this.page,
            count: this.count,
            count_pages: this.count_pages,
            loading: this.loading,
            hasMore: this.hasMore,
        }));
    }


    constructor(endpoint: string, options = {} as {
        axios?: AxiosInstance;
        page?: number;
        bufferSize?: number;
        primaryKey?: string;
    }) {
        if (!endpoint) throw new Error("Endpoint é obrigatório");


        this.axios = options.axios || axios.create();

        this.endpoint = endpoint;
        this.records = [];
        this.index = 0;

        // Configurações
        this.page = options.page || 1;
        this.bufferSize = options.bufferSize || 100;
        this.primaryKey = options.primaryKey || "id";

        // Estado de paginação
        this.count = 0;
        this.count_pages = 0;
        this.hasMore = false;

        this.loading = false;
    }


    async goto(index: number): Promise<T | null> {
        const page = Math.floor(index / this.bufferSize) + 1;
        this.page = page;
        await this.load();
        this.index = index % this.bufferSize;
        return this.current();
    }

    // ========= Carregamento de página (buffer) =========

    async load(): Promise<{ success: boolean; error?: string; data?: T[]; }> {
        try {
            this.loading = true;
            const query = { search: null as any | null, page: this.page, limit: this.bufferSize };
            if (this.data_search) {
                query.search = this.data_search;
            }
            const { data } = await this.axios.get(this.endpoint, { params: query });
            this.loading = false;

            this.records = data.rows;
            this.count = data.count;
            this.count_pages = Math.ceil(this.count / this.bufferSize);
            // this.index = 0;
            this.hasMore = this.count > (this.page * this.bufferSize);
            // this.first();
            return { success: true, data: this.records };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // ========= Navegação =========

    all(): T[] {
        return this.records;
    }

    current(): T | null {
        return this.index >= 0 && this.index < this.records.length
            ? this.records[this.index]
            : null;
    }



    async next(): Promise<T | null> {

        this.last_move = "next";
        if (this.index < this.records.length - 1) {
            this.index++;
            return this.current();
        }

        // chegou no final do buffer → carregar próxima página
        if (this.hasMore) {
            this.page++;
            const res = await this.load();
            this.index = 0;
            return res.success ? this.current() : null;
        }
        return this.current(); // não tem mais dados
    }

    async prev(): Promise<T | null> {

        this.last_move = "prev";
        if (this.index > 0) {
            this.index--;
            return this.current();
        }

        // chegou no início do buffer → tentar carregar página anterior
        if (this.page > 1) {
            this.page--;
            const res = await this.load();
            this.index = this.records.length - 1; // ir para o último da página anterior
            return res.success ? this.current() : null;
        }
        return this.current();
    }

    async first(): Promise<T | null> {
        return this.goto(0);
    }

    async last(): Promise<T | null> {
        return this.goto(this.count - 1);
    }

    async search(params = {}): Promise<{ success: boolean; error?: string; data?: T[]; }> {
        this.data_search = params;
        this.page = 1;
        return this.load();
    }


    async findBy(field: string, value: string | number | boolean | null): Promise<{ success: boolean; error?: string; data?: T[]; }> {
        return this.search({ [field]: value });
    }

    // ========= CRUD =========
    async insert(payload: any): Promise<{ success: boolean; error?: string; data?: T; }> {
        try {
            if (!payload || typeof payload !== "object") {
                throw new Error("Payload inválido para insert");
            }
            this.loading = true;
            const { data } = await this.axios.post(this.endpoint, payload);
            this.loading = false;
            const created = data || {};
            this.records.push(created);
            this.index = this.records.length - 1;
            return { success: true, data: created };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async update(id: string | number, payload: any): Promise<{ success: boolean; error?: string; data?: T; }> {
        try {
            if (!id) throw new Error("ID é obrigatório para update");
            this.loading = true;
            const { data } = await this.axios.put(`${this.endpoint}/${id}`, payload);
            this.loading = false;
            const updated = data || {};
            const idx = this.records.findIndex(r => r[this.primaryKey] === id);
            if (idx >= 0) this.records[idx] = updated;
            return { success: true, data: updated };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async delete(id: string | number): Promise<{ success: boolean; error?: string; }> {
        try {
            if (!id) throw new Error("ID é obrigatório para delete");
            this.loading = true;
            await this.axios.delete(`${this.endpoint}/${id}`);
            this.loading = false;
            const idx = this.records.findIndex(r => r[this.primaryKey] === id);
            if (idx >= 0) {
                this.records.splice(idx, 1);
                if (this.index >= this.records.length) {
                    this.index = this.records.length - 1;
                }
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

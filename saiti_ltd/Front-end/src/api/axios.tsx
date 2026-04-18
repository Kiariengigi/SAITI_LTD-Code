import axios from 'axios'

const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.DEV
        ? 'http://0.0.0.0:7000/api'
        : 'https://saiti-ltd-backend.onrender.com/api')

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const accessToken = window.localStorage.getItem('accessToken')

        if (accessToken) {
            config.headers = config.headers ?? {}
            ;(config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`
        }
    }

    return config
})

export default api
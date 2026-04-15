import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://saiti-ltd-backend.onrender.com/api'

export default axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
})
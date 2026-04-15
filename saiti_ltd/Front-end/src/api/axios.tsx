import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL 
console.log(apiBaseUrl)

export default axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
})
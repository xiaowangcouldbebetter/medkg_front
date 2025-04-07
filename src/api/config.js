// API配置文件
const API_BASE_URL = '/api';

export default {
  API_BASE_URL,
  endpoints: {
    publicKey: '/public-key/',
    login: '/login/',
    register: '/register/',
    logout: '/logout/',
    userInfo: '/user/info/',
    adminLogin: '/admin/login/',
    adminDashboard: '/admin/dashboard/'
  }
}; 
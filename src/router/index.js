import { createRouter, createWebHashHistory } from 'vue-router'
import layout from '../layout/index.vue'
import login from '../views/login.vue'

const routes = [
  {
    path: '/login',
    name: '登录',
    component: login,
    hidden: true,
  },
  {
    path: '/admin/login',
    name: '管理员登录',
    component: () => import('../views/AdminLogin.vue'),
    hidden: true,
  },
  {
    path: '/admin/dashboard',
    name: '管理员控制台',
    component: () => import('../views/admin/Dashboard.vue'),
    hidden: true,
    meta: { requiresAdminAuth: true },
  },
  {
    path: '/',
    name: 'layout',//路径为layout
    component: layout,
    hidden: true,
    // 暂时移除认证要求
    // meta: { requiresAuth: true },
  },
  {
    path: '/',
    name: '智能问答',
    component: layout,
    icon: 'List',
    // 暂时移除认证要求
    // meta: { requiresAuth: true },
    children: [
      {
        path: '/chat',
        name: '问答窗口',
        component: () => import('../views/chat/chat.vue'),
        // meta: { requiresAuth: true }
      },
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 暂时禁用导航守卫

router.beforeEach((to, from, next) => {
  // 检查普通用户登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const userToken = localStorage.getItem('token');
    if (!userToken) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } 
  // 检查管理员登录权限
  else if (to.matched.some(record => record.meta.requiresAdminAuth)) {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      next({
        path: '/admin/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});


// 简化的导航守卫
router.beforeEach((to, from, next) => {
  next(); // 允许所有访问
});

export default router

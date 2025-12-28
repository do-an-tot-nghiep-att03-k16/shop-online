import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ChangePassword from './pages/ChangePassword'
import AdminLogin from './pages/AdminLogin'
import Profile from './pages/Profile'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ShopBySlug from './pages/ShopBySlug'
import OnSale from './pages/OnSale'
import ProductDetail from './pages/ProductDetail'
import ProductDetailBySlug from './pages/ProductDetailBySlug'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionGuard from './components/PermissionGuard'
import AdminLayout from './components/Layout/AdminLayout'
import WebsiteLayout from './components/Layout/WebsiteLayout'
import Dashboard from './pages/Admin/Dashboard'
import UserManagement from './pages/Admin/UserManagement'
import CategoryManagement from './pages/Admin/CategoryManagement'
import ProductManagement from './pages/Admin/ProductManagement'
import CouponManagement from './pages/Admin/CouponManagement'
import OrderManagement from './pages/Admin/OrderManagement'
import InventoryManagement from './pages/Admin/InventoryManagement'
import TransactionHistory from './pages/Admin/TransactionHistory'
import { PERMISSIONS } from './config/permissions'
import NotFound from './pages/NotFound'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Payment from './pages/Payment'
import MyOrders from './pages/MyOrders'
import ErrorBoundary from './components/Common/ErrorBoundary'
import BlogList from './pages/Blog/BlogList'
import BlogDetail from './pages/Blog/BlogDetail'
import { SettingProvider } from './context/SettingContext'
import './App.css'
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'

function App() {
    const { getProfile, isAuthenticated } = useAuth()

    // Initialize user profile on app load
    useEffect(() => {
        const initializeApp = async () => {
            if (isAuthenticated) {
                try {
                    console.log('🚀 App initializing - calling getProfile to refresh user data')
                    await getProfile()
                    console.log('✅ User profile refreshed on app startup')
                } catch (error) {
                    console.error('❌ Failed to initialize user profile:', error)
                }
            }
        }

        initializeApp()
    }, [isAuthenticated, getProfile])

    return (
        <ErrorBoundary showDetails={true}>
            <SettingProvider>
                <Router>
                <Routes>
                {/* ===== PUBLIC ROUTES (Website) ===== */}
                <Route path="/" element={<WebsiteLayout />}>
                    <Route index element={<Home />} />
                </Route>
                <Route path="/shop" element={<WebsiteLayout />}>
                    <Route index element={<Shop />} />
                    <Route path="sale" element={<OnSale />} />
                    <Route path=":slug" element={<ShopBySlug />} />
                </Route>
                <Route path="/product/:id" element={<WebsiteLayout />}>
                    <Route index element={<ProductDetail />} />
                </Route>
                <Route path="/p/:slug" element={<WebsiteLayout />}>
                    <Route index element={<ProductDetailBySlug />} />
                </Route>
                <Route path="/blog" element={<WebsiteLayout />}>
                    <Route index element={<BlogList />} />
                    <Route path="category/:categorySlug" element={<BlogList />} />
                    <Route path=":slug" element={<BlogDetail />} />
                </Route>
                <Route path="/cart" element={<WebsiteLayout />}>
                    <Route index element={<Cart />} />
                </Route>
                
                {/* ===== PROTECTED ROUTES (Checkout - Cần đăng nhập) ===== */}
                <Route path="/checkout" element={<ProtectedRoute requireAuth><WebsiteLayout /></ProtectedRoute>}>
                    <Route index element={<Checkout />} />
                </Route>
                <Route path="/payment/:orderNumber" element={<ProtectedRoute requireAuth><WebsiteLayout /></ProtectedRoute>}>
                    <Route index element={<Payment />} />
                </Route>
                <Route path="/order-success/:orderNumber" element={<ProtectedRoute requireAuth><WebsiteLayout /></ProtectedRoute>}>
                    <Route index element={<OrderSuccess />} />
                </Route>
                
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/verify" element={<VerifyEmail />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* ===== PROTECTED ROUTES (Website - Cần đăng nhập) ===== */}
                {/* <Route
                    path="/cart"
                    element={
                        <ProtectedRoute requireAuth>
                            <WebsiteLayout>
                                <Cart />
                            </WebsiteLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-orders"
                    element={
                        <ProtectedRoute requireAuth>
                            <WebsiteLayout>
                                <MyOrders />
                            </WebsiteLayout>
                        </ProtectedRoute>
                    }
                /> */}
                <Route path="/profile" element={<ProtectedRoute requireAuth><WebsiteLayout /></ProtectedRoute>}>
                    <Route index element={<Profile />} />
                </Route>
                <Route path="/my-orders" element={<ProtectedRoute requireAuth><WebsiteLayout /></ProtectedRoute>}>
                    <Route index element={<MyOrders />} />
                </Route>

                {/* ===== TEST ADMIN ROUTE (No protection) ===== */}
                <Route path="/admin-test" element={<div><h1>ADMIN TEST - NO PROTECTION</h1><p>If you see this, routing works!</p></div>} />

                {/* ===== ADMIN PANEL ROUTES (Admin & Shop only) ===== */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requireAuth={false} requireAdminAccess>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Redirect /admin to /admin/dashboard */}
                    <Route
                        index
                        element={<Navigate to="/admin/dashboard" replace />}
                    />

                    {/* Dashboard - Admin & Shop */}
                    <Route
                        path="dashboard"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_DASHBOARD}
                            >
                                <Dashboard />
                            </PermissionGuard>
                        }
                    />

                    {/* User Management - ONLY ADMIN */}
                    <Route
                        path="users"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_USERS}
                                redirect
                            >
                                <UserManagement />
                            </PermissionGuard>
                        }
                    />

                    {/* Product Management - Admin & Shop */}
                    <Route
                        path="products"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_PRODUCTS}
                                redirect
                            >
                                <ProductManagement />
                            </PermissionGuard>
                        }
                    />

                    {/* Order Management - Admin & Shop */}
                    <Route
                        path="orders"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_ORDERS}
                                redirect
                            >
                                <OrderManagement />
                            </PermissionGuard>
                        }
                    />

                    {/* Transaction History - Admin & Shop */}
                    <Route
                        path="transactions"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_ORDERS}
                            >
                                <TransactionHistory />
                            </PermissionGuard>
                        }
                    />
                    
                    <Route
                        path="inventory"
                        element={<InventoryManagement />}
                    />


                    <Route
                        path="categories"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_CATEGORIES}
                                redirect
                            >
                                <CategoryManagement />
                            </PermissionGuard>
                        }
                    />

                    {/* Coupon Management - Admin & Shop */}
                    <Route
                        path="coupons"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_PRODUCTS}
                                redirect
                            >
                                <CouponManagement />
                            </PermissionGuard>
                        }
                    />

                    {/* Reports - Admin & Shop (view only) */}
                    {/* <Route
                        path="reports"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_REPORTS}
                                redirect
                            >
                                <Reports />
                            </PermissionGuard>
                        }
                    /> */}

                    {/* Settings - ONLY ADMIN */}
                    {/* <Route
                        path="settings"
                        element={
                            <PermissionGuard
                                permission={PERMISSIONS.VIEW_SETTINGS}
                                redirect
                            >
                                <Settings />
                            </PermissionGuard>
                        }
                    /> */}
                </Route>

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
            </SettingProvider>
        </ErrorBoundary>
    )
}

export default App

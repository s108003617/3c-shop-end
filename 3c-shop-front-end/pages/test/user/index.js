import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { initUserData, useAuth } from '@/hooks/use-auth'
import {
  login,
  logout,
  googleLogin,
  getUserById,
} from '@/services/user'
import { Toaster, toast } from 'react-hot-toast'
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { SiLine } from 'react-icons/si'
import {
  lineLoginRequest,
} from '@/services/user'
import useFirebase from '@/hooks/use-firebase'

const parseJwt = (token) => {
  const base64Payload = token.split('.')[1]
  const payload = Buffer.from(base64Payload, 'base64')
  return JSON.parse(payload.toString())
}

export default function UserTest() {
  const [user, setUser] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const { auth, setAuth } = useAuth()
  const { loginGoogle, logoutFirebase } = useFirebase()
  const router = useRouter()

  const handleFieldChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value })
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleLogin = async () => {
    const res = await login(user)
    if (res.data.status === 'success') {
      const jwtUser = parseJwt(res.data.data.accessToken)
      const res1 = await getUserById(jwtUser.id)
      if (res1.data.status === 'success') {
        const dbUser = res1.data.data.user
        const userData = { ...initUserData }
        for (const key in userData) {
          if (Object.hasOwn(dbUser, key)) {
            userData[key] = dbUser[key]
          }
        }
        setAuth({ isAuth: true, userData })
        toast.success('已成功登入')
        router.push('/test/user/profile')
      } else {
        toast.error('登入後無法得到會員資料')
      }
    } else {
      toast.error('登入失敗')
    }
  }

  const handleLogout = async () => {
    logoutFirebase()
    const res = await logout()
    if (res.data.status === 'success') {
      toast.success('已成功登出')
      setAuth({ isAuth: false, userData: initUserData })
    } else {
      toast.error('登出失敗')
    }
  }

  const handleLineLogin = async () => {
    if (auth.isAuth) return
    const lineLoginUrl = await lineLoginRequest()
    window.location.href = lineLoginUrl
  }

  const handleGoogleLogin = async () => {
    if (auth.isAuth) return
    loginGoogle(async (providerData) => {
      const res = await googleLogin(providerData)
      if (res.data.status === 'success') {
        const jwtUser = parseJwt(res.data.data.accessToken)
        const res1 = await getUserById(jwtUser.id)
        if (res1.data.status === 'success') {
          const dbUser = res1.data.data.user
          const userData = { ...initUserData }
          for (const key in userData) {
            if (Object.hasOwn(dbUser, key)) {
              userData[key] = dbUser[key]
            }
          }
          setAuth({ isAuth: true, userData })
          toast.success('已成功登入')
          router.push('/test/user/profile')
        } else {
          toast.error('登入後無法得到會員資料')
        }
      } else {
        toast.error('登入失敗')
      }
    }).catch((error) => {
      toast.error('Google 登入失敗')
    })
  }

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">會員登入</h2>
              <form>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="帳號"
                    name="username"
                    value={user.username}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="mb-3 position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="密碼"
                    name="password"
                    value={user.password}
                    onChange={handleFieldChange}
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                    onClick={togglePasswordVisibility}
                    style={{ zIndex: 10 }}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    保持登入狀態
                  </label>
                </div>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleLogin}
                  >
                    登入
                  </button>
                </div>
              </form>
              <div className="text-center mt-3">
                <Link
                  href="/test/user/forget-password"
                  className="text-decoration-none"
                >
                  忘記密碼？
                </Link>
              </div>
              <div className="text-center mt-2">
                <Link
                  href="/test/user/register"
                  className="text-decoration-none"
                >
                  還沒有帳號？立即註冊
                </Link>
              </div>
              <hr />
              <div className="text-center">
                <p>快速登入</p>
                <div className="d-flex justify-content-center gap-3">
                  <button className="btn btn-success" onClick={handleLineLogin}>
                    <SiLine /> Line
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleGoogleLogin}
                  >
                    <FaGoogle /> Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .btn-primary {
            background-color: #ff6433;
            border: none;
            color: white;
          }
          body {
            font-family: 'Open Sans', sans-serif;
          }
        `}
      </style>
      <Toaster />
    </div>
  )
}
import express from 'express'
const router = express.Router()

import { createOtp, updatePassword } from '#db-helpers/otp.js'

import transporter from '#configs/mail.js'
import 'dotenv/config.js'

// 電子郵件文字訊息樣版
const mailText = (otpToken) => `親愛的3C SHOP會員 您好，
通知重設密碼所需要的驗証碼，
請輸入以下的6位數字，重設密碼頁面的"電子郵件驗証碼"欄位中。
請注意驗証碼將於寄送後30分鐘後到期:
    
${otpToken}
    
敬上

3C SHOP`

// create otp
router.post('/otp', async (req, res, next) => {
  const { email } = req.body

  if (!email) return res.json({ status: 'error', message: '缺少必要資料' })

  // 建立otp資料表記錄，成功回傳otp記錄物件，失敗為空物件{}
  const otp = await createOtp(email)

  // console.log(otp)

  if (!otp.token)
    return res.json({ status: 'error', message: 'Email錯誤或期間內重覆要求' })

  // 寄送email
  const mailOptions = {
    // 這裡要改寄送人名稱，email在.env檔中代入
    from: `"support"<${process.env.SMTP_TO_EMAIL}>`,
    to: email,
    subject: '重設密碼要求的電子郵件驗証碼',
    text: mailText(otp.token),
  }

  // 寄送email
  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      // 失敗處理
      // console.log(err)
      return res.json({ status: 'error', message: '發送電子郵件失敗' })
    } else {
      // 成功回覆的json
      return res.json({ status: 'success', data: null })
    }
  })
})

// 重設密碼用
router.post('/reset', async (req, res) => {
  const { email, token, password } = req.body

  if (!token || !email || !password) {
    return res.json({ status: 'error', message: '缺少必要資料' })
  }

  // updatePassword中驗証otp的存在與合法性(是否有到期)
  const result = await updatePassword(email, token, password)

  if (!result) {
    return res.json({ status: 'error', message: '修改密碼失敗' })
  }

  // 成功
  return res.json({ status: 'success', data: null })
})

export default router

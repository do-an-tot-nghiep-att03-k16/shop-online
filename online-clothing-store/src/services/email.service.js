'use strict'

const { newOtp, deleteTokenByEmail } = require('./otp.service')
const { getTemplate } = require('./template.service')
const { NotFoundError } = require('../core/error.response')
const { replacePlaceholder } = require('../utils')
const emailUser = require('../configs/email.config')
const transport = require('../dbs/init.nodemailer')
// const {
//     app: { url },
// } = require('../configs/mongodb.config')

const { url } = require('../configs/url_verify.config')

const sendEmailLinkVerify = async ({
    html,
    toEmail,
    subject = 'Xác nhận Email đăng ký!',
    text = 'Xác nhận...',
}) => {
    try {
        const mailOptions = {
            from: `'${emailUser.NAME} <${emailUser.EMAIL}>'`,
            to: toEmail,
            subject,
            text,
            html,
        }

        transport.sendMail(mailOptions, (err, info) => {
            if (err) {
                return console.log(err)
            }

            // console.log('Message sent::', info.messageId)
        })
    } catch (error) {
        console.error(`error send Email::`, error)
        return error
    }
}
const sendEmailToken = async ({ email = null }) => {
    try {
        await deleteTokenByEmail({ email })
        //1. gettoken
        const token = await newOtp({ email })
        //2. getTemplate
        const template = await getTemplate('HTML EMAIL TOKEN')

        if (!template) throw NotFoundError('Template not found')

        const content = replacePlaceholder(template.tem_html, {
            link_verify: `${url}/verify?token=${token.otp_token}`,
            // link_verify: `https://google.com`,
            year: `${new Date().getFullYear()} `,
        })

        // console.log(`Link verify:: ${url}/verify?token=${token.otp_token}`)

        // 3.send email
        sendEmailLinkVerify({
            html: content,
            toEmail: email,
            subject: 'Vui lòng xác nhận địa chỉ Email đăng ký!',
        }).catch((err) => console.error(err))

        return 1
    } catch (error) {
        console.error('Error send Email::', error)
        throw error
    }
}

module.exports = {
    sendEmailLinkVerify,
    sendEmailToken,
}

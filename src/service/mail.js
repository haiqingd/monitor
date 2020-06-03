const nodemailer = require("nodemailer");
const emlcfg = require("../../config/config.js");

const mailConfig = {
  user: emlcfg.username,
  pass: emlcfg.lisence
}

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: mailConfig
    });
  }
  async sendMail(receiver, title, content) {
    const info = await this.transporter.sendMail({
      from: `WorkingScheduleSystem <${mailConfig.user}>`,
      to: receiver,
      subject: title,
      html: content
    });
  }
}

module.exports = new MailService()
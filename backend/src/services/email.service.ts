import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Corrigido: método correto é createTransport
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@sistemapagamentos.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${options.to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verificação de Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Sistema de Pagamentos!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${firstName}!</h2>
            <p>Obrigado por se cadastrar em nosso sistema. Para começar a usar sua conta, você precisa verificar seu email.</p>
            <p>Clique no botão abaixo para verificar seu email:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar Email</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px;">${verificationUrl}</p>
            <p><strong>Este link expira em 24 horas.</strong></p>
          </div>
          <div class="footer">
            <p>Se você não criou esta conta, pode ignorar este email.</p>
            <p>© 2024 Sistema de Pagamentos - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo ao Sistema de Pagamentos!
      
      Olá, ${firstName}!
      
      Para verificar seu email, acesse: ${verificationUrl}
      
      Este link expira em 24 horas.
      
      Se você não criou esta conta, pode ignorar este email.
    `;

    await this.sendEmail({
      to: email,
      subject: '✅ Verificação de Email - Sistema de Pagamentos',
      html,
      text
    });
  }

  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperação de Senha</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #dc3545; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <h2>Olá, ${firstName}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong> Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.
            </div>
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px;">${resetUrl}</p>
            <p><strong>Este link expira em 10 minutos por segurança.</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 Sistema de Pagamentos - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Recuperação de Senha - Sistema de Pagamentos
      
      Olá, ${firstName}!
      
      Para redefinir sua senha, acesse: ${resetUrl}
      
      Este link expira em 10 minutos.
      
      Se você não solicitou esta recuperação, ignore este email.
    `;

    await this.sendEmail({
      to: email,
      subject: '🔒 Recuperação de Senha - Sistema de Pagamentos',
      html,
      text
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #28a745; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .features { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Conta Verificada com Sucesso!</h1>
          </div>
          <div class="content">
            <h2>Parabéns, ${firstName}!</h2>
            <p>Sua conta foi verificada e está pronta para uso. Agora você pode aproveitar todos os recursos do nosso sistema de pagamentos:</p>
            
            <div class="features">
              <h3>🚀 O que você pode fazer agora:</h3>
              <ul>
                <li>💳 Processar pagamentos com cartão de crédito</li>
                <li>📱 Gerar pagamentos PIX instantâneos</li>
                <li>💾 Salvar cartões para pagamentos futuros</li>
                <li>📊 Acompanhar histórico de transações</li>
                <li>🔒 Segurança máxima em todas as operações</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Acessar Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>Precisa de ajuda? Entre em contato conosco!</p>
            <p>© 2024 Sistema de Pagamentos - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: '🎉 Conta Verificada - Sistema de Pagamentos',
      html
    });
  }
}

export const emailService = new EmailService();
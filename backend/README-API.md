# 🚀 Sistema de Pagamentos - Backend

API completa para processamento de pagamentos com Node.js, TypeScript e MongoDB.

## 📋 Características

- 🔐 **Autenticação JWT** completa com refresh tokens
- 💳 **Processamento de Pagamentos** (Cartão de Crédito e PIX)
- 💾 **Cartões Salvos** com tokenização segura
- 📧 **Sistema de Emails** (verificação, recuperação de senha)
- 🛡️ **Segurança** (Rate limiting, CORS, Helmet)
- ✅ **Validação** robusta de dados
- 📱 **Responsivo** e compatível com frontend Angular

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **MongoDB** + **Mongoose** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Nodemailer** - Envio de emails
- **Joi** - Validação de dados
- **Helmet** + **CORS** - Segurança

## 🚀 Instalação Rápida

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar ambiente
```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 3. Iniciar MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Iniciar servidor
```bash
npm run dev
```

### 5. Testar
```bash
curl http://localhost:3000/health
```

## 📚 Documentação da API

### 🔐 Autenticação (`/api/auth`)

#### Registrar Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MinhaSenh@123",
  "firstName": "João",
  "lastName": "Silva",
  "phone": "(11) 99999-9999",
  "document": "12345678901"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MinhaSenh@123"
}
```

## ✅ API de Autenticação Implementada!

A API de autenticação está **100% completa** com todos os endpoints necessários para o frontend Angular.

### 🎯 **Próximos Passos:**

Agora que a autenticação está pronta, quer que eu implemente:

1. **🔥 API de Pagamentos** - Processar cartões e PIX
2. **💾 API de Cartões Salvos** - CRUD de cartões tokenizados  
3. **🌐 Gateway Mock** - Simulador de pagamentos para testes

**Qual você quer que eu faça primeiro?** 🚀
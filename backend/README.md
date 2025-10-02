# Backend - Sistema de Pagamentos

## 🚀 Setup e Instalação

### Pré-requisitos
- Node.js 18+ 
- MongoDB 6+
- npm ou yarn

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas configurações
```

### 3. Configurar MongoDB

#### Opção A: MongoDB Local
```bash
# Instalar MongoDB
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# macOS: brew install mongodb-community
# Linux: https://docs.mongodb.com/manual/administration/install-on-linux/

# Iniciar MongoDB
mongod
```

#### Opção B: MongoDB Atlas (Cloud)
1. Criar conta em https://cloud.mongodb.com
2. Criar cluster gratuito
3. Obter string de conexão
4. Atualizar `MONGODB_URI` no `.env`

### 4. Iniciar o Servidor
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm run build
npm start
```

## 📡 Endpoints da API

### Autenticação (`/api/auth`)
- `POST /register` - Cadastro de usuário
- `POST /login` - Login 
- `POST /logout` - Logout
- `POST /refresh` - Renovar token
- `GET /profile` - Obter perfil
- `PUT /profile` - Atualizar perfil
- `POST /change-password` - Alterar senha
- `POST /forgot-password` - Esqueci senha
- `POST /reset-password` - Resetar senha
- `POST /verify-email` - Verificar email
- `POST /resend-verification` - Reenviar verificação

### Pagamentos (`/api/payments`)
- `POST /initiate` - Iniciar transação
- `POST /credit-card` - Processar cartão
- `POST /pix` - Processar PIX
- `GET /pix/:id/status` - Status do PIX
- `GET /:id` - Obter transação

### Cartões Salvos (`/api/cards`)
- `GET /` - Listar cartões do usuário
- `POST /` - Salvar novo cartão
- `GET /:id` - Obter cartão específico
- `PUT /:id` - Atualizar cartão
- `DELETE /:id` - Remover cartão
- `PATCH /:id/set-default` - Definir como padrão

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor desenvolvimento
npm run build        # Build para produção
npm start           # Servidor produção
npm test            # Executar testes
npm run test:watch  # Testes em modo watch
npm run lint        # Verificar código
npm run lint:fix    # Corrigir código automaticamente
```

## 🗄️ Estrutura do Banco de Dados

### Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String (optional),
  document: String (optional),
  isEmailVerified: Boolean,
  isActive: Boolean,
  refreshTokens: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Transactions
```javascript
{
  _id: ObjectId,
  orderId: String,
  userId: ObjectId (optional),
  amount: Number,
  currency: String,
  paymentMethod: String, // 'credit_card' | 'pix'
  status: String, // 'PENDING' | 'PROCESSING' | 'APPROVED' | 'DECLINED' | 'FAILED' | 'EXPIRED'
  customer: {
    name: String,
    email: String,
    document: String (optional)
  },
  returnUrl: String,
  callbackUrl: String,
  bankTransactionId: String (optional),
  pixCode: String (optional),
  qrCodeImage: String (optional),
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### SavedCards
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  cardToken: String (encrypted),
  lastFourDigits: String,
  cardBrand: String, // 'visa' | 'mastercard' | 'amex' | 'elo'
  cardHolderName: String,
  expirationMonth: String,
  expirationYear: String,
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Segurança

### Autenticação JWT
- Access Token: 1 hora de validade
- Refresh Token: 7 dias de validade
- Tokens assinados com HS256

### Criptografia
- Senhas: bcrypt com salt 12
- Dados sensíveis: AES-256-GCM
- Tokens de cartão: Nunca expostos na API

### Rate Limiting
- 100 requests por 15 minutos por IP
- Endpoints de login: 5 tentativas por 15 minutos

### Validação
- Joi para validação de entrada
- Sanitização automática
- Proteção contra NoSQL injection

## 🧪 Testando a API

### Health Check
```bash
curl http://localhost:3000/health
```

### Exemplo de Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "MinhaSenh@123",
    "firstName": "João",
    "lastName": "Silva"
  }'
```

### Exemplo de Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "MinhaSenh@123"
  }'
```

## 📊 Monitoramento

### Logs
- Requests/responses automaticamente logados
- Errors com stack trace em desenvolvimento
- Logs estruturados para produção

### Health Check
- `GET /health` - Status da API
- Informações sobre conectividade do banco
- Timestamp e versão da API

## 🚀 Deploy

### Variáveis de Produção
```env
NODE_ENV=production
MONGODB_URI=sua_string_de_conexao_mongodb
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_REFRESH_SECRET=seu_refresh_secret_super_seguro
```

### Build
```bash
npm run build
npm start
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do servidor
2. Verificar conectividade com MongoDB
3. Verificar variáveis de ambiente
4. Consultar documentação da API
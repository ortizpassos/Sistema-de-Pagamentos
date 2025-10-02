# 🚀 Instalação Rápida do Backend

## 1. Entrar na pasta do backend
```bash
cd backend
```

## 2. Instalar dependências
```bash
npm install
```

## 3. Configurar ambiente
```bash
# Copiar arquivo de configuração
cp .env.example .env

# Editar o arquivo .env (opcional para teste inicial)
# Os valores padrão funcionam para desenvolvimento local
```

## 4. Instalar e iniciar MongoDB

### Windows:
```bash
# Baixar e instalar MongoDB Community Server
# https://www.mongodb.com/try/download/community

# Ou usar chocolatey:
choco install mongodb

# Iniciar serviço
net start MongoDB
```

### macOS:
```bash
# Instalar via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar serviço
brew services start mongodb-community
```

### Linux (Ubuntu/Debian):
```bash
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar serviço
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 🌩️ Alternativa: MongoDB Atlas (Cloud - Grátis)
1. Criar conta em https://cloud.mongodb.com
2. Criar cluster gratuito
3. Obter string de conexão
4. Atualizar `MONGODB_URI` no `.env`

## 5. Iniciar o servidor
```bash
npm run dev
```

## ✅ Testar se funcionou
```bash
# Verificar health check
curl http://localhost:3000/health

# Deve retornar:
# {
#   "success": true,
#   "message": "Sistema de Pagamentos API is running",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "version": "1.0.0"
# }
```

## 🎯 Pronto!
- Backend rodando em: http://localhost:3000
- API disponível em: http://localhost:3000/api
- Health check: http://localhost:3000/health

## ⚠️ Problemas Comuns

### MongoDB não conecta:
```bash
# Verificar se o serviço está rodando
# Windows: services.msc > MongoDB
# macOS: brew services list | grep mongodb
# Linux: sudo systemctl status mongod
```

### Porta 3000 em uso:
```bash
# Alterar porta no arquivo .env
PORT=3001
```

### Erros de TypeScript:
```bash
# Instalar dependências de tipos
npm install --save-dev @types/node @types/express
```

## 📚 Próximos Passos
1. Backend funcionando ✅
2. Implementar endpoints de autenticação
3. Implementar endpoints de pagamento
4. Conectar com o frontend Angular
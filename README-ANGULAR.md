# Sistema de Pagamentos - Angular

Uma aplicação Angular moderna para processamento seguro de pagamentos com suporte a Cartão de Crédito e PIX.

## 🚀 Características

- **Interface Moderna**: Desenvolvida com Angular 20+ e componentes reutilizáveis
- **Múltiplos Métodos de Pagamento**: Suporte completo para Cartão de Crédito e PIX
- **Validação em Tempo Real**: Validação de cartão de crédito usando algoritmo de Luhn
- **Monitoramento PIX**: Verificação automática de status de pagamento PIX
- **Design Responsivo**: Interface adaptada para desktop e mobile
- **TypeScript**: Tipagem forte e melhor experiência de desenvolvimento
- **Segurança**: Implementação de boas práticas de segurança

## 🛠 Tecnologias Utilizadas

- **Angular 20+**: Framework principal
- **TypeScript**: Linguagem de programação
- **RxJS**: Programação reativa
- **Angular Router**: Navegação entre páginas
- **HTTP Client**: Comunicação com APIs
- **CSS3**: Estilização moderna

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── credit-card-form/ # Formulário de cartão de crédito
│   │   ├── pix-payment/      # Componente de pagamento PIX
│   │   └── payment-result/   # Resultado do pagamento
│   ├── pages/               # Páginas da aplicação
│   │   ├── home/            # Página inicial
│   │   └── payment/         # Página de pagamento
│   ├── services/            # Serviços Angular
│   │   └── payment.service.ts
│   ├── models/              # Interfaces e tipos
│   │   └── transaction.model.ts
│   └── app.routes.ts        # Configuração de rotas
```

## 🚦 Como Executar

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Angular CLI

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd payment-system-angular
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o ambiente**
   - Ajuste a URL da API no arquivo `src/app/services/payment.service.ts`
   - Modifique a constante `apiUrl` para apontar para seu backend

4. **Execute em modo de desenvolvimento**
   ```bash
   npm start
   # ou
   ng serve
   ```

   A aplicação estará disponível em `http://localhost:4200`

### Scripts Disponíveis

- `npm start` - Executa em modo de desenvolvimento
- `npm run build` - Gera build de produção
- `npm test` - Executa testes unitários
- `npm run lint` - Executa verificação de código

## 🔗 Integração com Backend

A aplicação espera um backend com as seguintes rotas:

```
POST /api/payments/initiate      # Iniciar transação
POST /api/payments/credit-card   # Processar cartão de crédito
POST /api/payments/pix          # Processar PIX
GET  /api/payments/pix/:id/status # Verificar status PIX
GET  /api/payments/:id          # Obter transação
```

### Exemplo de Response

```typescript
interface PaymentResponse {
  success: boolean;
  data?: Transaction;
  error?: {
    message: string;
    code?: string;
  };
}
```

## 💳 Funcionalidades de Pagamento

### Cartão de Crédito
- Validação de número do cartão (Algoritmo de Luhn)
- Formatação automática
- Validação de data de expiração
- Detecção de bandeira do cartão
- Validação de CVV

### PIX
- Geração de QR Code
- Código Copia e Cola
- Monitoramento automático de status
- Countdown de expiração
- Interface intuitiva

## 🎨 Componentes Principais

### CreditCardFormComponent
Formulário completo para pagamento com cartão de crédito com validações em tempo real.

```html
<app-credit-card-form 
  [transaction]="transaction"
  (success)="onPaymentSuccess($event)"
  (error)="onPaymentError($event)">
</app-credit-card-form>
```

### PixPaymentComponent
Interface para pagamento PIX com QR Code e monitoramento de status.

```html
<app-pix-payment 
  [transaction]="transaction"
  (success)="onPaymentSuccess($event)"
  (error)="onPaymentError($event)">
</app-pix-payment>
```

### PaymentResultComponent
Exibição do resultado do pagamento com diferentes estados.

```html
<app-payment-result 
  [transaction]="transaction"
  [isSuccess]="isSuccess"
  [errorMessage]="errorMessage">
</app-payment-result>
```

## 🔒 Segurança

- **Validação Frontend**: Validações robustas no lado cliente
- **TypeScript**: Tipagem forte previne erros
- **Sanitização**: Dados são sanitizados antes do envio
- **HTTPS**: Recomendado para produção
- **Tokens**: Suporte para autenticação via tokens

## 🚀 Deploy

### Produção

1. **Build de produção**
   ```bash
   npm run build
   ```

2. **Servir arquivos estáticos**
   Os arquivos gerados em `dist/` podem ser servidos por qualquer servidor web (nginx, Apache, etc.)

### Variáveis de Ambiente

Configure as seguintes variáveis para produção:

- `API_URL`: URL do backend
- `ENVIRONMENT`: 'production'

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:

- 📧 Email: suporte@pagamentos.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Website: https://pagamentos.com

---

⚡ **Desenvolvido com Angular para máxima performance e segurança**
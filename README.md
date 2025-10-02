# PaymentSystemAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Convenções de Tradução (Frontend/Backend)

Estratégia adotada: Opção B (mensagens e variáveis internas em PT-BR, contratos de API em inglês).

- Campos de requisição/resposta da API, códigos de erro e chaves JSON permanecem em inglês (ex: `cardToken`, `expiresAt`, `error.code`).
- Mensagens exibidas ao usuário final (sucesso, erro, labels, placeholders) foram traduzidas para PT-BR.
- Variáveis internas em componentes Angular que representam estado de UI foram renomeadas para PT-BR (`novoCartao`, `errosCartao`, `usuario`, `iniciais`, etc.).
- Serviços, modelos e interfaces que espelham o contrato de backend mantêm nomenclatura original em inglês para reduzir atrito de manutenção.
- Não foi introduzida ainda infraestrutura de i18n (Angular i18n / ngx-translate). Evolução futura pode envolver um dicionário de chaves.

### Regras Gerais
1. Tudo que trafega "sobre a rede" (payloads HTTP, tokens JWT, campos persistidos) permanece em inglês.
2. Tudo que é puramente de apresentação ou controle de UI pode ser renomeado para PT-BR.
3. Não alterar nomes de tipos que venham do backend para evitar divergência em refactors.
4. Mensagens de erro no backend voltadas ao usuário final estão em PT-BR, mas `error.code` segue em inglês (ex: `CARD_VALIDATION_FAILED`).
5. Novos componentes devem seguir o mesmo padrão: propriedades de formulário e rótulos em PT-BR, modelos/dtos em inglês.

### Exemplo
```
// Request DTO (mantém inglês)
interface SaveCardRequest { cardNumber: string; expirationMonth: string; }

// Estado de formulário (PT-BR)
novoCartao = signal<SaveCardRequest>({ cardNumber: '', expirationMonth: '' });

// Mensagem de erro (PT-BR)
this.errosCartao.set(['Número de cartão inválido']);
```

### Próximos Passos Possíveis
- Introduzir chaveamento de idioma (en-US / pt-BR) com pipe ou função utilitária.
- Extração de mensagens para mapa central (`messages.ts`) garantindo consistência.
- Testes e2e validando presença de mensagens PT-BR em fluxos críticos.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

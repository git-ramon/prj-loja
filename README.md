
# Prj-Loja

Aplicação web desenvolvida para gerenciamento de clientes, utilizando Node.js, Express e SQLite. O projeto permite realizar operações de cadastro, consulta, edição e exclusão de registros, contando também com uma área administrativa protegida por autenticação.

## Funcionalidades

- Cadastro de clientes por formulário.
- Listagem de clientes cadastrados.
- Pesquisa e paginação de registros.
- Edição dos dados dos clientes.
- Exclusão de clientes com confirmação.
- Autenticação de administrador.
- Controle de acesso à área administrativa.
- Máscara e validação de telefone.

## Tecnologias utilizadas

- **Node.js** – Ambiente de execução JavaScript.
- **Express** – Framework para desenvolvimento do servidor.
- **SQLite** – Banco de dados.
- **Better-SQLite3** – Integração com o banco de dados.
- **HTML5, CSS3 e JavaScript** – Desenvolvimento da interface.
- **Bootstrap** – Estilização e componentes visuais.
- **Bcrypt** – Criptografia de senhas.
- **Express Session** – Gerenciamento de sessões.




## Estrutura do projeto

```text
Prj-Loja/
│
├── backend/
│   ├── server.js
│   └── criar-admin.js
│
├── public/
│   ├── css/
│   ├── js/
│   ├── img/
│   ├── Admin.html
│   ├── Clientes.html
│   ├── Home.html
│   └── Login.html
│
├── Loja.db
├── package.json
├── package-lock.json
└── README.md
```



## Instalação e execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado.
- Git instalado.

### 1. Clonar o repositório

```bash
git clone https://github.com/git-ramon/prj-loja.git
```

### 2. Acessar a pasta do projeto

```bash
cd prj-loja
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Iniciar o servidor

```bash
npm start
```

Após iniciar o servidor, acesse a aplicação pelo navegador:

http://localhost:3000



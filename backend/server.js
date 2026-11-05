
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const pastaPublica = path.join(__dirname, "..", "public");

const app = express();
const PORTA = 3000;

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "chave-temporaria-trocar-depois",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 60 * 1000
    }
}));

// Conecta ao banco de dados existente
const db = new Database(
    path.join(__dirname, "..", "Loja.db")
);


 // Disponibiliza somente os arquivos públicos
const arquivosPublicos = [
    "Home.html",
    "Clientes.html",
    "Login.html",
    "css/style.css",
    "css/bootstrap.css",
    "img/Logo-Prj-Loja.png",
    "js/script.js"
];

app.get(arquivosPublicos.map(arquivo => `/${arquivo}`), (req, res) => {
    const arquivo = path.join(
        pastaPublica,
        req.path.replace(/^\/+/, "")
    );

    res.sendFile(arquivo);
});


// Verifica se a tabela Clientes existe
const tabela = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name = ?
`).get("Clientes");

if (tabela) {
    console.log("Conexão com Loja.db realizada!");
} else {
    console.log("Tabela não encontrada.");
}


//Rota Login
app.post("/login", async (req, res) => {
    const { usuario, senha } = req.body;

    if (
        typeof usuario !== "string" ||
        typeof senha !== "string" ||
        !usuario.trim() ||
        !senha
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Informe o usuário e a senha."
        });
    }

    try {
        const administrador = db.prepare(`
            SELECT ID, Usuario, Senha, Nome
            FROM Usuarios
            WHERE Usuario = ? AND Ativo = 1
        `).get(usuario.trim());

        if (
            !administrador ||
            !(await bcrypt.compare(senha, administrador.Senha))
        ) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário ou senha inválidos."
            });
        }

        req.session.regenerate((erro) => {
            if (erro) {
                console.error("Erro ao criar sessão:", erro.message);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Não foi possível iniciar a sessão."
                });
            }

            req.session.administrador = {
                id: administrador.ID,
                usuario: administrador.Usuario,
                nome: administrador.Nome
            };

            req.session.save((erroSalvar) => {
                if (erroSalvar) {
                    console.error("Erro ao salvar sessão:", erroSalvar.message);

                    return res.status(500).json({
                        sucesso: false,
                        mensagem: "Não foi possível iniciar a sessão."
                    });
                }

                return res.json({
                    sucesso: true,
                    mensagem: "Login realizado com sucesso!",
                    nome: administrador.Nome
                });
            });
        });
    } catch (erro) {
        console.error("Erro no login:", erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao realizar login."
        });
    }
});



// Rota protegida da área administrativa
app.get("/Admin.html", (req, res) => {
    if (!req.session.administrador) {
        return res.redirect("/Login.html");
    }

    res.setHeader("Cache-Control", "no-store");

    res.sendFile(path.join(pastaPublica, "Admin.html"));
});



 // Lista os clientes cadastrados (somente administrador)
app.get("/api/clientes", (req, res) => {
    if (!req.session.administrador) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Acesso não autorizado."
        });
    }

    try {
        const clientes = db.prepare(`
            SELECT ID, Nome, Telefone, Mensagem
            FROM Clientes
            ORDER BY ID ASC
        `).all();

        return res.json({
            sucesso: true,
            clientes
        });
    } catch (erro) {
        console.error("Erro ao listar clientes:", erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao consultar os clientes."
        });
    }
});



// Atualiza os dados de um cliente (somente administrador)
app.put("/api/clientes/:id", (req, res) => {

    // Verifica autenticação
    if (!req.session.administrador) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Acesso não autorizado."
        });
    }

    const id = Number(req.params.id);
    const { nome, telefone, mensagem } = req.body;

    // Valida o ID
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "ID do cliente inválido."
        });
    }

    // Valida os campos
    if (
        typeof nome !== "string" ||
        typeof telefone !== "string" ||
        typeof mensagem !== "string" ||
        !nome.trim() ||
        !telefone.trim() ||
        !mensagem.trim()
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha todos os campos."
        });
    }

    // Valida os limites dos campos
    if (
        nome.trim().length > 80 ||
        telefone.trim().length > 15 ||
        mensagem.trim().length > 120
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Um ou mais campos ultrapassaram o limite permitido."
        });
    }

    try {

        const comando = db.prepare(`
            UPDATE Clientes
            SET Nome = ?, Telefone = ?, Mensagem = ?
            WHERE ID = ?
        `);

        const resultado = comando.run(
            nome.trim(),
            telefone.trim(),
            mensagem.trim(),
            id
        );

        if (resultado.changes === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Cliente não encontrado."
            });
        }

        return res.json({
            sucesso: true,
            mensagem: "Cliente atualizado com sucesso!"
        });

    } catch (erro) {

        console.error("Erro ao atualizar cliente:", erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao atualizar o cliente no banco de dados."
        });
    }
});


// Exclui um cliente (somente administrador)
app.delete("/api/clientes/:id", (req, res) => {
    if (!req.session.administrador) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Acesso não autorizado."
        });
    }

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "ID do cliente inválido."
        });
    }

    try {
        const comando = db.prepare(`
            DELETE FROM Clientes
            WHERE ID = ?
        `);

        const resultado = comando.run(id);

        if (resultado.changes === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Cliente não encontrado."
            });
        }

        return res.json({
            sucesso: true,
            mensagem: "Cliente excluído com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao excluir cliente:", erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao excluir o cliente do banco de dados."
        });
    }
});




 // Rota para encerrar a sessão
app.post("/logout", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar sessão:", erro.message);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Não foi possível encerrar a sessão."
            });
        }

        res.clearCookie("connect.sid");

        return res.json({
            sucesso: true,
            mensagem: "Sessão encerrada com sucesso."
        });
    });
});



//Rota clientes
app.post("/clientes", (req, res) => {
    const { nome, telefone, mensagem } = req.body;

    // Verifica se todos os campos foram preenchidos
    if (!nome?.trim() || !telefone?.trim() || !mensagem?.trim()) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha todos os campos."
        });
    }

    try {
        // Insere os dados na tabela Clientes
        const comando = db.prepare(`
            INSERT INTO Clientes (Nome, Telefone, Mensagem)
            VALUES (?, ?, ?)
        `);

        const resultado = comando.run(
            nome.trim(),
            telefone.trim(),
            mensagem.trim()
        );

        res.json({
            sucesso: true,
            mensagem: "Cliente cadastrado com sucesso!",
            id: resultado.lastInsertRowid
        });

        console.log("Cliente cadastrado. ID:", resultado.lastInsertRowid);

    } catch (erro) {
        console.error("Erro ao cadastrar:", erro.message);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao salvar o cliente no banco de dados."
        });
    }
});


// Verifica se existe administrador autenticado
app.get("/api/sessao", (req, res) => {
    res.json({
        autenticado: Boolean(req.session.administrador)
    });
});


// Inicia o servidor
app.listen(PORTA, () => {
    console.log(`Servidor disponível em http://localhost:${PORTA}`);
});

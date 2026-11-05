
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const readline = require("readline");

const db = new Database(
    path.join(__dirname, "Loja.db")
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(texto) {
    return new Promise((resolve) => {
        rl.question(texto, resolve);
    });
}

async function criarAdmin() {
    try {
        const usuario = (await perguntar("Usuário administrador: ")).trim();
        const nome = (await perguntar("Nome do administrador: ")).trim();
        const senha = await perguntar("Senha do administrador: ");

        if (!usuario || !nome || !senha.trim()) {
            console.log("Preencha todos os campos.");
            return;
        }

        const hash = await bcrypt.hash(senha, 10);

        const comando = db.prepare(`
            INSERT INTO Usuarios (Usuario, Senha, Nome)
            VALUES (?, ?, ?)
        `);

        comando.run(usuario, hash, nome);

        console.log("Administrador cadastrado com sucesso!");
    } catch (erro) {
        if (erro.code === "SQLITE_CONSTRAINT_UNIQUE") {
            console.log("Esse usuário já está cadastrado.");
        } else {
            console.error("Erro ao cadastrar administrador:", erro.message);
        }
    } finally {
        rl.close();
        db.close();
    }
}

criarAdmin();

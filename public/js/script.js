
//Contador de caracters do campo mensagem
const mensagem = document.getElementById("mensagem");
const quantidade = document.getElementById("quantidade");

if (mensagem && quantidade) {
    mensagem.addEventListener("input", () => {
        quantidade.textContent = mensagem.value.length;
    });
}


    //* Máscara de telefone (DD) 99999-9999
    function aplicarMascaraTelefone(campo) {
        campo.addEventListener("input", () => {
            let numeros = campo.value.replace(/\D/g, "");

            //* Limita a 11 dígitos: DDD + celular
            numeros = numeros.substring(0, 11);

            campo.setCustomValidity(
                numeros.length > 0 && numeros.length < 11
                    ? "Informe o telefone completo com DDD."
                    : ""
            );

            if (numeros.length > 7) {
                campo.value = numeros.replace(
                    /^(\d{2})(\d{5})(\d{0,4}).*/,
                    "($1) $2-$3"
                );
            } else if (numeros.length > 2) {
                campo.value = numeros.replace(
                    /^(\d{2})(\d{0,5})/,
                    "($1) $2"
                );
            } else if (numeros.length > 0) {
                campo.value = `(${numeros}`;
            } else {
                campo.value = "";
            }
        });

    }

    const telefone = document.getElementById("telefone");
    const editarTelefone = document.getElementById("editarTelefone");

    if (telefone) aplicarMascaraTelefone(telefone);
    if (editarTelefone) aplicarMascaraTelefone(editarTelefone);

const formulario = document.getElementById("formCliente");

if (formulario) {
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const dados = {
            nome: document.getElementById("nome").value.trim(),
            telefone: document.getElementById("telefone").value.trim(),
            mensagem: document.getElementById("mensagem").value.trim()
        };

        try {
            const resposta = await fetch("/clientes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            alert(resultado.mensagem);


             if (resposta.ok) {
                formulario.reset();
            }

        } catch (erro) {
            console.error("Erro na comunicação:", erro);
            alert("Não foi possível comunicar com o servidor.");
        }
    });
}



const formularioLogin = document.getElementById("formLogin");

if (formularioLogin) {
    formularioLogin.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const usuario = document.getElementById("usuario").value.trim();
        const senha = document.getElementById("senha").value;
        const mensagemLogin = document.getElementById("mensagemLogin");
        const botaoEntrar = formularioLogin.querySelector(
            'button[type="submit"]'
        );

        function exibirMensagem(texto, tipo) {
            mensagemLogin.textContent = texto;
            mensagemLogin.className = `mensagem-login ${tipo}`;
        }

        exibirMensagem("Verificando acesso...", "carregando");
        botaoEntrar.disabled = true;

        const inicioVerificacao = Date.now();

        try {
            const resposta = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ usuario, senha })
            });

            const resultado = await resposta.json();

            const tempoDecorrido = Date.now() - inicioVerificacao;
const tempoRestante = Math.max(0, 1000 - tempoDecorrido);

if (tempoRestante > 0) {
    await new Promise(resolve => setTimeout(resolve, tempoRestante));
}

            if (resposta.ok && resultado.sucesso) {
                exibirMensagem("Login realizado com sucesso!", "sucesso");

                botaoEntrar.disabled = true;

                setTimeout(() => {
                    window.location.replace("/Admin.html");
                }, 1200);

                return;
            }

            exibirMensagem(
                resultado.mensagem || "Não foi possível realizar o login.",
                "erro"
            );
        } catch (erro) {
            console.error("Erro ao realizar login:", erro);

            exibirMensagem(
                "Não foi possível comunicar com o servidor.",
                "erro"
            );
        } finally {
            botaoEntrar.disabled = false;
        }
    });
}




const btnSair = document.getElementById("btnSair");

if (btnSair) {
    btnSair.addEventListener("click", async () => {
        try {
            const resposta = await fetch("/logout", {
                method: "POST"
            });

            const resultado = await resposta.json();

            if (resposta.ok && resultado.sucesso) {
                window.location.replace("/Home.html");
            } else {
                alert(resultado.mensagem || "Não foi possível sair.");
            }
        } catch (erro) {
            console.error("Erro ao sair:", erro);
            alert("Não foi possível comunicar com o servidor.");
        }
    });
}


// Controle dinâmico do botão Login / Logout
const linkLogin = document.getElementById("linkLogin");

if (linkLogin) {
    async function atualizarLogin() {
        try {
            const resposta = await fetch("/api/sessao");
            const sessao = await resposta.json();

            if (sessao.autenticado) {
                linkLogin.textContent = "Logout";
                linkLogin.href = "#";

                linkLogin.addEventListener("click", async (evento) => {
                    evento.preventDefault();

                    try {
                        const respostaLogout = await fetch("/logout", {
                            method: "POST"
                        });

                        const resultado = await respostaLogout.json();

                        if (respostaLogout.ok && resultado.sucesso) {
                            window.location.href = "Home.html";
                        } else {
                            alert(resultado.mensagem);
                        }

                    } catch (erro) {
                        console.error("Erro ao encerrar sessão:", erro);
                        alert("Não foi possível encerrar a sessão.");
                    }
                });
            }

        } catch (erro) {
            console.error("Erro ao verificar sessão:", erro);
        }
    }

    atualizarLogin();
}


// ==================================================
// LISTAGEM E PESQUISA DE CLIENTES

const listaClientes = document.getElementById("listaClientes");
const statusClientes = document.getElementById("statusClientes");
const totalClientes = document.getElementById("totalClientes");
const pesquisaClientes = document.getElementById("pesquisaClientes");
const paginacaoClientes = document.getElementById("paginacaoClientes");
const infoPaginacao = document.getElementById("infoPaginacao");

if (listaClientes && statusClientes) {

    let clientesCadastrados = [];
    let paginaAtual = 1;

    const clientesPorPagina = 10;


    // Exibe os clientes na tabela
    function exibirClientes(clientes) {

        listaClientes.replaceChildren();

        for (const cliente of clientes) {

            const linha = document.createElement("tr");

            for (const valor of [
                cliente.ID,
                cliente.Nome,
                cliente.Telefone,
                cliente.Mensagem
            ]) {

                const celula = document.createElement("td");
                celula.textContent = valor ?? "";

                linha.appendChild(celula);
            }


            // Coluna de ações
            const celulaAcoes = document.createElement("td");

            celulaAcoes.style.whiteSpace = "nowrap";

            const containerBotoes = document.createElement("div");
            containerBotoes.className = "d-flex align-items-center gap-2";

            // Botão Editar
            const btnEditar = document.createElement("button");
            btnEditar.type = "button";
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn btn-sm btn-primary me-2";

            // Abre o modal com os dados do cliente para editar.
            btnEditar.addEventListener("click", () => {

                document.getElementById("editarId").value = cliente.ID;
                document.getElementById("editarNome").value = cliente.Nome;
                document.getElementById("editarTelefone").value = cliente.Telefone;
                document.getElementById("editarMensagem").value = cliente.Mensagem;

                const modal = new bootstrap.Modal(
                    document.getElementById("modalEditarCliente")
                );

                modal.show();
            });


            // Botão Excluir
            const btnExcluir = document.createElement("button");
            btnExcluir.type = "button";
            btnExcluir.textContent = "Excluir";
            btnExcluir.className = "btn btn-sm btn-danger";


            //Excluir Cliente
            btnExcluir.addEventListener("click", async () => {
            const confirmar = confirm(
                `Deseja realmente excluir o cliente "${cliente.Nome}"?`
            );

            if (!confirmar) return;

            try {
                const resposta = await fetch(`/api/clientes/${cliente.ID}`, {
                    method: "DELETE"
                });

                const resultado = await resposta.json();

                if (resposta.status === 401) {
                    window.location.replace("/Login.html");
                    return;
                }

                if (!resposta.ok || !resultado.sucesso) {
                    alert(resultado.mensagem || "Erro ao excluir cliente.");
                    return;
                }

                clientesCadastrados = clientesCadastrados.filter(
                    item => item.ID !== cliente.ID
                );

                pesquisarClientes();

                alert(resultado.mensagem);

            } catch (erro) {
                console.error("Erro ao excluir cliente:", erro);
                alert("Não foi possível comunicar com o servidor.");
            }
        });

            containerBotoes.appendChild(btnEditar);
            containerBotoes.appendChild(btnExcluir);

            celulaAcoes.appendChild(containerBotoes);

            linha.appendChild(celulaAcoes);

            listaClientes.appendChild(linha);
        }
    }


    // Cria um botão da paginação
    function criarBotaoPagina(texto, pagina, desabilitado = false, ativo = false) {

        const item = document.createElement("li");
        item.className = `page-item${desabilitado ? " disabled" : ""}${ativo ? " active" : ""}`;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "page-link";
        botao.textContent = texto;
        botao.disabled = desabilitado;

        if (ativo) {
            botao.setAttribute("aria-current", "page");
        }

        botao.dataset.pagina = pagina;

        item.appendChild(botao);

        return item;
    }


    // Exibe os controles de paginação
    function exibirPaginacao(totalPaginas) {

        paginacaoClientes.replaceChildren();

        if (totalPaginas <= 1) {
            return;
        }

        // Botão anterior
        paginacaoClientes.appendChild(
            criarBotaoPagina("Anterior", paginaAtual - 1, paginaAtual === 1)
        );

        // Define o intervalo de páginas visíveis
        const inicio = Math.max(1, paginaAtual - 2);
        const fim = Math.min(totalPaginas, paginaAtual + 2);

        // Primeira página
        if (inicio > 1) {

            paginacaoClientes.appendChild(
                criarBotaoPagina("1", 1)
            );

            if (inicio > 2) {
                const reticencias = document.createElement("li");
                reticencias.className = "page-item disabled";
                reticencias.innerHTML = '<span class="page-link">...</span>';
                paginacaoClientes.appendChild(reticencias);
            }
        }

        // Páginas próximas da atual
        for (let pagina = inicio; pagina <= fim; pagina++) {

            paginacaoClientes.appendChild(
                criarBotaoPagina(
                    String(pagina),
                    pagina,
                    false,
                    pagina === paginaAtual
                )
            );
        }

        // Última página
        if (fim < totalPaginas) {

            if (fim < totalPaginas - 1) {
                const reticencias = document.createElement("li");
                reticencias.className = "page-item disabled";
                reticencias.innerHTML = '<span class="page-link">...</span>';
                paginacaoClientes.appendChild(reticencias);
            }

            paginacaoClientes.appendChild(
                criarBotaoPagina(
                    String(totalPaginas),
                    totalPaginas
                )
            );
        }

        // Botão próximo
        paginacaoClientes.appendChild(
            criarBotaoPagina(
                "Próxima",
                paginaAtual + 1,
                paginaAtual === totalPaginas
            )
        );
    }


    // Atualiza a tabela e a paginação
    function atualizarTabela(clientes) {

        const total = clientes.length;
        const totalPaginas = Math.ceil(total / clientesPorPagina);

        if (total === 0) {

            listaClientes.replaceChildren();
            paginacaoClientes.replaceChildren();

            infoPaginacao.textContent = "Nenhum registro para exibir.";

            return;
        }

        // Garante que a página atual seja válida
        paginaAtual = Math.min(paginaAtual, totalPaginas);

        const inicio = (paginaAtual - 1) * clientesPorPagina;
        const fim = Math.min(inicio + clientesPorPagina, total);

        const clientesPagina = clientes.slice(inicio, fim);

        exibirClientes(clientesPagina);
        exibirPaginacao(totalPaginas);

        infoPaginacao.textContent =
            `Mostrando ${inicio + 1} a ${fim} de ${total} clientes.`;
    }


    // Pesquisa por ID, nome ou telefone
    function pesquisarClientes() {

        const termo = pesquisaClientes.value
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const clientesFiltrados = clientesCadastrados.filter(cliente => {

            const id = String(cliente.ID);

            const nome = String(cliente.Nome)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

            const telefone = String(cliente.Telefone);

            return (
                id.includes(termo) ||
                nome.includes(termo) ||
                telefone.includes(termo)
            );
        });

        paginaAtual = 1;

        atualizarTabela(clientesFiltrados);

        if (termo === "") {

            statusClientes.textContent =
                `Total de clientes: ${clientesCadastrados.length}`;

        } else if (clientesFiltrados.length === 0) {

            statusClientes.textContent = "Nenhum cliente encontrado.";

        } else {

            statusClientes.textContent =
                `Exibindo ${clientesFiltrados.length} de ${clientesCadastrados.length} clientes.`;
        }
    }


    // Navegação entre páginas
    paginacaoClientes.addEventListener("click", evento => {

        const botao = evento.target.closest("button[data-pagina]");

        if (!botao || botao.disabled) {
            return;
        }

        paginaAtual = Number(botao.dataset.pagina);

        const termo = pesquisaClientes.value
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const clientesFiltrados = clientesCadastrados.filter(cliente => {

            const id = String(cliente.ID);

            const nome = String(cliente.Nome)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

            const telefone = String(cliente.Telefone);

            return (
                id.includes(termo) ||
                nome.includes(termo) ||
                telefone.includes(termo)
            );
        });

        atualizarTabela(clientesFiltrados);
    });


    // Carrega os clientes do servidor
    async function carregarClientes() {

        statusClientes.textContent = "Carregando clientes...";

        try {

            const resposta = await fetch("/api/clientes");

            if (resposta.status === 401) {
                window.location.replace("/Login.html");
                return;
            }

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {

                statusClientes.textContent =
                    resultado.mensagem || "Erro ao carregar clientes.";

                return;
            }

            clientesCadastrados = resultado.clientes;

            totalClientes.textContent = clientesCadastrados.length;

            pesquisarClientes();

            if (clientesCadastrados.length === 0) {
                statusClientes.textContent = "Nenhum cliente cadastrado.";
            }

        } catch (erro) {

            console.error("Erro ao carregar clientes:", erro);

            statusClientes.textContent =
                "Não foi possível comunicar com o servidor.";
        }
    }


    // Pesquisa enquanto o usuário digita
    pesquisaClientes.addEventListener("input", pesquisarClientes);

    carregarClientes();


    
    // Salva as alterações do cliente
    const formEditarCliente = document.getElementById("formEditarCliente");

    if (formEditarCliente) {

        formEditarCliente.addEventListener("submit", async (evento) => {

            evento.preventDefault();

            const id = document.getElementById("editarId").value;

            const dados = {
                nome: document.getElementById("editarNome").value.trim(),
                telefone: document.getElementById("editarTelefone").value.trim(),
                mensagem: document.getElementById("editarMensagem").value.trim()
            };

            const botaoSalvar = formEditarCliente.querySelector(
                'button[type="submit"]'
            );

            botaoSalvar.disabled = true;
            botaoSalvar.textContent = "Salvando...";

            try {

                const resposta = await fetch(`/api/clientes/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)
                });

                const resultado = await resposta.json();

                if (resposta.status === 401) {
                    window.location.replace("/Login.html");
                    return;
                }

                if (!resposta.ok || !resultado.sucesso) {
                    alert(resultado.mensagem || "Erro ao atualizar cliente.");
                    return;
                }

                // Atualiza os dados locais
                const cliente = clientesCadastrados.find(
                    cliente => String(cliente.ID) === String(id)
                );

                if (cliente) {
                    cliente.Nome = dados.nome;
                    cliente.Telefone = dados.telefone;
                    cliente.Mensagem = dados.mensagem;
                }

                // Atualiza a tabela
                pesquisarClientes();

                // Fecha o modal
                const modalElemento = document.getElementById("modalEditarCliente");
                const modal = bootstrap.Modal.getInstance(modalElemento);

                modal.hide();

                alert(resultado.mensagem);

            } catch (erro) {

                console.error("Erro ao atualizar cliente:", erro);
                alert("Não foi possível comunicar com o servidor.");

            } finally {

                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar alterações";
            }
        });
    }

}



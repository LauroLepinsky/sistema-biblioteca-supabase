// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

// URL do projeto Supabase
// Substitua pelo endereço do seu projeto.
const SUPABASE_URL = "https://yjspidjuysalffjdvmdq.supabase.co";

// Chave pública do projeto
// Utilize somente a chave pública destinada ao cliente.
// NÃO coloque aqui a Service Role Key.
const SUPABASE_ANON_KEY = "sb_publishable_T4V61_KxZwkwgs_bjpCxpg_atN61Dm5";

// Cria a conexão com o Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

// Mostra uma mensagem de sucesso ou erro no topo da página
function mostrarMensagem(texto, tipo = "sucesso") {
	const div = document.getElementById("mensagem");
	div.textContent = texto;
	div.className = "mensagem " + tipo;
	setTimeout(() => div.classList.add("oculto"), 4000);
}

// Evita que textos digitados pelo usuário sejam interpretados como HTML
function escapar(texto) {
	if (texto === null || texto === undefined) return "";
	return String(texto)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Converte "2026-10-23" em "23/10/2026"
function formatarData(data) {
	if (!data) return "-";
	const [ano, mes, dia] = data.split("-");
	return `${dia}/${mes}/${ano}`;
}

// Data de hoje no formato do banco (AAAA-MM-DD)
function hoje() {
	const d = new Date();
	const mes = String(d.getMonth() + 1).padStart(2, "0");
	const dia = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${mes}-${dia}`;
}

// =====================================================
// NAVEGAÇÃO ENTRE ABAS
// =====================================================

document.querySelectorAll(".aba").forEach((botao) => {
	botao.addEventListener("click", () => {
		document
			.querySelectorAll(".aba")
			.forEach((b) => b.classList.remove("ativa"));
		document
			.querySelectorAll(".secao")
			.forEach((s) => s.classList.add("oculto"));

		botao.classList.add("ativa");
		document.getElementById(botao.dataset.aba).classList.remove("oculto");
	});
});

// =====================================================
// LIVROS
// =====================================================

// Listar livros
async function listarLivros() {
	const { data, error } = await supabaseClient
		.from("livros")
		.select("*")
		.order("titulo");

	if (error) {
		mostrarMensagem("Erro ao listar livros: " + error.message, "erro");
		return;
	}

	const tbody = document.getElementById("lista-livros");
	tbody.innerHTML = "";

	if (data.length === 0) {
		tbody.innerHTML = `<tr><td colspan="5">Nenhum livro cadastrado.</td></tr>`;
		return;
	}

	data.forEach((livro) => {
		const situacao = livro.disponivel
			? `<span class="disponivel">Disponível</span>`
			: `<span class="indisponivel">Emprestado</span>`;

		tbody.innerHTML += `
            <tr>
                <td>${escapar(livro.titulo)}</td>
                <td>${escapar(livro.autor)}</td>
                <td>${escapar(livro.ano ?? "-")}</td>
                <td>${situacao}</td>
                <td><button class="excluir" onclick="excluirLivro(${livro.id})">Excluir</button></td>
            </tr>`;
	});
}

// Cadastrar livro
document.getElementById("form-livro").addEventListener("submit", async (e) => {
	e.preventDefault();

	const titulo = document.getElementById("livro-titulo").value.trim();
	const autor = document.getElementById("livro-autor").value.trim();
	const anoTexto = document.getElementById("livro-ano").value;
	const ano = anoTexto ? parseInt(anoTexto) : null;

	const { error } = await supabaseClient
		.from("livros")
		.insert({ titulo: titulo, autor: autor, ano: ano });

	if (error) {
		mostrarMensagem("Erro ao cadastrar livro: " + error.message, "erro");
		return;
	}

	e.target.reset();
	mostrarMensagem("Livro cadastrado com sucesso.");
	atualizarTudo();
});

// Excluir livro
async function excluirLivro(id) {
	// Não permite excluir livro que possui empréstimos registrados,
	// pois a chave estrangeira em "emprestimos" impediria a exclusão.
	const { count } = await supabaseClient
		.from("emprestimos")
		.select("id", { count: "exact", head: true })
		.eq("livro_id", id);

	if (count > 0) {
		mostrarMensagem(
			"Este livro possui empréstimos no histórico e não pode ser excluído.",
			"erro",
		);
		return;
	}

	if (!confirm("Deseja realmente excluir este livro?")) return;

	const { error } = await supabaseClient.from("livros").delete().eq("id", id);

	if (error) {
		mostrarMensagem("Erro ao excluir livro: " + error.message, "erro");
		return;
	}

	mostrarMensagem("Livro excluído.");
	atualizarTudo();
}

// =====================================================
// USUÁRIOS
// =====================================================

// Listar usuários
async function listarUsuarios() {
	const { data, error } = await supabaseClient
		.from("usuarios")
		.select("*")
		.order("nome");

	if (error) {
		mostrarMensagem("Erro ao listar usuários: " + error.message, "erro");
		return;
	}

	const tbody = document.getElementById("lista-usuarios");
	tbody.innerHTML = "";

	if (data.length === 0) {
		tbody.innerHTML = `<tr><td colspan="3">Nenhum usuário cadastrado.</td></tr>`;
		return;
	}

	data.forEach((usuario) => {
		tbody.innerHTML += `
            <tr>
                <td>${escapar(usuario.nome)}</td>
                <td>${escapar(usuario.email || "-")}</td>
                <td><button class="excluir" onclick="excluirUsuario(${usuario.id})">Excluir</button></td>
            </tr>`;
	});
}

// Cadastrar usuário
document
	.getElementById("form-usuario")
	.addEventListener("submit", async (e) => {
		e.preventDefault();

		const nome = document.getElementById("usuario-nome").value.trim();
		const email = document.getElementById("usuario-email").value.trim() || null;

		const { error } = await supabaseClient
			.from("usuarios")
			.insert({ nome: nome, email: email });

		if (error) {
			mostrarMensagem("Erro ao cadastrar usuário: " + error.message, "erro");
			return;
		}

		e.target.reset();
		mostrarMensagem("Usuário cadastrado com sucesso.");
		atualizarTudo();
	});

// Excluir usuário
async function excluirUsuario(id) {
	const { count } = await supabaseClient
		.from("emprestimos")
		.select("id", { count: "exact", head: true })
		.eq("usuario_id", id);

	if (count > 0) {
		mostrarMensagem(
			"Este usuário possui empréstimos no histórico e não pode ser excluído.",
			"erro",
		);
		return;
	}

	if (!confirm("Deseja realmente excluir este usuário?")) return;

	const { error } = await supabaseClient.from("usuarios").delete().eq("id", id);

	if (error) {
		mostrarMensagem("Erro ao excluir usuário: " + error.message, "erro");
		return;
	}

	mostrarMensagem("Usuário excluído.");
	atualizarTudo();
}

// =====================================================
// EMPRÉSTIMOS
// =====================================================

// Preenche as caixas de seleção do formulário de empréstimo
async function carregarOpcoesEmprestimo() {
	// Somente livros disponíveis aparecem para empréstimo
	const { data: livros } = await supabaseClient
		.from("livros")
		.select("id, titulo")
		.eq("disponivel", true)
		.order("titulo");

	const { data: usuarios } = await supabaseClient
		.from("usuarios")
		.select("id, nome")
		.order("nome");

	const selectLivro = document.getElementById("emprestimo-livro");
	const selectUsuario = document.getElementById("emprestimo-usuario");

	selectLivro.innerHTML = `<option value="">Selecione um livro disponível</option>`;
	(livros || []).forEach((l) => {
		selectLivro.innerHTML += `<option value="${l.id}">${escapar(l.titulo)}</option>`;
	});

	selectUsuario.innerHTML = `<option value="">Selecione um usuário</option>`;
	(usuarios || []).forEach((u) => {
		selectUsuario.innerHTML += `<option value="${u.id}">${escapar(u.nome)}</option>`;
	});
}

// Registrar empréstimo
document
	.getElementById("form-emprestimo")
	.addEventListener("submit", async (e) => {
		e.preventDefault();

		const livroId = parseInt(document.getElementById("emprestimo-livro").value);
		const usuarioId = parseInt(
			document.getElementById("emprestimo-usuario").value,
		);

		// 1. Verifica no banco se o livro continua disponível
		const { data: livro, error: erroLivro } = await supabaseClient
			.from("livros")
			.select("disponivel")
			.eq("id", livroId)
			.single();

		if (erroLivro) {
			mostrarMensagem("Erro ao verificar livro: " + erroLivro.message, "erro");
			return;
		}

		if (!livro.disponivel) {
			mostrarMensagem("Este livro já está emprestado.", "erro");
			atualizarTudo();
			return;
		}

		// 2. Registra o empréstimo
		const { error: erroEmprestimo } = await supabaseClient
			.from("emprestimos")
			.insert({ livro_id: livroId, usuario_id: usuarioId });

		if (erroEmprestimo) {
			mostrarMensagem(
				"Erro ao registrar empréstimo: " + erroEmprestimo.message,
				"erro",
			);
			return;
		}

		// 3. Marca o livro como indisponível
		await supabaseClient
			.from("livros")
			.update({ disponivel: false })
			.eq("id", livroId);

		mostrarMensagem("Empréstimo registrado.");
		atualizarTudo();
	});

// Registrar devolução
async function devolverLivro(emprestimoId, livroId) {
	// 1. Marca o empréstimo como devolvido
	const { error } = await supabaseClient
		.from("emprestimos")
		.update({ devolvido: true, data_devolucao: hoje() })
		.eq("id", emprestimoId);

	if (error) {
		mostrarMensagem("Erro ao registrar devolução: " + error.message, "erro");
		return;
	}

	// 2. Livro volta a ficar disponível
	await supabaseClient
		.from("livros")
		.update({ disponivel: true })
		.eq("id", livroId);

	mostrarMensagem("Devolução registrada.");
	atualizarTudo();
}

// Listar histórico de empréstimos
async function listarEmprestimos() {
	// Busca os empréstimos junto com o título do livro e o nome do usuário
	// (o Supabase usa as chaves estrangeiras para fazer a junção)
	const { data, error } = await supabaseClient
		.from("emprestimos")
		.select(
			"id, livro_id, data_emprestimo, data_devolucao, devolvido, livros(titulo), usuarios(nome)",
		)
		.order("id", { ascending: false });

	if (error) {
		mostrarMensagem("Erro ao listar empréstimos: " + error.message, "erro");
		return;
	}

	const tbody = document.getElementById("lista-emprestimos");
	tbody.innerHTML = "";

	if (data.length === 0) {
		tbody.innerHTML = `<tr><td colspan="5">Nenhum empréstimo registrado.</td></tr>`;
		return;
	}

	data.forEach((emp) => {
		const acao = emp.devolvido
			? `<span class="disponivel">Devolvido</span>`
			: `<button class="devolver" onclick="devolverLivro(${emp.id}, ${emp.livro_id})">Devolver</button>`;

		tbody.innerHTML += `
            <tr>
                <td>${escapar(emp.livros?.titulo)}</td>
                <td>${escapar(emp.usuarios?.nome)}</td>
                <td>${formatarData(emp.data_emprestimo)}</td>
                <td>${formatarData(emp.data_devolucao)}</td>
                <td>${acao}</td>
            </tr>`;
	});
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

function atualizarTudo() {
	listarLivros();
	listarUsuarios();
	listarEmprestimos();
	carregarOpcoesEmprestimo();
}

atualizarTudo();

// script.js - Sys Pão - Sistema de Gestão
// Desenvolvido por Leandro Yata - 2025

// ========== VARIÁVEIS GLOBAIS ==========
let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let compras = JSON.parse(localStorage.getItem('compras')) || [];
let fornecedores = JSON.parse(localStorage.getItem('fornecedores')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
let despesas = JSON.parse(localStorage.getItem('despesas')) || [];
let relatoriosSalvos = JSON.parse(localStorage.getItem('relatoriosSalvos')) || [];

// Variáveis para controle de edição
let itemEditando = null;
let fornecedorEditando = null;
let clienteEditando = null;
let usuarioEditando = null;

// Variáveis para câmera
let stream = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema inicializando...');
    atualizarDataHoraFooter();
    atualizarDataHoraFooter();
    setInterval(atualizarDataHoraFooter, 1000);
    
    // Verificar se já está logado
    if (localStorage.getItem('loggedIn') === 'true') {
        console.log('Usuário já logado, redirecionando...');
        loginScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        hamburgerMenuContainer.style.display = 'flex';
        document.body.classList.add('logged-in');
        
        // SEMPRE iniciar na Dashboard
        routeMenu('dashboard');
        // Atualiza nome do usuário no footer se já estiver logado
        atualizarFooterUsuario();
    }
    
    // Inicializar data atual nos formulários
    const hoje = new Date().toISOString().split('T')[0];
    if (document.getElementById('vendaData')) document.getElementById('vendaData').value = hoje;
    if (document.getElementById('compraData')) document.getElementById('compraData').value = hoje;
    if (document.getElementById('prodValidade')) document.getElementById('prodValidade').value = hoje;
    
    // Carregar dados iniciais se estiver vazio
    if (estoque.length === 0 && fornecedores.length === 0) {
        carregarDadosIniciais();
    }
    
    // Carregar lista de produtos para vendas
    atualizarSelectProdutosVenda();
    // Atualizar badge de notificações ao carregar
    atualizarNotificacoesECounter();
});

// ================= NOTIFICAÇÕES DE ESTOQUE ==================
function abrirModalNotificacoes() {
    const modal = document.getElementById('modalNotificacoes');
    if (!modal) return;
    modal.classList.remove('hidden');
    // garantir filtro padrão
    const sel = document.getElementById('notFilter');
    if (sel && !sel.value) sel.value = 'baixoEstoque';
    renderizarNotificacoes();
}

function fecharModalNotificacoes() {
    const modal = document.getElementById('modalNotificacoes');
    if (!modal) return;
    modal.classList.add('hidden');
}

function renderizarNotificacoes() {
    const container = document.getElementById('notificacoesContent');
    if (!container) return;
    const filtro = document.getElementById('notFilter') ? document.getElementById('notFilter').value : 'baixoEstoque';
    const dados = getNotificacaoDados(filtro);

    // montar tabela HTML
    let html = '<table><thead><tr>';
    if (filtro === 'maisVendidos') {
        html += '<th>Produto</th><th>Total Vendido</th><th>Quantidade em Estoque</th><th>Unidade</th><th>Tipo</th><th>Fornecedor</th>';
    } else {
        html += '<th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Unidade</th><th>Preço (R$)</th><th>Fornecedor</th>';
    }
    html += '</tr></thead><tbody>';

    if (!dados || dados.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;color:#666;">Nenhum item encontrado</td></tr>';
    } else {
        dados.forEach(item => {
            if (filtro === 'maisVendidos') {
                html += `<tr><td>${item.nome}</td><td>${item.totalVendido || 0}</td><td>${item.quantidade || 0}</td><td>${item.unidade || ''}</td><td>${item.tipo || ''}</td><td>${item.fornecedor || '-'}</td></tr>`;
            } else {
                html += `<tr><td>${item.nome}</td><td>${item.tipo || ''}</td><td>${item.quantidade || 0}</td><td>${item.unidade || ''}</td><td>${formatBRL(item.preco || 0)}</td><td>${item.fornecedor || '-'}</td></tr>`;
            }
        });
    }

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Remove caracteres indesejados (ex.: emojis) e normaliza texto para export/PDF
function sanitizeForExport(text) {
    if (text === null || text === undefined) return '';
    try {
        const s = text.toString();
        // manter letras, números, pontuação e espaços — remover pictogramas como emojis
        return s.replace(/[^\p{L}\p{N}\p{P}\p{Zs}]+/gu, '').trim();
    } catch (e) {
        // fallback mais simples quando engine não suportar propriedades Unicode
        return text.toString().replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]+/gu, '').trim();
    }
}

function atualizarBadgeNotificacoes() {
    const badge = document.getElementById('notBadge');
    if (!badge) return;
    const est = JSON.parse(localStorage.getItem('estoque')) || estoque || [];
    const count = est.filter(i => parseFloat(i.quantidade || 0) <= 10 && parseFloat(i.quantidade || 0) >= 0).length;
    if (count > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = count > 99 ? '99+' : String(count);
    } else {
        badge.style.display = 'none';
    }
}

function atualizarNotificacoesECounter() {
    atualizarBadgeNotificacoes();
    // se modal aberto, re-renderizar o conteúdo para refletir mudanças
    const modal = document.getElementById('modalNotificacoes');
    if (modal && !modal.classList.contains('hidden')) {
        renderizarNotificacoes();
    }
}

function getNotificacaoDados(filtro) {
    // retorna array de objetos com campos: nome,tipo,quantidade,unidade,preco,fornecedor, totalVendido
    const est = JSON.parse(localStorage.getItem('estoque')) || estoque || [];
    const ven = JSON.parse(localStorage.getItem('vendas')) || vendas || [];

    if (filtro === 'baixoEstoque') {
        return est.filter(i => parseFloat(i.quantidade || 0) <= 10 && parseFloat(i.quantidade || 0) > 0)
                  .sort((a,b) => a.quantidade - b.quantidade);
    }

    if (filtro === 'semEstoque') {
        return est.filter(i => parseFloat(i.quantidade || 0) <= 0);
    }

    if (filtro === 'maiorEstoque') {
        return est.slice().sort((a,b) => parseFloat(b.quantidade || 0) - parseFloat(a.quantidade || 0));
    }

    if (filtro === 'menorEstoque') {
        return est.slice().sort((a,b) => parseFloat(a.quantidade || 0) - parseFloat(b.quantidade || 0));
    }

    if (filtro === 'maisVendidos') {
        // agrupar vendas por produto
        const mapa = {};
        ven.forEach(v => {
            const nome = v.produto || '—';
            const qtd = parseFloat(v.quantidade || 0);
            mapa[nome] = (mapa[nome] || 0) + qtd;
        });
        // transformar em array e anexar info de estoque
        const arr = Object.keys(mapa).map(nome => {
            const estoqueItem = est.find(e => (e.nome || '').toString().trim().toLowerCase() === nome.toString().trim().toLowerCase());
            return {
                nome,
                totalVendido: mapa[nome],
                quantidade: estoqueItem ? estoqueItem.quantidade : 0,
                unidade: estoqueItem ? estoqueItem.unidade : '',
                tipo: estoqueItem ? estoqueItem.tipo : '',
                fornecedor: estoqueItem ? estoqueItem.fornecedor : ''
            };
        });
        return arr.sort((a,b) => b.totalVendido - a.totalVendido);
    }

    return [];
}

function exportNotificacoesPDF() {
    const filtro = document.getElementById('notFilter') ? document.getElementById('notFilter').value : 'baixoEstoque';
    const dados = getNotificacaoDados(filtro);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const titulo = 'Notificações de Estoque - ' + (document.querySelector('#notFilter option:checked') ? document.querySelector('#notFilter option:checked').textContent : filtro);
    const agora = new Date();
    const dataHora = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    // header
    doc.setFontSize(14);
    doc.text(titulo, 15, 20);
    doc.setFontSize(10);
    doc.text(dataHora, 15, 28);

    const cols = (filtro === 'maisVendidos') ? ['Produto','Total Vendido','Qtd Estoque','Unid','Tipo','Fornecedor'] : ['Produto','Tipo','Quantidade','Unidade','Preço (R$)','Fornecedor'];
    const rows = dados.map(d => {
        if (filtro === 'maisVendidos') return [sanitizeForExport(d.nome || ''), Number(d.totalVendido || 0), Number(d.quantidade || 0), sanitizeForExport(d.unidade || ''), sanitizeForExport(d.tipo || ''), sanitizeForExport(d.fornecedor || '-')];
        return [sanitizeForExport(d.nome || ''), sanitizeForExport(d.tipo || ''), Number(d.quantidade || 0), sanitizeForExport(d.unidade || ''), formatBRL(Number(d.preco || 0)), sanitizeForExport(d.fornecedor || '-')];
    });

    // Se houver tabela, adicionar totals (quando fizer sentido)
    if (doc.autoTable) {
        doc.autoTable({ startY: 40, head: [cols], body: rows, theme: 'striped', styles: { fontSize: 9 } });
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 40;

        // Totais: aplicar quando houver coluna quantidade
        const totalQuantidade = dados.reduce((s, d) => s + (Number(d.quantidade || 0)), 0);
        // valor total de estoque (quando tiver propriedade preco)
        const totalValor = dados.reduce((s, d) => s + (Number(d.preco || 0) * Number(d.quantidade || 0)), 0);
        doc.setFontSize(11);
        doc.text(`Totais — Quantidade: ${totalQuantidade}    Valor Total: ${formatBRL(totalValor)}`, 15, finalY + 6);
    } else {
        let y = 40;
        doc.setFontSize(10);
        doc.text(cols.join(' | '), 15, y); y += 8;
        rows.forEach(r => { doc.text(r.join(' | '), 15, y); y += 7; if (y > 180) { doc.addPage('landscape'); y = 20; } });
        const totalQuantidade = dados.reduce((s, d) => s + (Number(d.quantidade || 0)), 0);
        const totalValor = dados.reduce((s, d) => s + (Number(d.preco || 0) * Number(d.quantidade || 0)), 0);
        doc.setFontSize(11);
        if (y + 10 > 180) { doc.addPage('landscape'); y = 20; }
        doc.text(`Totais — Quantidade: ${totalQuantidade}    Valor Total: ${formatBRL(totalValor)}`, 15, y + 8);
    }

    doc.save(`Notificacoes_Estoque_${filtro}_${agora.toISOString().slice(0,10)}.pdf`);
}

function exportNotificacoesExcel() {
    const filtro = document.getElementById('notFilter') ? document.getElementById('notFilter').value : 'baixoEstoque';
    const dados = getNotificacaoDados(filtro);
    const wb = XLSX.utils.book_new();
    const header = [[`Notificações de Estoque - ${filtro}`], ['Data/Hora', new Date().toLocaleString('pt-BR')], []];
    let rows = [];
    if (filtro === 'maisVendidos') {
        rows.push(['Produto','Total Vendido','Quantidade Estoque','Unidade','Tipo','Fornecedor']);
        dados.forEach(d => rows.push([sanitizeForExport(d.nome), Number(d.totalVendido || 0), Number(d.quantidade || 0), sanitizeForExport(d.unidade), sanitizeForExport(d.tipo), sanitizeForExport(d.fornecedor)]));
    } else {
        rows.push(['Produto','Tipo','Quantidade','Unidade','Preço (R$)','Fornecedor']);
        dados.forEach(d => rows.push([sanitizeForExport(d.nome), sanitizeForExport(d.tipo), Number(d.quantidade || 0), sanitizeForExport(d.unidade), Number(d.preco || 0), sanitizeForExport(d.fornecedor)]));
        // adicionar linha de totais ao final
        const somaQtd = dados.reduce((s, it) => s + Number(it.quantidade || 0), 0);
        const somaValor = dados.reduce((s, it) => s + (Number(it.preco || 0) * Number(it.quantidade || 0)), 0);
        rows.push([]);
        rows.push(['Totais', '', somaQtd, '', formatBRL(somaValor), '']);
    }

    const wsData = [...header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Notificacoes');
    XLSX.writeFile(wb, `Notificacoes_Estoque_${filtro}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ========== LOGIN E AUTENTICAÇÃO ==========
function loginComEnter(event) {
    if (event.key === 'Enter') login();
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    if (username === 'admin' && password === 'admin') {
        localStorage.setItem('loggedIn', 'true');
        // store current user login for footer display
        localStorage.setItem('currentUserLogin', username);
        // salvar também o nome exibido (se existir em `usuarios`, usa o nome; senão usa o login)
        const usuarioObj = (usuarios || []).find(u => u.login === username);
        if (usuarioObj && usuarioObj.nome) {
            localStorage.setItem('currentUserName', usuarioObj.nome);
        } else {
            localStorage.setItem('currentUserName', username);
        }
        loginScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        hamburgerMenuContainer.style.display = 'flex';
        document.body.classList.add('logged-in');
        
        // SEMPRE iniciar na Dashboard
        routeMenu('dashboard');
        atualizarFooterUsuario();
        errorDiv.classList.add('hidden');
    } else {
        errorDiv.textContent = '❌ Usuário ou senha incorretos! Use: admin/admin';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('currentUserLogin');
    localStorage.removeItem('currentUserName');
    loginScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    hamburgerMenuContainer.style.display = 'none';
    document.body.classList.remove('logged-in');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    atualizarFooterUsuario();
}

// ========== NAVEGAÇÃO E MENU ==========
function toggleMenu() {
    const menu = document.getElementById('menuOptions');
    menu.classList.toggle('open');
}

function routeMenu(destino) {
    console.log('Navegando para:', destino);
    
    // Esconder todas as seções
    document.querySelectorAll('main section').forEach(sec => {
        sec.classList.add('hidden');
    });
    
    // Remover classe active de todos os botões do menu
    document.querySelectorAll('.menu-box button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar seção destino e ativar botão correspondente
    const secId = 'sec' + destino.charAt(0).toUpperCase() + destino.slice(1);
    const btnId = 'menu' + destino.charAt(0).toUpperCase() + destino.slice(1) + 'Btn';
    
    if (document.getElementById(secId)) {
        document.getElementById(secId).classList.remove('hidden');
    }
    
    if (document.getElementById(btnId)) {
        document.getElementById(btnId).classList.add('active');
    }
    
    // Fechar menu se estiver aberto
    const menu = document.getElementById('menuOptions');
    if (menu && menu.classList.contains('open')) {
        menu.classList.remove('open');
    }
    
    // Atualizar dados específicos da seção
    switch(destino) {
        case 'dashboard':
            atualizarDashboard();
            break;
        case 'produtos':
            renderizarEstoque();
            break;
        case 'vendas':
            renderizarVendas();
            break;
        case 'compras':
            renderizarCompras();
            break;
        case 'fornecedores':
            renderizarFornecedores();
            break;
        case 'clientes':
            renderizarClientes();
            break;
        case 'relatorios':
            renderizarRelatoriosSalvos();
            break;
        case 'financeira':
            renderizarFinanceiro();
            break;
        case 'usuarios':
            renderizarUsuarios();
            break;
    }
}

// ========== DASHBOARD ==========
function atualizarDashboard() {
    console.log('Atualizando dashboard...');
    
    // Totais básicos
    const totalVendas = vendas.reduce((sum, v) => sum + parseFloat(v.valor || 0), 0);
    const totalCompras = compras.reduce((sum, c) => sum + parseFloat(c.valorTotal || 0), 0);
    const totalProdutosVendidos = vendas.reduce((sum, v) => sum + parseInt(v.quantidade || 0), 0);
    const totalItensEstoque = estoque.reduce((sum, e) => sum + parseFloat(e.quantidade || 0), 0);
    const produtosBaixoEstoque = estoque.filter(e => parseFloat(e.quantidade || 0) < 10).length;
    
    if (document.getElementById('totalVendas')) {
        document.getElementById('totalVendas').textContent = formatBRL(totalVendas);
        document.getElementById('totalCompras').textContent = formatBRL(totalCompras);
        document.getElementById('totalProdutosVendidos').textContent = totalProdutosVendidos;
        document.getElementById('totalItensEstoque').textContent = totalItensEstoque.toFixed(0);
        document.getElementById('produtosBaixoEstoque').textContent = produtosBaixoEstoque;
    }
    
    // Última compra
    const ultimaCompra = compras[compras.length - 1];
    const ultimaCompraDiv = document.getElementById('ultimaCompra');
    if (ultimaCompraDiv) {
        if (ultimaCompra) {
            ultimaCompraDiv.innerHTML = `
                <div style="padding: 10px; background: #f5f5f5; border-radius: 8px; margin-top: 10px;">
                    <strong>${ultimaCompra.produto}</strong><br>
                    Quantidade: ${ultimaCompra.quantidade}<br>
                    Valor: ${formatBRL(ultimaCompra.valorTotal || 0)}<br>
                    Data: ${ultimaCompra.data}
                </div>
            `;
        } else {
            ultimaCompraDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: #666;">Nenhuma compra registrada</div>';
        }
    }
    
    // Produtos mais vendidos
    atualizarProdutosMaisVendidos();
}

function atualizarProdutosMaisVendidos() {
    const container = document.getElementById('chartProdutosVendidos');
    if (!container) return;
    
    // Calcular totais por produto
    const produtosVendidos = {};
    
    vendas.forEach(venda => {
        const produto = venda.produto;
        const quantidade = parseInt(venda.quantidade) || 0;
        
        if (produtosVendidos[produto]) {
            produtosVendidos[produto] += quantidade;
        } else {
            produtosVendidos[produto] = quantidade;
        }
    });
    
    // Converter para array e ordenar por quantidade
    const produtosOrdenados = Object.entries(produtosVendidos)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 3); // Top 3 produtos
    
    // Exibir os produtos mais vendidos
    if (produtosOrdenados.length > 0) {
        let html = '<ul class="produtos-mais-vendidos">';
        produtosOrdenados.forEach(produto => {
            html += `
                <li>
                    <span class="produto-nome">${produto.nome}</span>
                    <span class="produto-quantidade">${produto.quantidade} vendas</span>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">Nenhuma venda registrada ainda</p>';
    }
}

// ========== ESTOQUE/PRODUTOS ==========
function toggleListaEstoque() {
    const container = document.getElementById('listaEstoqueContainer');
    const btn = document.getElementById('btnVerLista');
    
    if (container && btn) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            btn.textContent = '🙈 Ocultar Lista';
            renderizarEstoque();
        } else {
            container.classList.add('hidden');
            btn.textContent = '📋 Ver Lista';
        }
    }
}

function renderizarEstoque() {
    const tbody = document.getElementById('estoqueBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const dados = obterDadosFiltradosTabela('estoque');
    dados.forEach((item, idx) => {
        // localizar índice original no array `estoque` para operações de editar/excluir
        const index = estoque.findIndex(e => e && e.nome === item.nome && String(e.quantidade) === String(item.quantidade) && (e.fornecedor||'') === (item.fornecedor||''));
        const tr = document.createElement('tr');
        const estoqueBaixo = parseFloat(item.quantidade || 0) < 10;
        tr.style.backgroundColor = estoqueBaixo ? '#ffebee' : '';
        
        tr.innerHTML = `
            <td style="${estoqueBaixo ? 'color: #d32f2f; font-weight: bold;' : ''}">${item.nome || ''}</td>
            <td>${item.tipo || ''}</td>
            <td style="${estoqueBaixo ? 'color: #d32f2f; font-weight: bold;' : ''}">${item.quantidade || 0}</td>
            <td>${item.unidade || ''}</td>
            <td>${formatBRL(item.preco ? parseFloat(item.preco) : 0)}</td>
            <td>${item.validade || '-'}</td>
            <td>${item.fornecedor || '-'}</td>
            <td>
                <button onclick="editarEstoque(${index})" title="Editar">✏️</button>
                <button onclick="excluirEstoque(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarEstoque() {
    // Re-renderiza a tabela usando o filtro atual (sincroniza com obterDadosFiltrados)
    renderizarEstoque();
}

function adicionarEstoque(event) {
    event.preventDefault();
    
    const produto = {
        nome: document.getElementById('prodNome').value,
        tipo: document.getElementById('prodTipo').value,
        quantidade: parseFloat(document.getElementById('prodQtd').value) || 0,
        unidade: document.getElementById('prodUnidade').value,
        preco: document.getElementById('prodPreco').value ? parseFloat(document.getElementById('prodPreco').value) : 0,
        validade: document.getElementById('prodValidade').value,
        fornecedor: document.getElementById('prodFornecedor').value
    };
    
    // Verificar se fornecedor existe
    if (produto.fornecedor && !fornecedores.some(f => f.nome && f.nome.toLowerCase() === produto.fornecedor.toLowerCase())) {
        const erroDiv = document.getElementById('erro-prodFornecedor');
        if (erroDiv) {
            erroDiv.textContent = 'Fornecedor não encontrado. Clique no "+" para cadastrar.';
            erroDiv.classList.remove('hidden');
        }
        return;
    }
    
    if (itemEditando !== null) {
        // Modo edição - atualizar item existente
        estoque[itemEditando] = produto;
        itemEditando = null;
        
        // Restaurar botão para modo normal
        document.getElementById('btnSalvarEstoque').textContent = '💾 Salvar';
        document.getElementById('btnCancelarEdicao').style.display = 'none';
    } else {
        // Modo adição - adicionar novo item
        estoque.push(produto);
    }
    
    localStorage.setItem('estoque', JSON.stringify(estoque));
    
    // Limpar formulário
    limparFormEstoque();
    
    // Atualizar lista se estiver visível
    if (document.getElementById('listaEstoqueContainer') && !document.getElementById('listaEstoqueContainer').classList.contains('hidden')) {
        renderizarEstoque();
    }
    
    // Atualizar dashboard e select de produtos
    atualizarDashboard();
    atualizarSelectProdutosVenda();
    
    // Atualizar badge/modal de notificações
    atualizarNotificacoesECounter();

    alert('✅ Produto/Insumo salvo com sucesso!');
}

function limparFormEstoque() {
    document.getElementById('formEstoque').reset();
    const erroDiv = document.getElementById('erro-prodFornecedor');
    if (erroDiv) erroDiv.classList.add('hidden');
    
    // Restaurar modo normal
    itemEditando = null;
    document.getElementById('btnSalvarEstoque').textContent = '💾 Salvar';
    document.getElementById('btnCancelarEdicao').style.display = 'none';
}

function editarEstoque(index) {
    const item = estoque[index];
    
    document.getElementById('prodNome').value = item.nome || '';
    document.getElementById('prodTipo').value = item.tipo || '';
    document.getElementById('prodQtd').value = item.quantidade || 0;
    document.getElementById('prodUnidade').value = item.unidade || '';
    document.getElementById('prodPreco').value = item.preco || '';
    document.getElementById('prodValidade').value = item.validade || '';
    document.getElementById('prodFornecedor').value = item.fornecedor || '';
    
    // Configurar modo edição
    itemEditando = index;
    document.getElementById('btnSalvarEstoque').textContent = '💾 Atualizar';
    document.getElementById('btnCancelarEdicao').style.display = 'inline-block';
}

function cancelarEdicaoEstoque() {
    limparFormEstoque();
}

function excluirEstoque(index) {
    if (confirm('Tem certeza que deseja excluir este item do estoque?')) {
        estoque.splice(index, 1);
        localStorage.setItem('estoque', JSON.stringify(estoque));
        renderizarEstoque();
        atualizarDashboard();
        atualizarSelectProdutosVenda();
            // Atualizar badge/modal de notificações
            atualizarNotificacoesECounter();

            alert('✅ Item excluído com sucesso!');
    }
}

// ========== VENDAS ==========
function toggleListaVendas() {
    const container = document.getElementById('listaVendasContainer');
    const btn = document.getElementById('btnVerListaVendas');
    
    if (container && btn) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            btn.textContent = '🙈 Ocultar Lista';
            renderizarVendas();
        } else {
            container.classList.add('hidden');
            btn.textContent = '📋 Ver Lista';
        }
    }
}

function renderizarVendas() {
    const tbody = document.getElementById('vendasBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const dados = obterDadosFiltradosTabela('vendas');
    dados.forEach((venda, idx) => {
        const index = vendas.findIndex(v => v && v.data === venda.data && v.produto === venda.produto && String(v.valor) === String(venda.valor));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${venda.data || ''}</td>
            <td>${venda.produto || ''}</td>
            <td>${venda.quantidade || 0}</td>
            <td>${formatBRL(venda.valor || 0)}</td>
            <td>${venda.hora || ''}</td>
            <td>${venda.cliente || 'Cliente não informado'}</td>
            <td>${venda.formaPagamento || 'Não informado'}</td>
            <td>
                <button onclick="excluirVenda(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarVendas() {
    // Re-renderiza a tabela usando o filtro atual
    renderizarVendas();
}

function atualizarSelectProdutosVenda() {
    const select = document.getElementById('vendaProduto');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    const produtos = estoque.filter(item => item.tipo === 'Produto');
    produtos.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.nome;
        option.textContent = `${produto.nome} (Estoque: ${produto.quantidade} ${produto.unidade})`;
        option.dataset.preco = produto.preco || 0;
        select.appendChild(option);
    });
}

function atualizarPrecoVenda() {
    const select = document.getElementById('vendaProduto');
    if (!select) return;
    
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.preco) {
        document.getElementById('vendaPrecoUnitario').value = parseFloat(selectedOption.dataset.preco).toFixed(2);
        calcularValorTotalVenda();
    }
}

function calcularValorTotalVenda() {
    const quantidade = parseInt(document.getElementById('vendaQtd').value) || 0;
    const precoUnitario = parseFloat(document.getElementById('vendaPrecoUnitario').value) || 0;
    document.getElementById('vendaValor').value = (quantidade * precoUnitario).toFixed(2);
}

function registrarVenda(event) {
    event.preventDefault();
    
    const produtoSelect = document.getElementById('vendaProduto');
    const produtoNome = produtoSelect.value;
    
    // Verificar estoque
    const produtoEstoque = estoque.find(item => item.nome === produtoNome);
    if (!produtoEstoque) {
        alert('❌ Produto não encontrado no estoque!');
        return;
    }
    
    const quantidadeVenda = parseInt(document.getElementById('vendaQtd').value) || 0;
    if (produtoEstoque.quantidade < quantidadeVenda) {
        alert(`❌ Estoque insuficiente! Disponível: ${produtoEstoque.quantidade} ${produtoEstoque.unidade}`);
        return;
    }
    
    const cliente = document.getElementById('vendaCliente').value;
    
    // Verificar se cliente existe
    if (cliente && !clientes.some(c => c.nome && c.nome.toLowerCase() === cliente.toLowerCase())) {
        const erroDiv = document.getElementById('erro-vendaCliente');
        if (erroDiv) {
            erroDiv.textContent = 'Cliente não encontrado. Clique no "+" para cadastrar.';
            erroDiv.classList.remove('hidden');
        }
        return;
    }
    
    const venda = {
        produto: produtoNome,
        quantidade: quantidadeVenda,
        precoUnitario: parseFloat(document.getElementById('vendaPrecoUnitario').value) || 0,
        valor: parseFloat(document.getElementById('vendaValor').value) || 0,
        data: document.getElementById('vendaData').value,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        cliente: cliente || 'Cliente não informado',
        formaPagamento: document.getElementById('vendaFormaPagamento').value
    };
    
    // Atualizar estoque
    produtoEstoque.quantidade -= quantidadeVenda;
    localStorage.setItem('estoque', JSON.stringify(estoque));
    
    // Registrar venda
    vendas.push(venda);
    localStorage.setItem('vendas', JSON.stringify(vendas));
    
    // Limpar formulário
    limparFormVenda();
    
    // Atualizar lista se estiver visível
    if (document.getElementById('listaVendasContainer') && !document.getElementById('listaVendasContainer').classList.contains('hidden')) {
        renderizarVendas();
    }
    
    // Atualizar dashboard e select de produtos
    atualizarDashboard();
    atualizarSelectProdutosVenda();
    
    // Atualizar badge/modal de notificações (venda altera estoque)
    atualizarNotificacoesECounter();

    alert('✅ Venda registrada com sucesso!');
}

function limparFormVenda() {
    document.getElementById('formVenda').reset();
    document.getElementById('vendaValor').value = '';
    document.getElementById('vendaData').value = new Date().toISOString().split('T')[0];
    document.getElementById('vendaFormaPagamento').value = '';
    const erroDiv = document.getElementById('erro-vendaCliente');
    if (erroDiv) erroDiv.classList.add('hidden');
}

function excluirVenda(index) {
    if (confirm('Tem certeza que deseja excluir esta venda?')) {
        // Restaurar estoque
        const venda = vendas[index];
        const produtoEstoque = estoque.find(item => item.nome === venda.produto);
        if (produtoEstoque) {
            produtoEstoque.quantidade += parseInt(venda.quantidade);
            localStorage.setItem('estoque', JSON.stringify(estoque));
        }
        
        vendas.splice(index, 1);
        localStorage.setItem('vendas', JSON.stringify(vendas));
        renderizarVendas();
        atualizarDashboard();
        atualizarSelectProdutosVenda();
            // Atualizar badge/modal de notificações
            atualizarNotificacoesECounter();

            alert('✅ Venda excluída com sucesso!');
    }
}

// ========== COMPRAS ==========
function toggleListaCompras() {
    const container = document.getElementById('listaComprasContainer');
    const btn = document.getElementById('btnVerListaCompras');
    
    if (container && btn) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            btn.textContent = '🙈 Ocultar Lista';
            renderizarCompras();
        } else {
            container.classList.add('hidden');
            btn.textContent = '📋 Ver Lista';
        }
    }
}

function renderizarCompras() {
    const tbody = document.getElementById('comprasBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const dados = obterDadosFiltradosTabela('compras');
    dados.forEach((compra, idx) => {
        const index = compras.findIndex(c => c && c.data === compra.data && c.produto === compra.produto && String(c.valorTotal) === String(compra.valorTotal));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${compra.data || ''}</td>
            <td>${compra.produto || ''}</td>
            <td>${compra.nf || ''}</td>
            <td>${compra.quantidade || 0}</td>
            <td>${formatBRL(compra.valorUnitario || 0)}</td>
            <td>${formatBRL(compra.valorTotal || 0)}</td>
            <td>${compra.fornecedor || '-'}</td>
            <td>
                <button onclick="excluirCompra(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ========== FINANCEIRO ==========
function renderizarFinanceiro() {
    const tbody = document.getElementById('financeiroBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dados = obterDespesasFiltradas();
    dados.forEach((d, idx) => {
        const index = despesas.findIndex(x => x && x._id === d._id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.data || ''}</td>
            <td>${sanitizeForExport(d.descricao || '')}</td>
            <td>${sanitizeForExport(d.categoria || '')}</td>
            <td>${d.tipo || ''}</td>
            <td>${formatBRL(Number(d.valor || 0))}</td>
            <td>${sanitizeForExport(d.fornecedor || '-')}</td>
            <td>
              <button onclick="editarDespesa('${d._id}')">✏️</button>
              <button onclick="excluirDespesa(${index})" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // resumo
    const resumo = document.getElementById('financeiroResumo');
    if (resumo) {
        const totalReceitas = dados.filter(i=>i.tipo==='Receita').reduce((s,i)=>s+Number(i.valor||0),0);
        const totalDespesas = dados.filter(i=>i.tipo==='Despesa').reduce((s,i)=>s+Number(i.valor||0),0);
        const saldo = totalReceitas - totalDespesas;
        resumo.textContent = `Total Receitas: ${formatBRL(totalReceitas)}    Total Despesas: ${formatBRL(totalDespesas)}    Saldo: ${formatBRL(saldo)}`;
    }
}

function obterDespesasFiltradas() {
    const filtro = (document.getElementById('filtroFinanceiro') && document.getElementById('filtroFinanceiro').value.toLowerCase()) || '';
    const inicio = document.getElementById('finInicio') ? document.getElementById('finInicio').value : '';
    const fim = document.getElementById('finFim') ? document.getElementById('finFim').value : '';
    const categoria = (document.getElementById('finFiltroCategoria') && document.getElementById('finFiltroCategoria').value.toLowerCase()) || '';

    return (despesas || []).filter(d => {
        const texto = ((d.descricao||'') + ' ' + (d.fornecedor||'') + ' ' + (d.categoria||'')).toLowerCase();
        if (filtro && !texto.includes(filtro)) return false;
        if (categoria && !(d.categoria||'').toLowerCase().includes(categoria)) return false;
        if (inicio) {
            if ((d.data || '') < inicio) return false;
        }
        if (fim) {
            if ((d.data || '') > fim) return false;
        }
        return true;
    }).sort((a,b)=> (b.data||'').localeCompare(a.data||''));
}

function adicionarDespesa(event) {
    event.preventDefault();
    const data = document.getElementById('finData').value;
    const tipo = document.getElementById('finTipo').value;
    const categoria = document.getElementById('finCategoria').value;
    const valor = parseFloat(document.getElementById('finValor').value) || 0;
    const fornecedor = document.getElementById('finFornecedor').value;
    const descricao = document.getElementById('finDescricao').value;

    // criar id simples
    const id = 'dsp_' + Date.now();
    despesas.push({ _id: id, data, tipo, categoria, valor, fornecedor, descricao });
    localStorage.setItem('despesas', JSON.stringify(despesas));
    limparFormFinanceiro();
    renderizarFinanceiro();
    alert('✅ Lançamento salvo com sucesso!');
}

function limparFormFinanceiro() {
    const f = document.getElementById('formFinanceiro');
    if (f) f.reset();
}

function editarDespesa(id) {
    const item = despesas.find(d=>d._id===id);
    if (!item) return;
    document.getElementById('finData').value = item.data || '';
    document.getElementById('finTipo').value = item.tipo || 'Despesa';
    document.getElementById('finCategoria').value = item.categoria || '';
    document.getElementById('finValor').value = item.valor || 0;
    document.getElementById('finFornecedor').value = item.fornecedor || '';
    document.getElementById('finDescricao').value = item.descricao || '';

    // ao salvar, substituir em vez de adicionar - usamos _editingId
    window._editingDespesaId = id;
    document.querySelector('#formFinanceiro button[type="submit"]').textContent = '💾 Atualizar';
    // interceptar submit
    const form = document.getElementById('formFinanceiro');
    form.onsubmit = function(e){
        e.preventDefault();
        const data = document.getElementById('finData').value;
        const tipo = document.getElementById('finTipo').value;
        const categoria = document.getElementById('finCategoria').value;
        const valor = parseFloat(document.getElementById('finValor').value) || 0;
        const fornecedor = document.getElementById('finFornecedor').value;
        const descricao = document.getElementById('finDescricao').value;
        const idx = despesas.findIndex(d=>d._id===window._editingDespesaId);
        if (idx >= 0) {
            despesas[idx] = { _id: window._editingDespesaId, data, tipo, categoria, valor, fornecedor, descricao };
            localStorage.setItem('despesas', JSON.stringify(despesas));
            window._editingDespesaId = null;
            form.onsubmit = adicionarDespesa;
            document.querySelector('#formFinanceiro button[type="submit"]').textContent = '💾 Salvar';
            limparFormFinanceiro();
            renderizarFinanceiro();
            alert('✅ Lançamento atualizado!');
        }
    };
}

function excluirDespesa(index) {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    despesas.splice(index,1);
    localStorage.setItem('despesas', JSON.stringify(despesas));
    renderizarFinanceiro();
}

function filtrarFinanceiro() {
    renderizarFinanceiro();
}

function importarComprasParaFinanceiro() {
    // importa compras como despesas (evita duplicar através da propriedade compraId)
    const comp = JSON.parse(localStorage.getItem('compras')) || compras || [];
    let added = 0;
    comp.forEach((c, idx) => {
        // verificar se já existe despesa referenciando essa compra
        const exists = despesas.some(d => d.compraId === idx || d.compraRef === (c.nf || c.produto));
        if (!exists) {
            const id = 'dsp_' + Date.now() + '_' + idx;
            despesas.push({ _id: id, data: c.data || '', tipo: 'Despesa', categoria: 'Compra', valor: Number(c.valorTotal || 0), fornecedor: c.fornecedor || '', descricao: 'Compra: ' + (c.produto||''), compraId: idx });
            added++;
        }
    });
    if (added > 0) {
        localStorage.setItem('despesas', JSON.stringify(despesas));
        renderizarFinanceiro();
        alert('✅ Importadas ' + added + ' compras como lançamentos.');
    } else {
        alert('ℹ️ Não há novas compras para importar.');
    }
}

function exportFinanceiroPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const agora = new Date();
    const dataHora = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR');
    doc.setFontSize(14);
    doc.text('Relatório Financeiro', 15, 20);
    doc.setFontSize(10);
    doc.text(dataHora, 15, 28);
    const cols = ['Data','Descrição','Categoria','Tipo','Valor (R$)','Fornecedor'];
    const dados = obterDespesasFiltradas();
    const rows = dados.map(d => [d.data || '', sanitizeForExport(d.descricao||''), sanitizeForExport(d.categoria||''), d.tipo||'', formatBRL(Number(d.valor||0)), sanitizeForExport(d.fornecedor||'')]);
    if (doc.autoTable) {
        doc.autoTable({ startY: 40, head: [cols], body: rows, theme: 'striped', styles: { fontSize: 9 } });
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 40;
        const totalReceitas = dados.filter(i=>i.tipo==='Receita').reduce((s,i)=>s+Number(i.valor||0),0);
        const totalDespesas = dados.filter(i=>i.tipo==='Despesa').reduce((s,i)=>s+Number(i.valor||0),0);
        const saldo = totalReceitas - totalDespesas;
        doc.setFontSize(11);
        doc.text(`Total Receitas: ${formatBRL(totalReceitas)}    Total Despesas: ${formatBRL(totalDespesas)}    Saldo: ${formatBRL(saldo)}`, 15, finalY+6);
    } else {
        let y = 40; doc.setFontSize(10); doc.text(cols.join(' | '),15,y); y+=8; rows.forEach(r=>{ doc.text(r.join(' | '),15,y); y+=7; if (y>180){doc.addPage('landscape'); y=20;} });
        const totalReceitas = dados.filter(i=>i.tipo==='Receita').reduce((s,i)=>s+Number(i.valor||0),0);
        const totalDespesas = dados.filter(i=>i.tipo==='Despesa').reduce((s,i)=>s+Number(i.valor||0),0);
        const saldo = totalReceitas - totalDespesas;
        if (y + 12 > 180) { doc.addPage('landscape'); y = 20; }
        doc.setFontSize(11); doc.text(`Total Receitas: ${formatBRL(totalReceitas)}    Total Despesas: ${formatBRL(totalDespesas)}    Saldo: ${formatBRL(saldo)}`, 15, y+8);
    }
    doc.save(`Relatorio_Financeiro_${agora.toISOString().slice(0,10)}.pdf`);
}

function exportFinanceiroExcel() {
    const dados = obterDespesasFiltradas();
    const wb = XLSX.utils.book_new();
    const header = [['Relatório Financeiro'], ['Data/Hora', new Date().toLocaleString('pt-BR')], []];
    const rows = [['Data','Descrição','Categoria','Tipo','Valor (R$)','Fornecedor']];
    dados.forEach(d => rows.push([d.data, d.descricao, d.categoria, d.tipo, Number(d.valor||0), d.fornecedor]));
    const somaReceitas = dados.filter(i=>i.tipo==='Receita').reduce((s,i)=>s+Number(i.valor||0),0);
    const somaDespesas = dados.filter(i=>i.tipo==='Despesa').reduce((s,i)=>s+Number(i.valor||0),0);
    rows.push([]);
    rows.push(['Totais','','','Receitas', somaReceitas, '']);
    rows.push(['Totais','','','Despesas', somaDespesas, '']);
    rows.push(['Saldo','','','', somaReceitas - somaDespesas, '']);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    XLSX.writeFile(wb, `Relatorio_Financeiro_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function filtrarCompras() {
    // Re-renderiza a tabela usando o filtro atual
    renderizarCompras();
}

// Retorna dados filtrados por tipo (estoque, vendas, compras) usando os campos de filtro existentes na UI
function obterDadosFiltradosTabela(tipo) {
    if (tipo === 'estoque') {
        const filtro = (document.getElementById('filtroEstoque') && document.getElementById('filtroEstoque').value.toLowerCase()) || '';
        return estoque.filter(item => {
            const texto = ((item.nome || '') + ' ' + (item.fornecedor || '') + ' ' + (item.tipo || '') + ' ' + (item.unidade || '')).toLowerCase();
            return texto.includes(filtro);
        });
    }
    if (tipo === 'vendas') {
        const filtro = (document.getElementById('filtroVendas') && document.getElementById('filtroVendas').value.toLowerCase()) || '';
        return vendas.filter(venda => {
            const texto = ((venda.produto || '') + ' ' + (venda.cliente || '') + ' ' + (venda.formaPagamento || '') + ' ' + (venda.data || '')).toLowerCase();
            return texto.includes(filtro);
        });
    }
    if (tipo === 'compras') {
        const filtro = (document.getElementById('filtroCompras') && document.getElementById('filtroCompras').value.toLowerCase()) || '';
        return compras.filter(compra => {
            const texto = ((compra.produto || '') + ' ' + (compra.fornecedor || '') + ' ' + (compra.nf || '') + ' ' + (compra.data || '')).toLowerCase();
            return texto.includes(filtro);
        });
    }
    return [];
}

function calcularValorTotalCompra() {
    const quantidade = parseInt(document.getElementById('compraQtd').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('compraValorUnitario').value) || 0;
    document.getElementById('compraValorTotal').value = (quantidade * valorUnitario).toFixed(2);
}

function registrarCompra(event) {
    event.preventDefault();
    
    const compra = {
        produto: document.getElementById('compraProduto').value,
        tipo: document.getElementById('compraTipo') ? document.getElementById('compraTipo').value : 'Insumo',
        quantidade: parseInt(document.getElementById('compraQtd').value) || 0,
        valorUnitario: parseFloat(document.getElementById('compraValorUnitario').value) || 0,
        valorTotal: parseFloat(document.getElementById('compraValorTotal').value) || 0,
        fornecedor: document.getElementById('compraFornecedor').value,
        nf: document.getElementById('compraNF') ? document.getElementById('compraNF').value : '',
        data: document.getElementById('compraData').value
    };
    
    // Verificar se fornecedor existe
    if (compra.fornecedor && !fornecedores.some(f => f.nome && f.nome.toLowerCase() === compra.fornecedor.toLowerCase())) {
        const erroDiv = document.getElementById('erro-compraFornecedor');
        if (erroDiv) {
            erroDiv.textContent = 'Fornecedor não encontrado. Clique no "+" para cadastrar.';
            erroDiv.classList.remove('hidden');
        }
        return;
    }
    
    // Adicionar/atualizar estoque
    const produtoExistente = estoque.find(item => item.nome && item.nome.toLowerCase() === compra.produto.toLowerCase());
    if (produtoExistente) {
        produtoExistente.quantidade += compra.quantidade;
        if (compra.valorUnitario > 0) {
            produtoExistente.preco = compra.valorUnitario;
        }
        if (compra.fornecedor) {
            produtoExistente.fornecedor = compra.fornecedor;
        }
        // atualizar tipo se informado
        if (compra.tipo) produtoExistente.tipo = compra.tipo;
    } else {
        estoque.push({
            nome: compra.produto,
            tipo: compra.tipo || 'Insumo',
            quantidade: compra.quantidade,
            unidade: 'un',
            preco: compra.valorUnitario,
            fornecedor: compra.fornecedor
        });
    }
    
    localStorage.setItem('estoque', JSON.stringify(estoque));
    
    // Registrar compra
    compras.push(compra);
    localStorage.setItem('compras', JSON.stringify(compras));
    
    // Limpar formulário
    limparFormCompra();
    
    // Atualizar lista se estiver visível
    if (document.getElementById('listaComprasContainer') && !document.getElementById('listaComprasContainer').classList.contains('hidden')) {
        renderizarCompras();
    }
    
    // Atualizar dashboard e select de produtos
    atualizarDashboard();
    atualizarSelectProdutosVenda();
    
    // Atualizar badge/modal de notificações (compra altera estoque)
    atualizarNotificacoesECounter();

    alert('✅ Compra registrada com sucesso!');
}

function limparFormCompra() {
    document.getElementById('formCompra').reset();
    document.getElementById('compraValorTotal').value = '';
    document.getElementById('compraData').value = new Date().toISOString().split('T')[0];
    const erroDiv = document.getElementById('erro-compraFornecedor');
    if (erroDiv) erroDiv.classList.add('hidden');
}

function excluirCompra(index) {
    if (confirm('Tem certeza que deseja excluir esta compra?')) {
        compras.splice(index, 1);
        localStorage.setItem('compras', JSON.stringify(compras));
        renderizarCompras();
        atualizarDashboard();
            // Atualizar badge/modal de notificações
            atualizarNotificacoesECounter();

            alert('✅ Compra excluída com sucesso!');
    }
}

// ========== FORNECEDORES ==========
function toggleListaFornecedores() {
    const container = document.getElementById('listaFornecedoresContainer');
    const btn = document.getElementById('btnVerListaFornecedores');
    
    if (container && btn) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            btn.textContent = '🙈 Ocultar Lista';
            renderizarFornecedores();
        } else {
            container.classList.add('hidden');
            btn.textContent = '📋 Ver Lista';
        }
    }
}

function renderizarFornecedores() {
    const tbody = document.getElementById('fornecedoresBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    fornecedores.forEach((fornecedor, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fornecedor.nome || ''}</td>
            <td>${fornecedor.cnpj || '-'}</td>
            <td>${fornecedor.telefone || '-'}</td>
            <td>${fornecedor.email || '-'}</td>
            <td>${fornecedor.endereco || '-'}</td>
            <td>${fornecedor.produtos || '-'}</td>
            <td>
                <button onclick="editarFornecedor(${index})" title="Editar">✏️</button>
                <button onclick="excluirFornecedor(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarFornecedores() {
    const filtro = document.getElementById('filtroFornecedores').value.toLowerCase();
    const linhas = document.querySelectorAll('#fornecedoresBody tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(filtro) ? '' : 'none';
    });
}

function adicionarFornecedor(event) {
    event.preventDefault();
    
    const fornecedor = {
        nome: document.getElementById('fornecedorNome').value,
        cnpj: document.getElementById('fornecedorCnpj').value,
        telefone: document.getElementById('fornecedorTelefone').value,
        email: document.getElementById('fornecedorEmail').value,
        endereco: document.getElementById('fornecedorEndereco').value,
        produtos: document.getElementById('fornecedorProdutos').value
    };
    
    if (fornecedorEditando !== null) {
        // Modo edição
        fornecedores[fornecedorEditando] = fornecedor;
        fornecedorEditando = null;
        
        document.getElementById('btnSalvarFornecedor').textContent = '💾 Salvar Fornecedor';
        document.getElementById('btnCancelarEdicaoFornecedor').style.display = 'none';
    } else {
        // Modo adição
        fornecedores.push(fornecedor);
    }
    
    localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
    
    // Limpar formulário
    limparFormFornecedor();
    
    // Atualizar lista se estiver visível
    if (document.getElementById('listaFornecedoresContainer') && !document.getElementById('listaFornecedoresContainer').classList.contains('hidden')) {
        renderizarFornecedores();
    }
    
    alert('✅ Fornecedor salvo com sucesso!');
}

function limparFormFornecedor() {
    document.getElementById('formFornecedor').reset();
    
    // Restaurar modo normal
    fornecedorEditando = null;
    document.getElementById('btnSalvarFornecedor').textContent = '💾 Salvar Fornecedor';
    document.getElementById('btnCancelarEdicaoFornecedor').style.display = 'none';
}

function editarFornecedor(index) {
    const fornecedor = fornecedores[index];
    
    document.getElementById('fornecedorNome').value = fornecedor.nome || '';
    document.getElementById('fornecedorCnpj').value = fornecedor.cnpj || '';
    document.getElementById('fornecedorTelefone').value = fornecedor.telefone || '';
    document.getElementById('fornecedorEmail').value = fornecedor.email || '';
    document.getElementById('fornecedorEndereco').value = fornecedor.endereco || '';
    document.getElementById('fornecedorProdutos').value = fornecedor.produtos || '';
    
    // Configurar modo edição
    fornecedorEditando = index;
    document.getElementById('btnSalvarFornecedor').textContent = '💾 Atualizar Fornecedor';
    document.getElementById('btnCancelarEdicaoFornecedor').style.display = 'inline-block';
}

function cancelarEdicaoFornecedor() {
    limparFormFornecedor();
}

function excluirFornecedor(index) {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        // Verificar se o fornecedor está sendo usado
        const fornecedor = fornecedores[index];
        const usadoNoEstoque = estoque.some(item => item.fornecedor === fornecedor.nome);
        const usadoNasCompras = compras.some(compra => compra.fornecedor === fornecedor.nome);
        
        if (usadoNoEstoque || usadoNasCompras) {
            alert('❌ Este fornecedor não pode ser excluído pois está sendo usado em estoque ou compras!');
            return;
        }
        
        fornecedores.splice(index, 1);
        localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
        renderizarFornecedores();
        alert('✅ Fornecedor excluído com sucesso!');
    }
}

// ========== CLIENTES ==========
function toggleListaClientes() {
    const container = document.getElementById('listaClientesContainer');
    const btn = document.getElementById('btnVerListaClientes');
    
    if (container && btn) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            btn.textContent = '🙈 Ocultar Lista';
            renderizarClientes();
        } else {
            container.classList.add('hidden');
            btn.textContent = '📋 Ver Lista';
        }
    }
}

function renderizarClientes() {
    const tbody = document.getElementById('clientesBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    clientes.forEach((cliente, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cliente.nome || ''}</td>
            <td>${cliente.cpf || '-'}</td>
            <td>${cliente.telefone || '-'}</td>
            <td>${cliente.endereco || '-'}</td>
            <td>
                <button onclick="editarCliente(${index})" title="Editar">✏️</button>
                <button onclick="excluirCliente(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarClientes(valor, campoId) {
    if (campoId) {
        // Filtro para autocomplete
        const autocompleteDiv = document.getElementById(`autocomplete-${campoId}`);
        if (!autocompleteDiv) return;
        
        autocompleteDiv.innerHTML = '';
        
        if (!valor) return;
        
        const clientesFiltrados = clientes.filter(c => 
            c.nome && c.nome.toLowerCase().includes(valor.toLowerCase())
        );
        
        clientesFiltrados.forEach(cliente => {
            const div = document.createElement('div');
            div.textContent = cliente.nome;
            div.addEventListener('click', () => {
                document.getElementById(campoId).value = cliente.nome;
                autocompleteDiv.innerHTML = '';
                // Limpar erro
                const erroDiv = document.getElementById(`erro-${campoId}`);
                if (erroDiv) erroDiv.classList.add('hidden');
            });
            autocompleteDiv.appendChild(div);
        });
    } else {
        // Filtro para lista de clientes
        const filtro = document.getElementById('filtroClientes').value.toLowerCase();
        const linhas = document.querySelectorAll('#clientesBody tr');
        
        linhas.forEach(linha => {
            const texto = linha.textContent.toLowerCase();
            linha.style.display = texto.includes(filtro) ? '' : 'none';
        });
    }
}

function verificarEnterCliente(event, campoId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const valor = document.getElementById(campoId).value;
        
        if (valor && !clientes.some(c => c.nome && c.nome.toLowerCase() === valor.toLowerCase())) {
            const erroDiv = document.getElementById(`erro-${campoId}`);
            if (erroDiv) {
                erroDiv.textContent = 'Cliente não encontrado. Clique no "+" para cadastrar.';
                erroDiv.classList.remove('hidden');
            }
        } else {
            const erroDiv = document.getElementById(`erro-${campoId}`);
            if (erroDiv) erroDiv.classList.add('hidden');
        }
    }
}

function abrirModalCliente(campoId) {
    document.getElementById('clienteModal').classList.add('open');
    document.getElementById('clienteModal').dataset.campoId = campoId;
}

function fecharModalCliente() {
    document.getElementById('clienteModal').classList.remove('open');
    document.getElementById('novoClienteNome').value = '';
}

function salvarClienteRapido() {
    const nome = document.getElementById('novoClienteNome').value.trim();
    const campoId = document.getElementById('clienteModal').dataset.campoId;
    
    if (!nome) {
        alert('❌ Por favor, digite um nome para o cliente!');
        return;
    }
    
    // Verificar se já existe
    if (clientes.some(c => c.nome && c.nome.toLowerCase() === nome.toLowerCase())) {
        alert('❌ Este cliente já existe!');
        return;
    }
    
    // Adicionar cliente
    clientes.push({
        nome: nome,
        cpf: '',
        telefone: '',
        endereco: ''
    });
    
    localStorage.setItem('clientes', JSON.stringify(clientes));
    
    // Preencher o campo
    document.getElementById(campoId).value = nome;
    
    // Limpar erro
    const erroDiv = document.getElementById(`erro-${campoId}`);
    if (erroDiv) erroDiv.classList.add('hidden');
    
    // Fechar modal
    fecharModalCliente();
    
    alert('✅ Cliente cadastrado com sucesso!');
}

function adicionarCliente(event) {
    event.preventDefault();
    
    const cliente = {
        nome: document.getElementById('clienteNome').value,
        cpf: document.getElementById('clienteCpf').value,
        telefone: document.getElementById('clienteTelefone').value,
        endereco: document.getElementById('clienteEndereco').value
    };
    
    if (clienteEditando !== null) {
        // Modo edição
        clientes[clienteEditando] = cliente;
        clienteEditando = null;
        
        document.getElementById('btnSalvarCliente').textContent = '💾 Salvar Cliente';
        document.getElementById('btnCancelarEdicaoCliente').style.display = 'none';
    } else {
        // Modo adição
        clientes.push(cliente);
    }
    
    localStorage.setItem('clientes', JSON.stringify(clientes));
    
    // Limpar formulário
    limparFormCliente();
    
    // Atualizar lista se estiver visível
    if (document.getElementById('listaClientesContainer') && !document.getElementById('listaClientesContainer').classList.contains('hidden')) {
        renderizarClientes();
    }
    
    alert('✅ Cliente salvo com sucesso!');
}

function limparFormCliente() {
    document.getElementById('formCliente').reset();
    
    // Restaurar modo normal
    clienteEditando = null;
    document.getElementById('btnSalvarCliente').textContent = '💾 Salvar Cliente';
    document.getElementById('btnCancelarEdicaoCliente').style.display = 'none';
}

function editarCliente(index) {
    const cliente = clientes[index];
    
    document.getElementById('clienteNome').value = cliente.nome || '';
    document.getElementById('clienteCpf').value = cliente.cpf || '';
    document.getElementById('clienteTelefone').value = cliente.telefone || '';
    document.getElementById('clienteEndereco').value = cliente.endereco || '';
    
    // Configurar modo edição
    clienteEditando = index;
    document.getElementById('btnSalvarCliente').textContent = '💾 Atualizar Cliente';
    document.getElementById('btnCancelarEdicaoCliente').style.display = 'inline-block';
}

function cancelarEdicaoCliente() {
    limparFormCliente();
}

function excluirCliente(index) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        // Verificar se o cliente está sendo usado
        const cliente = clientes[index];
        const usadoNasVendas = vendas.some(venda => venda.cliente === cliente.nome);
        
        if (usadoNasVendas) {
            alert('❌ Este cliente não pode ser excluído pois está sendo usado em vendas!');
            return;
        }
        
        clientes.splice(index, 1);
        localStorage.setItem('clientes', JSON.stringify(clientes));
        renderizarClientes();
        alert('✅ Cliente excluído com sucesso!');
    }
}

// ========== FUNCIONALIDADES DE FORNECEDOR (AUTOCOMPLETE E MODAL) ==========
function filtrarFornecedores(valor, campoId) {
    const autocompleteDiv = document.getElementById(`autocomplete-${campoId}`);
    if (!autocompleteDiv) return;
    
    autocompleteDiv.innerHTML = '';
    
    if (!valor) return;
    
    const fornecedoresFiltrados = fornecedores.filter(f => 
        f.nome && f.nome.toLowerCase().includes(valor.toLowerCase())
    );
    
    fornecedoresFiltrados.forEach(fornecedor => {
        const div = document.createElement('div');
        div.textContent = fornecedor.nome;
        div.addEventListener('click', () => {
            document.getElementById(campoId).value = fornecedor.nome;
            autocompleteDiv.innerHTML = '';
            // Limpar erro
            const erroDiv = document.getElementById(`erro-${campoId}`);
            if (erroDiv) erroDiv.classList.add('hidden');
        });
        autocompleteDiv.appendChild(div);
    });
}

// Autocomplete para Nome do Produto/Insumo no formulário de estoque
function filtrarProdutosEstoque(valor) {
    const autocompleteDiv = document.getElementById('autocomplete-prodNome');
    if (!autocompleteDiv) return;

    autocompleteDiv.innerHTML = '';
    if (!valor) return;

    // Coletar nomes únicos de estoque e compras
    const nomesSet = new Set();
    estoque.forEach(e => { if (e.nome) nomesSet.add(e.nome); });
    compras.forEach(c => { if (c.produto) nomesSet.add(c.produto); });

    const nomes = Array.from(nomesSet).filter(n => n.toLowerCase().includes(valor.toLowerCase()));

    nomes.forEach(nome => {
        const div = document.createElement('div');
        div.textContent = nome;
        div.addEventListener('click', () => {
            document.getElementById('prodNome').value = nome;

            // Procurar a última compra para este produto (se existir) para preencher detalhes
            const comprasDoProduto = compras.filter(c => c.produto && c.produto.toLowerCase() === nome.toLowerCase());
            if (comprasDoProduto.length > 0) {
                const ultimaCompra = comprasDoProduto[comprasDoProduto.length - 1];
                document.getElementById('prodQtd').value = ultimaCompra.quantidade || 0;
                document.getElementById('prodPreco').value = ultimaCompra.valorUnitario ? parseFloat(ultimaCompra.valorUnitario).toFixed(2) : '';
                document.getElementById('prodFornecedor').value = ultimaCompra.fornecedor || '';
                document.getElementById('prodTipo').value = 'Insumo';
                document.getElementById('prodUnidade').value = 'un';
            } else {
                // Se não houver compra, tentar preencher a partir do estoque
                const itemEst = estoque.find(it => it.nome && it.nome.toLowerCase() === nome.toLowerCase());
                if (itemEst) {
                    document.getElementById('prodQtd').value = itemEst.quantidade || 0;
                    document.getElementById('prodPreco').value = itemEst.preco ? parseFloat(itemEst.preco).toFixed(2) : '';
                    document.getElementById('prodFornecedor').value = itemEst.fornecedor || '';
                    document.getElementById('prodTipo').value = itemEst.tipo || 'Produto';
                    document.getElementById('prodUnidade').value = itemEst.unidade || 'un';
                }
            }

            autocompleteDiv.innerHTML = '';
            // Limpar possíveis mensagens de erro do fornecedor
            const erroDiv = document.getElementById('erro-prodFornecedor');
            if (erroDiv) erroDiv.classList.add('hidden');
        });
        autocompleteDiv.appendChild(div);
    });
}

function verificarEnterProduto(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const valor = document.getElementById('prodNome').value;
        if (!valor) return;

        // Se existir uma compra com esse produto, preencher automaticamente
        const compra = compras.find(c => c.produto && c.produto.toLowerCase() === valor.toLowerCase());
        if (compra) {
            document.getElementById('prodQtd').value = compra.quantidade || 0;
            document.getElementById('prodPreco').value = compra.valorUnitario ? parseFloat(compra.valorUnitario).toFixed(2) : '';
            document.getElementById('prodFornecedor').value = compra.fornecedor || '';
            document.getElementById('prodTipo').value = 'Insumo';
            document.getElementById('prodUnidade').value = 'un';
        }
    }
}

function verificarEnterFornecedor(event, campoId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const valor = document.getElementById(campoId).value;
        
        if (valor && !fornecedores.some(f => f.nome && f.nome.toLowerCase() === valor.toLowerCase())) {
            const erroDiv = document.getElementById(`erro-${campoId}`);
            if (erroDiv) {
                erroDiv.textContent = 'Fornecedor não encontrado. Clique no "+" para cadastrar.';
                erroDiv.classList.remove('hidden');
            }
        } else {
            const erroDiv = document.getElementById(`erro-${campoId}`);
            if (erroDiv) erroDiv.classList.add('hidden');
        }
    }
}

function abrirModalFornecedor(campoId) {
    document.getElementById('fornecedorModal').classList.add('open');
    document.getElementById('fornecedorModal').dataset.campoId = campoId;
}

function fecharModalFornecedor() {
    document.getElementById('fornecedorModal').classList.remove('open');
    document.getElementById('novoFornecedorNome').value = '';
}

function salvarFornecedorRapido() {
    const nome = document.getElementById('novoFornecedorNome').value.trim();
    const campoId = document.getElementById('fornecedorModal').dataset.campoId;
    
    if (!nome) {
        alert('❌ Por favor, digite um nome para o fornecedor!');
        return;
    }
    
    // Verificar se já existe
    if (fornecedores.some(f => f.nome && f.nome.toLowerCase() === nome.toLowerCase())) {
        alert('❌ Este fornecedor já existe!');
        return;
    }
    
    // Adicionar fornecedor
    fornecedores.push({
        nome: nome,
        cnpj: '',
        telefone: '',
        email: '',
        endereco: '',
        produtos: ''
    });
    
    localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
    
    // Preencher o campo
    document.getElementById(campoId).value = nome;
    
    // Limpar erro
    const erroDiv = document.getElementById(`erro-${campoId}`);
    if (erroDiv) erroDiv.classList.add('hidden');
    
    // Fechar modal
    fecharModalFornecedor();
    
    alert('✅ Fornecedor cadastrado com sucesso!');
}

// ========== USUÁRIOS ==========
function toggleListaUsuarios() {
    const container = document.getElementById('listaUsuariosContainer');
    const btn = document.getElementById('btnVerListaUsuarios');
    
    if (container && btn) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            btn.textContent = '🙈 Ocultar Lista';
            renderizarUsuarios();
        } else {
            container.classList.add('hidden');
            btn.textContent = '📋 Ver Lista';
        }
    }
}

function renderizarUsuarios() {
    const tbody = document.getElementById('usuariosBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    usuarios.forEach((usuario, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${usuario.foto ? 
                    `<img src="${usuario.foto}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; cursor: pointer;" onclick="visualizarFoto('${usuario.foto}')" title="Clique para visualizar">` : 
                    '📷'
                }
            </td>
            <td>${usuario.nome || ''}</td>
            <td>${usuario.login || ''}</td>
            <td>${usuario.tipo || ''}</td>
            <td>${usuario.dataCadastro || ''}</td>
            <td>
                <button onclick="editarUsuario(${index})" title="Editar">✏️</button>
                <button onclick="excluirUsuario(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarUsuarios() {
    const filtro = document.getElementById('filtroUsuarios').value.toLowerCase();
    const linhas = document.querySelectorAll('#usuariosBody tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(filtro) ? '' : 'none';
    });
}

function adicionarUsuario(event) {
    event.preventDefault();
    
    const usuario = {
        nome: document.getElementById('usuarioNome').value,
        login: document.getElementById('usuarioLogin').value,
        senha: document.getElementById('usuarioSenha').value,
        tipo: document.getElementById('usuarioTipo').value,
        dataCadastro: new Date().toLocaleDateString('pt-BR'),
        foto: document.getElementById('usuarioFotoBase64').value || ''
    };
    
    // Verificar se usuário já existe (apenas no modo adição)
    if (usuarioEditando === null && usuarios.some(u => u.login === usuario.login)) {
        alert('❌ Já existe um usuário com este login!');
        return;
    }
    
    if (usuarioEditando !== null) {
        // Modo edição
        usuarios[usuarioEditando] = usuario;
        usuarioEditando = null;
        
        document.getElementById('btnSalvarUsuario').textContent = '💾 Cadastrar Usuário';
        document.getElementById('btnCancelarEdicaoUsuario').style.display = 'none';
    } else {
        // Modo adição
        usuarios.push(usuario);
    }
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    // Limpar formulário
    limparFormUsuario();
    
    // Atualizar lista se estiver visível
    if (document.getElementById('listaUsuariosContainer') && !document.getElementById('listaUsuariosContainer').classList.contains('hidden')) {
        renderizarUsuarios();
    }
    
    alert('✅ Usuário salvo com sucesso!');
}

function limparFormUsuario() {
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioFotoBase64').value = '';
    document.getElementById('usuarioFotoPreview').style.display = 'none';
    document.getElementById('semFotoTexto').style.display = 'block';
    
    // Restaurar modo normal
    usuarioEditando = null;
    document.getElementById('btnSalvarUsuario').textContent = '💾 Cadastrar Usuário';
    document.getElementById('btnCancelarEdicaoUsuario').style.display = 'none';
}

function editarUsuario(index) {
    const usuario = usuarios[index];
    
    document.getElementById('usuarioNome').value = usuario.nome || '';
    document.getElementById('usuarioLogin').value = usuario.login || '';
    document.getElementById('usuarioSenha').value = usuario.senha || '';
    document.getElementById('usuarioTipo').value = usuario.tipo || '';
    
    // Configurar foto se existir
    if (usuario.foto) {
        document.getElementById('usuarioFotoBase64').value = usuario.foto;
        document.getElementById('usuarioFotoPreview').src = usuario.foto;
        document.getElementById('usuarioFotoPreview').style.display = 'block';
        document.getElementById('semFotoTexto').style.display = 'none';
    } else {
        document.getElementById('usuarioFotoPreview').style.display = 'none';
        document.getElementById('semFotoTexto').style.display = 'block';
    }
    
    // Configurar modo edição
    usuarioEditando = index;
    document.getElementById('btnSalvarUsuario').textContent = '💾 Atualizar Usuário';
    document.getElementById('btnCancelarEdicaoUsuario').style.display = 'inline-block';
}

function cancelarEdicaoUsuario() {
    limparFormUsuario();
}

function excluirUsuario(index) {
    if (usuarios[index].login === 'admin') {
        alert('❌ Não é possível excluir o usuário administrador padrão!');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        usuarios.splice(index, 1);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        renderizarUsuarios();
        alert('✅ Usuário excluído com sucesso!');
    }
}

// ========== RELATÓRIOS (filtros e geração) ==========
function atualizarRelatorio() {
    // Chamado em onchange para atualizar visualização rápida
    // Apenas regenera o conteúdo se o painel estiver aberto
    const detalhe = document.querySelector('#secRelatorios details');
    if (detalhe && detalhe.open) {
        gerarRelatorio();
    }
}

function obterDadosFiltrados() {
    const tipo = document.getElementById('relTipo') ? document.getElementById('relTipo').value : 'vendas';
    const produto = document.getElementById('filtroProduto') ? document.getElementById('filtroProduto').value : '';
    const inicio = document.getElementById('filtroInicio') ? document.getElementById('filtroInicio').value : '';
    const fim = document.getElementById('filtroFim') ? document.getElementById('filtroFim').value : '';
    const fornecedor = document.getElementById('filtroFornecedor') ? document.getElementById('filtroFornecedor').value : '';
    const cliente = document.getElementById('filtroCliente') ? document.getElementById('filtroCliente').value : '';
    const formaPagamento = document.getElementById('filtroFormaPagamento') ? document.getElementById('filtroFormaPagamento').value : '';

    // Função auxiliar para comparar datas (yyyy-mm-dd strings)
    const dentroDoPeriodo = (data) => {
        if (!data) return true;
        if (inicio && data < inicio) return false;
        if (fim && data > fim) return false;
        return true;
    };

    switch (tipo) {
        case 'vendas': {
            let dados = vendas.slice();
            if (produto) dados = dados.filter(d => d.produto === produto);
            if (inicio || fim) dados = dados.filter(d => dentroDoPeriodo(d.data));
            if (cliente) dados = dados.filter(d => d.cliente === cliente);
            if (formaPagamento) dados = dados.filter(d => d.formaPagamento === formaPagamento);
            console.log('obterDadosFiltrados(vendas) => filtro:', {produto, inicio, fim, cliente, formaPagamento}, 'resultCount:', dados.length);
            return dados;
        }

        case 'estoque': {
            // Para estoque, queremos os itens do estoque filtrados por produto e/ou fornecedor
            let dados = estoque.slice();
            if (produto) {
                const p = produto.toString().trim().toLowerCase();
                dados = dados.filter(d => (d.nome || '').toString().trim().toLowerCase().includes(p));
            }
            if (fornecedor) {
                const f = fornecedor.toString().trim().toLowerCase();
                dados = dados.filter(d => ((d.fornecedor || '').toString().trim().toLowerCase().includes(f)));
            }
            console.log('obterDadosFiltrados(estoque) => filtro:', {produto, fornecedor}, 'resultCount:', dados.length);
            return dados;
        }

        case 'compras': {
            let dados = compras.slice();
            if (produto) dados = dados.filter(d => d.produto === produto);
            if (inicio || fim) dados = dados.filter(d => dentroDoPeriodo(d.data));
            if (fornecedor) {
                const f = fornecedor.toString().trim().toLowerCase();
                dados = dados.filter(d => ((d.fornecedor || '').toString().trim().toLowerCase().includes(f)));
            }
            console.log('obterDadosFiltrados(compras) => filtro:', {produto, inicio, fim, fornecedor}, 'resultCount:', dados.length);
            return dados;
        }

        case 'fornecedores': {
            let dados = fornecedores.slice();
            if (fornecedor) dados = dados.filter(f => f.nome === fornecedor);
            return dados;
        }

        case 'clientes': {
            let dados = clientes.slice();
            if (cliente) dados = dados.filter(c => c.nome === cliente);
            return dados;
        }

        case 'lucro': {
            // lucro usa totais globais ou em período
            let vendasFilt = vendas.slice();
            let comprasFilt = compras.slice();
            if (inicio || fim) {
                vendasFilt = vendasFilt.filter(d => dentroDoPeriodo(d.data));
                comprasFilt = comprasFilt.filter(d => dentroDoPeriodo(d.data));
            }
            return { vendas: vendasFilt, compras: comprasFilt };
        }

        default:
            return [];
    }
}

function gerarRelatorio() {
    const tipo = document.getElementById('relTipo') ? document.getElementById('relTipo').value : 'vendas';
    const conteudoEl = document.getElementById('relatorioContent');
    if (!conteudoEl) return;

    // Mostrar um resumo dos filtros aplicados (ajuda visual para debug do usuário)
    const filtroProduto = document.getElementById('filtroProduto') ? document.getElementById('filtroProduto').value : '';
    const filtroInicio = document.getElementById('filtroInicio') ? document.getElementById('filtroInicio').value : '';
    const filtroFim = document.getElementById('filtroFim') ? document.getElementById('filtroFim').value : '';
    const filtroFornecedor = document.getElementById('filtroFornecedor') ? document.getElementById('filtroFornecedor').value : '';
    const filtroCliente = document.getElementById('filtroCliente') ? document.getElementById('filtroCliente').value : '';
    const filtroFormaPagamento = document.getElementById('filtroFormaPagamento') ? document.getElementById('filtroFormaPagamento').value : '';

    console.log('Gerando relatório - tipo:', tipo, 'fornecedor:', filtroFornecedor, 'produto:', filtroProduto);

    let html = '';
    html += `<div style="margin-bottom:10px;color:#555;font-size:0.95em;background:#fff;padding:8px;border-radius:6px;">Filtros aplicados: <strong>Tipo</strong>: ${tipo || '—'}; <strong>Produto</strong>: ${filtroProduto || 'Todos'}; <strong>Fornecedor</strong>: ${filtroFornecedor || 'Todos'}; <strong>Cliente</strong>: ${filtroCliente || 'Todos'}; <strong>Período</strong>: ${filtroInicio || '—'} ⇢ ${filtroFim || '—'}</div>`;

    if (tipo === 'lucro') {
        const dados = obterDadosFiltrados();
        const totalVendas = (dados.vendas || []).reduce((s, v) => s + parseFloat(v.valor || 0), 0);
        const totalCompras = (dados.compras || []).reduce((s, c) => s + parseFloat(c.valorTotal || 0), 0);
        const resultado = totalVendas - totalCompras;
        html += `<div class="dashboard-card"><h3>Resumo Lucro/Prejuízo</h3><p><strong>Total Vendas:</strong> ${formatBRL(totalVendas)}</p><p><strong>Total Compras:</strong> ${formatBRL(totalCompras)}</p><p><strong>Resultado:</strong> ${formatBRL(resultado)}</p></div>`;
        conteudoEl.innerHTML = html;
        return;
    }

    const dados = obterDadosFiltrados();

    // Mostrar número de itens retornados pelo filtro
    try {
        const count = Array.isArray(dados) ? dados.length : (dados && (dados.vendas || dados.compras) ? ((dados.vendas||[]).length + (dados.compras||[]).length) : 0);
        html += `<div style="margin-bottom:8px;color:#666;font-size:0.9em;">Itens exibidos: <strong>${count}</strong></div>`;
    } catch (e) {
        console.warn('Erro ao calcular contagem de itens do relatório', e);
    }

    switch (tipo) {
        case 'vendas':
            html += `<div class="table-container"><table><thead><tr><th>Data</th><th>Produto</th><th>Quantidade</th><th>Valor (R$)</th><th>Cliente</th><th>Forma Pag.</th></tr></thead><tbody>`;
            dados.forEach(d => {
                html += `<tr><td>${d.data || ''}</td><td>${d.produto || ''}</td><td>${d.quantidade || 0}</td><td>${formatBRL(d.valor || 0)}</td><td>${d.cliente || ''}</td><td>${d.formaPagamento || ''}</td></tr>`;
            });
            html += `</tbody></table></div>`;
            html += `<p><strong>Total Vendas: ${formatBRL(dados.reduce((s, v) => s + parseFloat(v.valor || 0), 0))}</strong></p>`;
            break;

        case 'estoque':
            html += `<div class="table-container"><table><thead><tr><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Unidade</th><th>Preço (R$)</th><th>Fornecedor</th></tr></thead><tbody>`;
            dados.forEach(d => {
                html += `<tr><td>${d.nome || ''}</td><td>${d.tipo || ''}</td><td>${d.quantidade || 0}</td><td>${d.unidade || ''}</td><td>${formatBRL(d.preco || 0)}</td><td>${d.fornecedor || ''}</td></tr>`;
            });
            html += `</tbody></table></div>`;
            // valor total do estoque
            const valorEstoque = dados.reduce((s, it) => s + (parseFloat(it.preco || 0) * parseFloat(it.quantidade || 0)), 0);
            html += `<p><strong>Valor estimado do estoque: ${formatBRL(valorEstoque)}</strong></p>`;
            break;

        case 'compras':
            html += `<div class="table-container"><table><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>NF</th><th>Quantidade</th><th>Unidade</th><th>Valor Unit. (R$)</th><th>Valor Total (R$)</th><th>Fornecedor</th></tr></thead><tbody>`;
            dados.forEach(d => {
                html += `<tr><td>${d.data || ''}</td><td>${d.produto || ''}</td><td>${d.tipo || ''}</td><td>${d.nf || ''}</td><td>${d.quantidade || 0}</td><td>${d.unidade || ''}</td><td>${formatBRL(d.valorUnitario || 0)}</td><td>${formatBRL(d.valorTotal || 0)}</td><td>${d.fornecedor || ''}</td></tr>`;
            });
            html += `</tbody></table></div>`;
            html += `<p><strong>Total Compras: ${formatBRL(dados.reduce((s, c) => s + parseFloat(c.valorTotal || 0), 0))}</strong></p>`;
            break;

        case 'fornecedores':
            html += `<div class="table-container"><table><thead><tr><th>Nome</th><th>CNPJ</th><th>Telefone</th><th>Email</th><th>Endereço</th><th>Produtos</th></tr></thead><tbody>`;
            dados.forEach(d => {
                html += `<tr><td>${d.nome || ''}</td><td>${d.cnpj || ''}</td><td>${d.telefone || ''}</td><td>${d.email || ''}</td><td>${d.endereco || ''}</td><td>${d.produtos || ''}</td></tr>`;
            });
            html += `</tbody></table></div>`;
            break;

        case 'clientes':
            html += `<div class="table-container"><table><thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Endereço</th></tr></thead><tbody>`;
            dados.forEach(d => {
                html += `<tr><td>${d.nome || ''}</td><td>${d.cpf || ''}</td><td>${d.telefone || ''}</td><td>${d.endereco || ''}</td></tr>`;
            });
            html += `</tbody></table></div>`;
            break;
    }

    conteudoEl.innerHTML = html;
}

// Expose gerarRelatorio to global scope so index.html onclick/onchange works
window.gerarRelatorio = gerarRelatorio;


// ========== FUNCIONALIDADES DE FOTO ==========
function carregarFoto() {
    document.getElementById('fotoInput').click();
}

function processarFotoCarregada(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            document.getElementById('usuarioFotoBase64').value = e.target.result;
            document.getElementById('usuarioFotoPreview').src = e.target.result;
            document.getElementById('usuarioFotoPreview').style.display = 'block';
            document.getElementById('semFotoTexto').style.display = 'none';
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

function tirarFoto() {
    // Abrir modal da câmera
    document.getElementById('cameraModal').classList.add('open');
    
    // Acessar a câmera
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(mediaStream) {
            stream = mediaStream;
            const video = document.getElementById('videoElement');
            video.srcObject = mediaStream;
        })
        .catch(function(err) {
            console.error("Erro ao acessar câmera: ", err);
            alert('❌ Não foi possível acessar a câmera. Verifique as permissões.');
            fecharCamera();
        });
}

function fecharCamera() {
    document.getElementById('cameraModal').classList.remove('open');
    
    // Parar stream da câmera
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

function capturarFoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    const context = canvas.getContext('2d');
    
    // Configurar canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Converter para base64
    const fotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // Atualizar preview e campo hidden
    document.getElementById('usuarioFotoBase64').value = fotoBase64;
    document.getElementById('usuarioFotoPreview').src = fotoBase64;
    document.getElementById('usuarioFotoPreview').style.display = 'block';
    document.getElementById('semFotoTexto').style.display = 'none';
    
    // Fechar modal da câmera
    fecharCamera();
    
    alert('✅ Foto capturada com sucesso!');
}

function removerFoto() {
    document.getElementById('usuarioFotoBase64').value = '';
    document.getElementById('usuarioFotoPreview').style.display = 'none';
    document.getElementById('semFotoTexto').style.display = 'block';
}

function visualizarFoto(src) {
    if (!src) return;
    
    document.getElementById('modalFoto').src = src;
    document.getElementById('photoModal').classList.add('open');
}

function fecharModal() {
    document.getElementById('photoModal').classList.remove('open');
}

// ========== RELATÓRIOS ==========
function toggleListaRelatorios() {
    const container = document.getElementById('listaRelatoriosContainer');
    const btn = document.getElementById('btnVerListaRelatorios');
    
    if (container && btn) {
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            btn.textContent = '🙈 Ocultar Lista';
            renderizarRelatoriosSalvos();
        } else {
            container.classList.add('hidden');
            btn.textContent = '📋 Ver Lista';
        }
    }
}

function renderizarRelatoriosSalvos() {
    const tbody = document.getElementById('relatoriosBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    relatoriosSalvos.forEach((relatorio, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${relatorio.tipo || ''}</td>
            <td>${relatorio.dataCriacao || ''}</td>
            <td>${relatorio.descricao || ''}</td>
            <td>
                <button onclick="excluirRelatorioSalvo(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarRelatorios() {
    const filtro = document.getElementById('filtroRelatorios').value.toLowerCase();
    const linhas = document.querySelectorAll('#relatoriosBody tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(filtro) ? '' : 'none';
    });
}

function excluirRelatorioSalvo(index) {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
        relatoriosSalvos.splice(index, 1);
        localStorage.setItem('relatoriosSalvos', JSON.stringify(relatoriosSalvos));
        renderizarRelatoriosSalvos();
        alert('✅ Relatório excluído com sucesso!');
    }
}

function atualizarRelatorio() {
    const tipo = document.getElementById('relTipo').value;
    const produto = document.getElementById('filtroProduto').value;
    const inicio = document.getElementById('filtroInicio').value;
    const fim = document.getElementById('filtroFim').value;
    const fornecedor = document.getElementById('filtroFornecedor').value;
    const cliente = document.getElementById('filtroCliente').value;
    const formaPagamento = document.getElementById('filtroFormaPagamento').value;
    
    let conteudo = '<h3>Relatório Gerado</h3>';
    
    switch(tipo) {
        case 'vendas':
            let vendasFiltradas = vendas;
            
            if (produto) {
                vendasFiltradas = vendasFiltradas.filter(v => v.produto === produto);
            }
            if (inicio) {
                vendasFiltradas = vendasFiltradas.filter(v => v.data >= inicio);
            }
            if (fim) {
                vendasFiltradas = vendasFiltradas.filter(v => v.data <= fim);
            }
            if (cliente) {
                vendasFiltradas = vendasFiltradas.filter(v => v.cliente === cliente);
            }
            if (formaPagamento) {
                vendasFiltradas = vendasFiltradas.filter(v => v.formaPagamento === formaPagamento);
            }
            
            conteudo += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Valor (R$)</th>
                                <th>Cliente</th>
                                <th>Forma de Pagamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vendasFiltradas.map(v => `
                                <tr>
                                    <td>${v.data}</td>
                                    <td>${v.produto}</td>
                                    <td>${v.quantidade}</td>
                                    <td>${formatBRL(v.valor)}</td>
                                    <td>${v.cliente}</td>
                                    <td>${v.formaPagamento || 'Não informado'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p><strong>Total de Vendas: ${formatBRL(vendasFiltradas.reduce((sum, v) => sum + parseFloat(v.valor), 0))}</strong></p>
            `;
            
            // Análise de formas de pagamento
            conteudo += gerarAnaliseFormasPagamento(vendasFiltradas);
            break;
            
        case 'estoque':
            let estoqueFiltrado = estoque;
            
            if (produto) {
                estoqueFiltrado = estoqueFiltrado.filter(e => e.nome === produto);
            }
            
            conteudo += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Tipo</th>
                                <th>Quantidade</th>
                                <th>Unidade</th>
                                <th>Preço (R$)</th>
                                <th>Fornecedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${estoqueFiltrado.map(e => `
                                <tr>
                                    <td>${e.nome}</td>
                                    <td>${e.tipo}</td>
                                    <td>${e.quantidade}</td>
                                    <td>${e.unidade}</td>
                                    <td>${formatBRL(e.preco || 0)}</td>
                                    <td>${e.fornecedor || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            break;
            
        case 'compras':
            let comprasFiltradas = compras;
            
            if (produto) {
                comprasFiltradas = comprasFiltradas.filter(c => c.produto === produto);
            }
            if (inicio) {
                comprasFiltradas = comprasFiltradas.filter(c => c.data >= inicio);
            }
            if (fim) {
                comprasFiltradas = comprasFiltradas.filter(c => c.data <= fim);
            }
            if (fornecedor) {
                comprasFiltradas = comprasFiltradas.filter(c => c.fornecedor === fornecedor);
            }
            
            conteudo += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Valor Unitário (R$)</th>
                                <th>Valor Total (R$)</th>
                                <th>Fornecedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${comprasFiltradas.map(c => `
                                <tr>
                                    <td>${c.data}</td>
                                    <td>${c.produto}</td>
                                    <td>${c.quantidade}</td>
                                    <td>${formatBRL(c.valorUnitario)}</td>
                                    <td>${formatBRL(c.valorTotal)}</td>
                                    <td>${c.fornecedor}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p><strong>Total em Compras: ${formatBRL(comprasFiltradas.reduce((sum, c) => sum + parseFloat(c.valorTotal), 0))}</strong></p>
            `;
            break;
            
        case 'fornecedores':
            let fornecedoresFiltrados = fornecedores;
            
            if (fornecedor) {
                fornecedoresFiltrados = fornecedoresFiltrados.filter(f => f.nome === fornecedor);
            }
            
            conteudo += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CNPJ</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Endereço</th>
                                <th>Produtos Fornecidos</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fornecedoresFiltrados.map(f => `
                                <tr>
                                    <td>${f.nome}</td>
                                    <td>${f.cnpj || '-'}</td>
                                    <td>${f.telefone || '-'}</td>
                                    <td>${f.email || '-'}</td>
                                    <td>${f.endereco || '-'}</td>
                                    <td>${f.produtos || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            break;
            
        case 'clientes':
            if (cliente) {
                // RELATÓRIO INDIVIDUAL DE CLIENTE
                const clienteData = clientes.find(c => c.nome === cliente);
                const vendasCliente = vendas.filter(v => v.cliente === cliente);
                
                conteudo += `
                    <div class="dashboard-card" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); margin-bottom: 20px;">
                        <h3>👤 Dados do Cliente</h3>
                        <p><strong>Nome:</strong> ${clienteData ? clienteData.nome : cliente}</p>
                        <p><strong>CPF:</strong> ${clienteData && clienteData.cpf ? clienteData.cpf : '-'}</p>
                        <p><strong>Telefone:</strong> ${clienteData && clienteData.telefone ? clienteData.telefone : '-'}</p>
                        <p><strong>Endereço:</strong> ${clienteData && clienteData.endereco ? clienteData.endereco : '-'}</p>
                    </div>
                    
                    <h4>📊 Histórico de Compras</h4>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Quantidade</th>
                                    <th>Valor (R$)</th>
                                    <th>Forma de Pagamento</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${vendasCliente.map(v => {
                                    const isFiado = v.formaPagamento === 'Fiado';
                                    const statusText = isFiado ? '⚠️ Devedor' : '✅ Pago';
                                    const statusColor = isFiado ? '#f44336' : '#4caf50';
                                    return `
                                        <tr>
                                            <td>${v.data}</td>
                                            <td>${v.produto}</td>
                                            <td>${v.quantidade}</td>
                                            <td>${formatBRL(v.valor)}</td>
                                            <td>${v.formaPagamento || 'Não informado'}</td>
                                            <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
                // Resumo do cliente
                const totalGasto = vendasCliente.reduce((sum, v) => sum + parseFloat(v.valor), 0);
                const totalFiado = vendasCliente.filter(v => v.formaPagamento === 'Fiado').reduce((sum, v) => sum + parseFloat(v.valor), 0);
                const totalCompras = vendasCliente.length;
                
                conteudo += `
                    <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                        <h4>📈 Resumo Financeiro</h4>
                        <p><strong>Total de Compras:</strong> ${totalCompras}</p>
                            <p><strong>Total Gasto:</strong> ${formatBRL(totalGasto)}</p>
                        <p style="color: ${totalFiado > 0 ? '#f44336' : '#4caf50'}; font-weight: bold;">
                            <strong>Valor em Aberto (Fiado):</strong> ${formatBRL(totalFiado)}
                        </p>
                        ${totalFiado > 0 ? '<p style="color: #f44336; font-weight: bold;">⚠️ Cliente possui débitos pendentes!</p>' : '<p style="color: #4caf50;">✅ Cliente sem débitos pendentes</p>'}
                    </div>
                `;
                
                // Análise de formas de pagamento do cliente
                conteudo += gerarAnaliseFormasPagamento(vendasCliente);
                
            } else {
                // LISTAGEM DE TODOS OS CLIENTES
                let clientesFiltrados = clientes;
                
                conteudo += `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>CPF</th>
                                    <th>Telefone</th>
                                    <th>Endereço</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${clientesFiltrados.map(c => `
                                    <tr>
                                        <td>${c.nome}</td>
                                        <td>${c.cpf || '-'}</td>
                                        <td>${c.telefone || '-'}</td>
                                        <td>${c.endereco || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            break;
            
        case 'lucro':
            const totalVendas = vendas.reduce((sum, v) => sum + parseFloat(v.valor), 0);
            const totalCompras = compras.reduce((sum, c) => sum + parseFloat(c.valorTotal), 0);
            const lucro = totalVendas - totalCompras;
            
            conteudo += `
                <div class="dashboard-card">
                    <h3>💵 Análise de Lucro/Prejuízo</h3>
                    <div class="stat-number" style="color: ${lucro >= 0 ? '#4CAF50' : '#F44336'}">${formatBRL(lucro)}</div>
                    <div class="stat-label">${lucro >= 0 ? 'Lucro' : 'Prejuízo'}</div>
                    <p><strong>Total de Vendas:</strong> ${formatBRL(totalVendas)}</p>
                    <p><strong>Total de Compras:</strong> ${formatBRL(totalCompras)}</p>
                </div>
            `;
            break;
    }
    
    document.getElementById('relatorioContent').innerHTML = conteudo;
}

// Função auxiliar para gerar análise de formas de pagamento
function gerarAnaliseFormasPagamento(vendasArray) {
    if (!vendasArray || vendasArray.length === 0) {
        return '';
    }
    
    const formasPagamento = {};
    let totalVendasAnalise = 0;
    let totalTransacoes = vendasArray.length;
    
    vendasArray.forEach(venda => {
        const forma = venda.formaPagamento || 'Não informado';
        const valor = parseFloat(venda.valor) || 0;
        
        if (formasPagamento[forma]) {
            formasPagamento[forma].quantidade++;
            formasPagamento[forma].valorTotal += valor;
        } else {
            formasPagamento[forma] = {
                quantidade: 1,
                valorTotal: valor
            };
        }
        totalVendasAnalise += valor;
    });
    
    let formaMaisUtilizada = '';
    let maiorQuantidade = 0;
    
    let conteudo = `<div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #d2691e;">
        <h4>📊 Análise das Formas de Pagamento</h4>`;
    
    // Ordenar formas de pagamento por quantidade
    const formasOrdenadas = Object.entries(formasPagamento).sort((a, b) => b[1].quantidade - a[1].quantidade);
    
    formasOrdenadas.forEach(([forma, dados]) => {
        const porcentagemValor = totalVendasAnalise > 0 ? (dados.valorTotal / totalVendasAnalise * 100).toFixed(1) : 0;
        const porcentagemQuantidade = totalTransacoes > 0 ? (dados.quantidade / totalTransacoes * 100).toFixed(1) : 0;
        
        if (dados.quantidade > maiorQuantidade) {
            maiorQuantidade = dados.quantidade;
            formaMaisUtilizada = forma;
        }
        
        conteudo += `
            <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px; border-left: 3px solid #d2691e;">
                <p style="margin: 0 0 5px 0;"><strong>${forma}:</strong></p>
                <p style="margin: 0; font-size: 0.9em;">
                    📌 ${dados.quantidade} transações (${porcentagemQuantidade}% do total)<br>
                    💰 ${formatBRL(dados.valorTotal)} (${porcentagemValor}% do valor total)
                </p>
            </div>
        `;
    });
    
    conteudo += `<p style="margin-top: 15px; color: #d2691e; font-weight: bold; background: white; padding: 10px; border-radius: 6px;">
        🎯 Forma de pagamento mais utilizada: ${formaMaisUtilizada} (${maiorQuantidade} vezes)
    </p>`;
    conteudo += `</div>`;
    
    return conteudo;
}

function limparFiltrosRelatorio() {
    document.getElementById('relTipo').value = 'vendas';
    document.getElementById('filtroProduto').value = '';
    document.getElementById('filtroInicio').value = '';
    document.getElementById('filtroFim').value = '';
    document.getElementById('filtroFornecedor').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroFormaPagamento').value = '';
    document.getElementById('relatorioContent').innerHTML = '';
}

// ========== MODAIS DE SELEÇÃO PARA FILTROS ==========
function abrirModalSelecaoProduto() {
    const modal = document.getElementById('selecaoProdutoModal');
    const lista = document.getElementById('listaProdutosModal');
    const busca = document.getElementById('buscaProdutoRelatorio');
    
    // Limpar busca anterior
    busca.value = '';
    
    // Não preencher lista automaticamente para evitar exibições longas
    lista.innerHTML = '';
    lista.style.display = 'none';
    
    modal.classList.add('open');
    
    // Focar no campo de busca
    setTimeout(() => busca.focus(), 100);
}

function fecharModalSelecaoProduto() {
    document.getElementById('selecaoProdutoModal').classList.remove('open');
    document.getElementById('buscaProdutoRelatorio').value = '';
    const lista = document.getElementById('listaProdutosModal');
    if (lista) { lista.innerHTML = ''; lista.style.display = 'none'; }
}

function filtrarProdutosModal() {
    const busca = document.getElementById('buscaProdutoRelatorio').value.toLowerCase();
    const lista = document.getElementById('listaProdutosModal');
    // Se buscar por algo, popular a lista com itens que batem
    if (busca.trim().length > 0) {
        lista.innerHTML = '';
        const encontrados = estoque.filter(p => (p.nome || '').toLowerCase().includes(busca));
        if (encontrados.length === 0) {
            lista.innerHTML = '<div class="modal-item">Nenhum produto encontrado</div>';
        } else {
            encontrados.forEach(produto => {
                const div = document.createElement('div');
                div.className = 'modal-item';
                div.innerHTML = `<span>${produto.nome} (${produto.tipo})</span>`;
                div.onclick = function() {
                    document.getElementById('filtroProduto').value = produto.nome;
                    fecharModalSelecaoProduto();
                    gerarRelatorio();
                };
                lista.appendChild(div);
            });
        }
        lista.style.display = 'block';
        highlightFirstItem('#listaProdutosModal');
    } else {
        // Campo vazio: não exibir lista para evitar overflow com muitos itens
        lista.innerHTML = '';
        lista.style.display = 'none';
    }
}

function selecionarTodosProdutos() {
    document.getElementById('filtroProduto').value = '';
    fecharModalSelecaoProduto();
    gerarRelatorio();
}

// Carregar todos os produtos no modal (botão manual)
function carregarTodosProdutosModal() {
    const lista = document.getElementById('listaProdutosModal');
    lista.innerHTML = '';
    estoque.forEach(produto => {
        const div = document.createElement('div');
        div.className = 'modal-item';
        div.innerHTML = `<span>${produto.nome} (${produto.tipo})</span>`;
        div.onclick = function() {
            document.getElementById('filtroProduto').value = produto.nome;
            fecharModalSelecaoProduto();
            gerarRelatorio();
        };
        lista.appendChild(div);
    });
    lista.style.display = 'block';
    highlightFirstItem('#listaProdutosModal');
}

function abrirModalSelecaoFornecedor() {
    const modal = document.getElementById('selecaoFornecedorModal');
    const lista = document.getElementById('listaFornecedoresModal');
    const busca = document.getElementById('buscaFornecedorRelatorio');
    
    // Limpar busca anterior
    busca.value = '';
    
    // Não preencher lista automaticamente para evitar exibições longas
    lista.innerHTML = '';
    lista.style.display = 'none';
    
    modal.classList.add('open');
    
    // Focar no campo de busca
    setTimeout(() => busca.focus(), 100);
}

function fecharModalSelecaoFornecedor() {
    document.getElementById('selecaoFornecedorModal').classList.remove('open');
    document.getElementById('buscaFornecedorRelatorio').value = '';
    const lista = document.getElementById('listaFornecedoresModal');
    if (lista) { lista.innerHTML = ''; lista.style.display = 'none'; }
}

function filtrarFornecedoresModal() {
    const busca = document.getElementById('buscaFornecedorRelatorio').value.toLowerCase();
    const lista = document.getElementById('listaFornecedoresModal');
    if (busca.trim().length > 0) {
        lista.innerHTML = '';
        const encontrados = fornecedores.filter(f => (f.nome || '').toLowerCase().includes(busca));
        if (encontrados.length === 0) {
            lista.innerHTML = '<div class="modal-item">Nenhum fornecedor encontrado</div>';
        } else {
            encontrados.forEach(fornecedor => {
                const div = document.createElement('div');
                div.className = 'modal-item';
                div.innerHTML = `<span>${fornecedor.nome}</span>`;
                div.onclick = function() {
                    document.getElementById('filtroFornecedor').value = fornecedor.nome;
                    fecharModalSelecaoFornecedor();
                    gerarRelatorio();
                };
                lista.appendChild(div);
            });
        }
        lista.style.display = 'block';
        highlightFirstItem('#listaFornecedoresModal');
    } else {
        lista.innerHTML = '';
        lista.style.display = 'none';
    }
}

function selecionarTodosFornecedores() {
    document.getElementById('filtroFornecedor').value = '';
    fecharModalSelecaoFornecedor();
    gerarRelatorio();
}

// Carregar todos os fornecedores no modal (botão manual)
function carregarTodosFornecedoresModal() {
    const lista = document.getElementById('listaFornecedoresModal');
    lista.innerHTML = '';
    fornecedores.forEach(fornecedor => {
        const div = document.createElement('div');
        div.className = 'modal-item';
        div.innerHTML = `<span>${fornecedor.nome}</span>`;
        div.onclick = function() {
            document.getElementById('filtroFornecedor').value = fornecedor.nome;
            fecharModalSelecaoFornecedor();
            gerarRelatorio();
        };
        lista.appendChild(div);
    });
    lista.style.display = 'block';
    highlightFirstItem('#listaFornecedoresModal');
}

function abrirModalSelecaoCliente() {
    const modal = document.getElementById('selecaoClienteModal');
    const lista = document.getElementById('listaClientesModal');
    const busca = document.getElementById('buscaClienteRelatorio');
    
    // Limpar busca anterior
    busca.value = '';
    
    // Não preencher lista automaticamente para evitar exibições longas
    lista.innerHTML = '';
    lista.style.display = 'none';
    
    modal.classList.add('open');
    
    // Focar no campo de busca
    setTimeout(() => busca.focus(), 100);
}

function fecharModalSelecaoCliente() {
    document.getElementById('selecaoClienteModal').classList.remove('open');
    document.getElementById('buscaClienteRelatorio').value = '';
    const lista = document.getElementById('listaClientesModal');
    if (lista) { lista.innerHTML = ''; lista.style.display = 'none'; }
}

function filtrarClientesModal() {
    const busca = document.getElementById('buscaClienteRelatorio').value.toLowerCase();
    const lista = document.getElementById('listaClientesModal');
    if (busca.trim().length > 0) {
        lista.innerHTML = '';
        const encontrados = clientes.filter(c => (c.nome || '').toLowerCase().includes(busca));
        if (encontrados.length === 0) {
            lista.innerHTML = '<div class="modal-item">Nenhum cliente encontrado</div>';
        } else {
            encontrados.forEach(cliente => {
                const div = document.createElement('div');
                div.className = 'modal-item';
                div.innerHTML = `<span>${cliente.nome}</span>`;
                div.onclick = function() {
                    document.getElementById('filtroCliente').value = cliente.nome;
                    fecharModalSelecaoCliente();
                    gerarRelatorio();
                };
                lista.appendChild(div);
            });
        }
        lista.style.display = 'block';
        highlightFirstItem('#listaClientesModal');
    } else {
        lista.innerHTML = '';
        lista.style.display = 'none';
    }
}

function selecionarTodosClientes() {
    document.getElementById('filtroCliente').value = '';
    fecharModalSelecaoCliente();
    gerarRelatorio();
}

// Carregar todos os clientes no modal (botão manual)
function carregarTodosClientesModal() {
    const lista = document.getElementById('listaClientesModal');
    lista.innerHTML = '';
    clientes.forEach(cliente => {
        const div = document.createElement('div');
        div.className = 'modal-item';
        div.innerHTML = `<span>${cliente.nome}</span>`;
        div.onclick = function() {
            document.getElementById('filtroCliente').value = cliente.nome;
            fecharModalSelecaoCliente();
            gerarRelatorio();
        };
        lista.appendChild(div);
    });
    lista.style.display = 'block';
    highlightFirstItem('#listaClientesModal');
}

// HIGHLIGHT HELPERS E NAVIGAÇÃO POR TECLADO
function highlightFirstItem(selector) {
    const lista = document.querySelector(selector);
    if (!lista) return;
    const items = lista.querySelectorAll('.modal-item');
    items.forEach(it => it.classList.remove('highlighted'));
    if (items.length > 0) {
        items[0].classList.add('highlighted');
        items[0].scrollIntoView({ block: 'nearest' });
    }
}

function moveHighlight(selector, direction) {
    const lista = document.querySelector(selector);
    if (!lista) return;
    const items = Array.from(lista.querySelectorAll('.modal-item'));
    if (items.length === 0) return;
    let index = items.findIndex(it => it.classList.contains('highlighted'));
    if (index === -1) {
        // highlight first if none
        items[0].classList.add('highlighted');
        items[0].scrollIntoView({ block: 'nearest' });
        return;
    }
    items[index].classList.remove('highlighted');
    index += direction;
    if (index < 0) index = 0;
    if (index >= items.length) index = items.length - 1;
    items[index].classList.add('highlighted');
    items[index].scrollIntoView({ block: 'nearest' });
}

function selectHighlightedOrFirst(selector) {
    const lista = document.querySelector(selector);
    if (!lista) return null;
    const highlighted = lista.querySelector('.modal-item.highlighted');
    const item = highlighted || lista.querySelector('.modal-item');
    return item;
}

// Handler para keydown nos modais
function handleKeydownProdutosModal(event) {
    const selector = '#listaProdutosModal';
    if (event.key === 'ArrowDown') { event.preventDefault(); moveHighlight(selector, 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveHighlight(selector, -1); }
    else if (event.key === 'Enter') {
        event.preventDefault();
        const item = selectHighlightedOrFirst(selector);
        if (item) item.click();
    } else if (event.key === 'Escape') { fecharModalSelecaoProduto(); }
}

function handleKeydownFornecedoresModal(event) {
    const selector = '#listaFornecedoresModal';
    if (event.key === 'ArrowDown') { event.preventDefault(); moveHighlight(selector, 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveHighlight(selector, -1); }
    else if (event.key === 'Enter') {
        event.preventDefault();
        const item = selectHighlightedOrFirst(selector);
        if (item) item.click();
    } else if (event.key === 'Escape') { fecharModalSelecaoFornecedor(); }
}

function handleKeydownClientesModal(event) {
    const selector = '#listaClientesModal';
    if (event.key === 'ArrowDown') { event.preventDefault(); moveHighlight(selector, 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveHighlight(selector, -1); }
    else if (event.key === 'Enter') {
        event.preventDefault();
        const item = selectHighlightedOrFirst(selector);
        if (item) item.click();
    } else if (event.key === 'Escape') { fecharModalSelecaoCliente(); }
}

// Função para gerar relatório (chama atualizarRelatorio e mostra mensagem)
function gerarRelatorio() {
    atualizarRelatorio();
    
    // Verificar se há conteúdo gerado
    const conteudo = document.getElementById('relatorioContent');
    if (conteudo && conteudo.innerHTML.trim() !== '') {
        alert('✅ Relatório gerado com sucesso! Use os botões acima para exportar em PDF ou Excel.');
    } else {
        alert('❌ Erro ao gerar relatório. Verifique os filtros e tente novamente.');
    }
}

function salvarRelatorioAtual() {
    const tipo = document.getElementById('relTipo').value;
    const conteudo = document.getElementById('relatorioContent').innerHTML;
    
    if (!conteudo) {
        alert('❌ Gere um relatório primeiro antes de salvar!');
        return;
    }
    
    const relatorio = {
        tipo: tipo,
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        descricao: `Relatório de ${tipo} - ${new Date().toLocaleDateString('pt-BR')}`,
        conteudo: conteudo
    };
    
    relatoriosSalvos.push(relatorio);
    localStorage.setItem('relatoriosSalvos', JSON.stringify(relatoriosSalvos));
    
    renderizarRelatoriosSalvos();
    alert('✅ Relatório salvo com sucesso!');
}

function exportRelatorioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const tipo = document.getElementById('relTipo').value;
    const titulo = `Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const agora = new Date();
    const dataHora = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const usuario = 'admin';

    // Cabeçalho moderno e sem emojis
    gerarCabecalhoPDF(doc, titulo, dataHora, usuario);

    // Conteúdo do relatório
    let y = 90;

    // Helper: desenha tabela usando autoTable quando disponível, senão fallback simples
    function drawTable(columns, rows, startY) {
        if (doc.autoTable) {
            doc.autoTable({
                startY: startY,
                head: [columns],
                body: rows,
                theme: 'striped',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [239, 219, 190], textColor: 20 },
                margin: { left: 15, right: 15 }
            });
            return doc.lastAutoTable ? doc.lastAutoTable.finalY : (startY + 10 + (rows.length * 8));
        } else {
            // Fallback: imprimir como linhas de texto
            let yy = startY;
            // Cabeçalho
            const headerText = columns.join(' | ');
            doc.setFontSize(10);
            doc.text(headerText, 15, yy);
            yy += 8;
            rows.forEach(r => {
                const line = r.map(c => (c === null || c === undefined) ? '' : String(c)).join(' | ');
                doc.text(line, 15, yy);
                yy += 7;
                if (yy > 180) { doc.addPage('landscape'); yy = 20; }
            });
            return yy;
        }
    }
    
    switch(tipo) {
        case 'vendas': {
            doc.setFontSize(14);
            doc.text('Detalhes das Vendas', 15, y);
            y += 8;
            const vendasFiltradas = obterDadosFiltrados();
            const cols = ['Data', 'Produto', 'Quantidade', 'Valor (R$)', 'Cliente', 'Forma Pag.'];
            const rows = vendasFiltradas.map(v => [v.data || '', v.produto || '', v.quantidade || 0, formatBRL(v.valor || 0), v.cliente || 'Não informado', v.formaPagamento || 'Não informado']);
            y = drawTable(cols, rows, y + 5);

            const totalVendasVal = vendasFiltradas.reduce((sum, v) => sum + parseFloat(v.valor || 0), 0);
            y += 6;
            doc.setFontSize(12);
            doc.text(`Total de Vendas: ${formatBRL(totalVendasVal)}`, 15, y);

            y += 8;
            doc.setFontSize(12);
            doc.text('Distribuição por Forma de Pagamento:', 15, y);
            y += 8;
            const formas = {};
            vendasFiltradas.forEach(v => {
                const f = v.formaPagamento || 'Não informado';
                formas[f] = (formas[f] || 0) + parseFloat(v.valor || 0);
            });
            Object.keys(formas).forEach(f => {
                const val = formas[f];
                const pct = totalVendasVal > 0 ? (val / totalVendasVal) * 100 : 0;
                if (y > 180) { doc.addPage('landscape'); y = 20; }
                doc.text(`${f}: ${formatBRL(val)} (${pct.toFixed(1)}%)`, 20, y);
                y += 8;
            });
            break;
        }
            
        case 'estoque': {
            doc.setFontSize(14);
            doc.text('Situação do Estoque', 15, y);
            y += 8;
            const estoqueFiltrado = obterDadosFiltrados();
            const colsE = ['Produto', 'Tipo', 'Quantidade', 'Unidade', 'Preço (R$)', 'Fornecedor'];
            const rowsE = estoqueFiltrado.map(it => [sanitizeForExport(it.nome || ''), sanitizeForExport(it.tipo || ''), Number(it.quantidade || 0), sanitizeForExport(it.unidade || ''), formatBRL(Number(it.preco || 0)), sanitizeForExport(it.fornecedor || '-')]);
            y = drawTable(colsE, rowsE, y + 5);
            y += 6;
            const totalQuantidadeEstoque = estoqueFiltrado.reduce((sum, it) => sum + Number(it.quantidade || 0), 0);
            const valorTotalEstoque = estoqueFiltrado.reduce((sum, it) => sum + (Number(it.preco || 0) * Number(it.quantidade || 0)), 0);
            doc.setFontSize(12);
            doc.text(`Total de Itens (unidades): ${totalQuantidadeEstoque}    Valor total do estoque (estimado): ${formatBRL(valorTotalEstoque)}`, 15, y);
            break;
        }
            
        case 'compras': {
            doc.setFontSize(14);
            doc.text('Registro de Compras', 15, y);
            y += 8;
            const comprasFiltradas = obterDadosFiltrados();
            const colsC = ['Data', 'Produto', 'NF', 'Quantidade', 'Unid', 'Valor Unit. (R$)', 'Valor Total (R$)', 'Fornecedor'];
            const rowsC = comprasFiltradas.map(c => [c.data || '', c.produto || '', c.nf || '', c.quantidade || 0, c.unidade || '', formatBRL(c.valorUnitario || 0), formatBRL(c.valorTotal || 0), c.fornecedor || '-']);
            y = drawTable(colsC, rowsC, y + 5);
            y += 6;
            const totalComprasVal = comprasFiltradas.reduce((sum, c) => sum + parseFloat(c.valorTotal || 0), 0);
            doc.setFontSize(12);
            doc.text(`Total de Compras: ${formatBRL(totalComprasVal)}`, 15, y);
            break;
        }

        case 'fornecedores': {
            doc.setFontSize(14);
            doc.text('Cadastro de Fornecedores', 15, y);
            y += 8;
            const forneFiltrados = obterDadosFiltrados();
            const colsF = ['Nome', 'CNPJ', 'Telefone', 'Email', 'Endereço', 'Produtos'];
            const rowsF = forneFiltrados.map(f => [f.nome || '-', f.cnpj || '-', f.telefone || '-', f.email || '-', f.endereco || '-', f.produtos || '-']);
            y = drawTable(colsF, rowsF, y + 5);
            y += 6;
            doc.setFontSize(12);
            doc.text(`Total de Fornecedores: ${forneFiltrados.length}`, 15, y);
            break;
        }

        case 'clientes': {
            doc.setFontSize(14);
            doc.text('Cadastro de Clientes', 15, y);
            y += 8;
            const clientesFiltrados = obterDadosFiltrados();
            const colsCl = ['Nome', 'CPF', 'Telefone', 'Endereço'];
            const rowsCl = clientesFiltrados.map(c => [c.nome || '-', c.cpf || '-', c.telefone || '-', c.endereco || '-']);
            y = drawTable(colsCl, rowsCl, y + 5);
            y += 6;
            doc.setFontSize(12);
            doc.text(`Total de Clientes: ${clientesFiltrados.length}`, 15, y);
            break;
        }

        case 'lucro':
            doc.setFontSize(14);
            doc.text('Resumo de Lucro/Prejuízo', 15, y);
            y += 15;

            // Usar dados filtrados quando disponíveis (obterDadosFiltrados retorna { vendas, compras } para tipo 'lucro')
            const dadosLucro = obterDadosFiltrados();
            const vendasParaCalculo = (dadosLucro && dadosLucro.vendas) ? dadosLucro.vendas : vendas;
            const comprasParaCalculo = (dadosLucro && dadosLucro.compras) ? dadosLucro.compras : compras;
            const totalVendasGlobal = vendasParaCalculo.reduce((sum, v) => sum + parseFloat(v.valor || 0), 0);
            const totalComprasGlobal = comprasParaCalculo.reduce((sum, c) => sum + parseFloat(c.valorTotal || 0), 0);
            const lucro = totalVendasGlobal - totalComprasGlobal;

            doc.setFontSize(12);
            doc.text(`Total Vendas: ${formatBRL(totalVendasGlobal)}`, 15, y); y += 8;
            doc.text(`Total Compras: ${formatBRL(totalComprasGlobal)}`, 15, y); y += 8;
            doc.text(`Resultado (Lucro/Prejuízo): ${formatBRL(lucro)}`, 15, y); y += 8;
            doc.text(`Situação: ${lucro >= 0 ? 'Lucro' : 'Prejuízo'}`, 15, y);
            break;

        default:
            doc.text('Relatório não implementado para PDF', 15, y);
    }
    
    doc.save(`Relatorio_${tipo}_${agora.toISOString().slice(0, 10)}.pdf`);
}

function exportRelatorioExcel() {
    const tipo = document.getElementById('relTipo').value;
    const agora = new Date();
    const dataHora = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const usuario = 'admin';
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Dados do cabeçalho
    const headerData = [
        ['Padaria Pão Quentinho'],
        ['Sys Pão - Sistema de Gestão'],
        [`Relatório: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`],
        [`Data/Hora: ${dataHora}`],
        [`Usuário: ${usuario}`],
        [''], // Linha em branco
    ];
    
    // Dados do relatório
    let dados = [];
    
    switch(tipo) {
        case 'vendas':
            dados = obterDadosFiltrados().map(venda => [
                venda.data,
                venda.produto,
                venda.quantidade,
                formatBRL(venda.valor || 0),
                venda.cliente || 'Não informado',
                venda.formaPagamento || 'Não informado'
            ]);
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Data', 'Produto', 'Quantidade', 'Valor (R$)', 'Cliente', 'Forma de Pagamento']);
            break;
            
        case 'estoque':
            const estoqueDados = obterDadosFiltrados();
            dados = estoqueDados.map(item => [
                sanitizeForExport(item.nome),
                sanitizeForExport(item.tipo),
                Number(item.quantidade || 0),
                sanitizeForExport(item.unidade),
                Number(item.preco || 0),
                sanitizeForExport(item.fornecedor || '-')
            ]);
            // adicionar linha de totais
            const somaQtdEst = estoqueDados.reduce((s,it) => s + Number(it.quantidade || 0), 0);
            const somaValorEst = estoqueDados.reduce((s,it) => s + (Number(it.preco || 0) * Number(it.quantidade || 0)), 0);
            dados.push([]);
            dados.push(['Totais', '', somaQtdEst, '', somaValorEst, '']);
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Produto', 'Tipo', 'Quantidade', 'Unidade', 'Preço (R$)', 'Fornecedor']);
            break;
            
        case 'compras':
            dados = obterDadosFiltrados().map(compra => [
                compra.data,
                compra.produto,
                compra.nf || '',
                compra.quantidade,
                formatBRL(compra.valorUnitario || 0),
                formatBRL(compra.valorTotal || 0),
                compra.fornecedor || '-'
            ]);
            
            // Adicionar cabeçalho da tabela (inclui NF)
            headerData.push(['Data', 'Produto', 'NF', 'Quantidade', 'Valor Unitário (R$)', 'Valor Total (R$)', 'Fornecedor']);
            break;
            
        case 'fornecedores':
            dados = obterDadosFiltrados().map(fornecedor => [
                fornecedor.nome,
                fornecedor.cnpj || '-',
                fornecedor.telefone || '-',
                fornecedor.email || '-',
                fornecedor.endereco || '-',
                fornecedor.produtos || '-'
            ]);
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Nome', 'CNPJ', 'Telefone', 'Email', 'Endereço', 'Produtos Fornecidos']);
            break;
            
        case 'clientes':
            dados = obterDadosFiltrados().map(cliente => [
                cliente.nome,
                cliente.cpf || '-',
                cliente.telefone || '-',
                cliente.endereco || '-'
            ]);
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Nome', 'CPF', 'Telefone', 'Endereço']);
            break;
            
        case 'lucro':
            // Usar dados filtrados quando aplicável
            const dadosLucroExcel = obterDadosFiltrados();
            const vendasParaExcel = (dadosLucroExcel && dadosLucroExcel.vendas) ? dadosLucroExcel.vendas : vendas;
            const comprasParaExcel = (dadosLucroExcel && dadosLucroExcel.compras) ? dadosLucroExcel.compras : compras;
            const totalVendas = vendasParaExcel.reduce((sum, v) => sum + parseFloat(v.valor || 0), 0);
            const totalCompras = comprasParaExcel.reduce((sum, c) => sum + parseFloat(c.valorTotal || 0), 0);
            const lucro = totalVendas - totalCompras;

            dados = [
                ['Total de Vendas', formatBRL(totalVendas)],
                ['Total de Compras', formatBRL(totalCompras)],
                ['Resultado', formatBRL(lucro)],
                ['Situação', lucro >= 0 ? 'Lucro' : 'Prejuízo']
            ];
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Descrição', 'Valor']);
            break;
    }
    // Adicionar linha(s) de totalização quando aplicável
    try {
        if (tipo === 'vendas') {
            const vendas = obterDadosFiltrados();
            const totalV = vendas.reduce((s, v) => s + parseFloat(v.valor || 0), 0);
            dados.push([]);
            // Colocar o total na coluna de Valor (índice 3)
            const totalRow = ['', '', 'Total Vendas', formatBRL(totalV), '', ''];
            dados.push(totalRow);
        } else if (tipo === 'compras') {
            const comprasArr = obterDadosFiltrados();
            const totalC = comprasArr.reduce((s, c) => s + parseFloat(c.valorTotal || 0), 0);
            dados.push([]);
            // Colocar o total na coluna Valor Total (índice 5)
            const totalRow = ['', '', '', '', '', formatBRL(totalC), ''];
            dados.push(totalRow);
        } else if (tipo === 'estoque') {
            const est = obterDadosFiltrados();
            const totalEst = est.reduce((s, it) => s + (parseFloat(it.preco || 0) * parseFloat(it.quantidade || 0)), 0);
            dados.push([]);
            const totalRow = ['', '', '', '', 'Valor estimado', formatBRL(totalEst)];
            dados.push(totalRow);
        }
    } catch (e) {
        console.warn('Erro ao calcular totais para Excel:', e);
    }

    // Combinar cabeçalho e dados
    const wsData = [...headerData, ...dados];
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Tentar aplicar formatação de cabeçalho (negrito) nas células - suporte limitado no SheetJS comunitário,
    // porém definimos a propriedade .s para clientes que respeitam estilos.
    try {
        const headerRowIndex = headerData.length - 1; // índice 0-based no worksheet
        const headerCols = headerData[headerRowIndex] ? headerData[headerRowIndex].length : 0;
        for (let c = 0; c < headerCols; c++) {
            const cellRef = XLSX.utils.encode_cell({ c: c, r: headerRowIndex });
            if (!ws[cellRef]) ws[cellRef] = { t: 's', v: headerData[headerRowIndex][c] || '' };
            ws[cellRef].s = ws[cellRef].s || {};
            ws[cellRef].s.font = ws[cellRef].s.font || {};
            ws[cellRef].s.font.bold = true;
            ws[cellRef].s.alignment = { horizontal: 'center' };
        }

        // Também aplicar negrito nas duas primeiras linhas (título/subtítulo) quando existirem
        for (let r = 0; r <= 1; r++) {
            const colsCount = headerCols || (ws['!cols'] ? ws['!cols'].length : 1);
            for (let c = 0; c < colsCount; c++) {
                const cellRef = XLSX.utils.encode_cell({ c: c, r: r });
                if (!ws[cellRef]) continue;
                ws[cellRef].s = ws[cellRef].s || {};
                ws[cellRef].s.font = ws[cellRef].s.font || {};
                ws[cellRef].s.font.bold = true;
            }
        }
    } catch (e) {
        console.warn('Falha ao aplicar estilos no Excel (provavelmente compatibilidade SheetJS):', e);
    }
    // Ajustar larguras das colunas por tipo para melhorar leitura
    let colWidths = [];
    switch(tipo) {
        case 'vendas':
            colWidths = [{wch:12},{wch:30},{wch:10},{wch:12},{wch:25},{wch:15}];
            break;
        case 'estoque':
            colWidths = [{wch:30},{wch:12},{wch:10},{wch:10},{wch:12},{wch:20}];
            break;
        case 'compras':
            colWidths = [{wch:12},{wch:30},{wch:12},{wch:10},{wch:12},{wch:14},{wch:20}];
            break;
        case 'fornecedores':
            colWidths = [{wch:30},{wch:18},{wch:15},{wch:25},{wch:30},{wch:25}];
            break;
        case 'clientes':
            colWidths = [{wch:30},{wch:18},{wch:15},{wch:30}];
            break;
        case 'lucro':
            colWidths = [{wch:30},{wch:20}];
            break;
        default:
            colWidths = [{wch:20}];
    }
    ws['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    // Salvar arquivo
    XLSX.writeFile(wb, `Relatorio_${tipo}_${agora.toISOString().slice(0, 10)}.xlsx`);
}

// ========== EXPORTAÇÃO PDF ==========
// Helper: cabeçalho moderno para todos os PDFs (sem emojis)
function gerarCabecalhoPDF(doc, titulo, dataHora, usuario) {
    const pageWidth = doc.internal.pageSize.getWidth();
    // Barra superior colorida (identidade laranja)
    doc.setFillColor(202, 85, 7); // laranja da identidade
    doc.rect(0, 8, pageWidth, 26, 'F');

    // Título centralizado na barra
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(titulo, pageWidth / 2, 24, { align: 'center' });

    // Subtítulo à esquerda (sem emoji)
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Padaria Pão Quentinho', 15, 40);
    doc.text('Sys Pão - Sistema de Gestão', 15, 48);
    doc.text(`Data/Hora: ${dataHora}`, pageWidth - 15, 40, { align: 'right' });
    doc.text(`Usuário: ${usuario}`, pageWidth - 15, 48, { align: 'right' });
    // Linha separadora
    doc.setDrawColor(220, 220, 220);
    doc.line(12, 54, pageWidth - 12, 54);
}

// Helper: formata número para moeda BRL (R$ 1.234,56)
function formatBRL(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


function exportTableAsPDF(tableId, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    const table = document.getElementById(tableId);
    if (!table) {
        alert('Tabela não encontrada: ' + tableId);
        return;
    }

    const title = filename.replace('.pdf', '').replace('_', ' ');
    const agora = new Date();
    const dataHora = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const usuario = 'admin';
    // Cabeçalho padronizado
    gerarCabecalhoPDF(doc, title, dataHora, usuario);

    // Construir colunas e linhas a partir da tabela DOM
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const bodyRows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
        return Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
    });

    if (doc.autoTable) {
        doc.autoTable({
            startY: 60,
            head: [headers],
            body: bodyRows,
            theme: 'striped',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [239, 219, 190], textColor: 20 },
            margin: { left: 12, right: 12 }
        });
    } else {
        // Fallback simples
        let y = 40;
        // Cabeçalho
        doc.setFontSize(10);
        doc.text(headers.join(' | '), 10, y);
        y += 8;
        bodyRows.forEach(row => {
            doc.text(row.join(' | '), 10, y);
            y += 7;
            if (y > 180) { doc.addPage(); y = 20; }
        });
    }

    doc.save(filename);
}

// ========== UTILITÁRIOS ==========
function atualizarDataHoraFooter() {
    const agora = new Date();
    const dataHora = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('footerDataHora').textContent = dataHora;
}

// Atualiza o nome do usuário exibido no footer
function atualizarFooterUsuario() {
    const span = document.getElementById('footerUsuario');
    if (!span) return;
    const login = localStorage.getItem('currentUserLogin');
    const nomeSalvo = localStorage.getItem('currentUserName');
    // Preferir nome salvo explicitamente (persistido no login)
    if (nomeSalvo) {
        span.textContent = nomeSalvo;
        return;
    }

    if (!login) {
        span.textContent = '—';
        return;
    }

    // Se não houver nome salvo, tentar buscar em `usuarios` cadastrado
    const usuarioObj = (usuarios || []).find(u => u.login === login);
    if (usuarioObj && usuarioObj.nome) {
        span.textContent = usuarioObj.nome;
        // persistir para manter entre reloads
        localStorage.setItem('currentUserName', usuarioObj.nome);
    } else {
        // fallback para exibir o login e salvar também
        span.textContent = login;
        localStorage.setItem('currentUserName', login);
    }
}

function carregarDadosIniciais() {
    console.log('Carregando dados iniciais...');
    
    // Dados de exemplo básicos
    estoque = [
        { nome: 'Pão Francês', tipo: 'Produto', quantidade: 50, unidade: 'un', preco: 0.50, fornecedor: 'FornPadaria' },
        { nome: 'Bolo de Chocolate', tipo: 'Produto', quantidade: 10, unidade: 'un', preco: 25.00, fornecedor: 'FornDoces' },
        { nome: 'Farinha de Trigo', tipo: 'Insumo', quantidade: 100, unidade: 'kg', preco: 4.50, fornecedor: 'FornCereais' }
    ];
    
    fornecedores = [
        { nome: 'FornPadaria', cnpj: '12.345.678/0001-90', telefone: '(71) 3333-4444', email: 'contato@fornpadaria.com', endereco: 'Rua A, 123', produtos: 'Pães, Salgados' },
        { nome: 'FornDoces', cnpj: '98.765.432/0001-10', telefone: '(71) 5555-6666', email: 'vendas@forndoces.com', endereco: 'Av. B, 456', produtos: 'Bolos, Doces' },
        { nome: 'FornCereais', cnpj: '11.222.333/0001-44', telefone: '(71) 7777-8888', email: 'cereais@forncereais.com', endereco: 'Praça C, 789', produtos: 'Farinha, Açúcar, Fermento' }
    ];
    
    clientes = [
        { nome: 'João Silva', cpf: '123.456.789-00', telefone: '(71) 99999-1111', endereco: 'Rua X, 100' },
        { nome: 'Maria Santos', cpf: '987.654.321-00', telefone: '(71) 99999-2222', endereco: 'Av. Y, 200' }
    ];
    
    usuarios = [
        { nome: 'Administrador', login: 'admin', senha: 'admin', tipo: 'admin', dataCadastro: '01/01/2025' }
    ];
    
    localStorage.setItem('estoque', JSON.stringify(estoque));
    localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
    localStorage.setItem('clientes', JSON.stringify(clientes));
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    console.log('Dados iniciais carregados!');
    // atualizar badge de notificações pós carga de dados
    atualizarNotificacoesECounter();
}

// Fechar modais ao clicar fora
document.addEventListener('click', function(event) {
    const menuOptions = document.getElementById('menuOptions');
    const fornecedorModal = document.getElementById('fornecedorModal');
    const clienteModal = document.getElementById('clienteModal');
    const cameraModal = document.getElementById('cameraModal');
    const photoModal = document.getElementById('photoModal');
    
    if (menuOptions && menuOptions.classList.contains('open') && !event.target.closest('.menu-box') && !event.target.closest('.hamburger')) {
        menuOptions.classList.remove('open');
    }
    
    if (fornecedorModal && fornecedorModal.classList.contains('open') && event.target === fornecedorModal) {
        fornecedorModal.classList.remove('open');
    }
    
    if (clienteModal && clienteModal.classList.contains('open') && event.target === clienteModal) {
        clienteModal.classList.remove('open');
    }
    
    if (cameraModal && cameraModal.classList.contains('open') && event.target === cameraModal) {
        fecharCamera();
    }
    
    if (photoModal && photoModal.classList.contains('open') && event.target === photoModal) {
        fecharModal();
    }
});

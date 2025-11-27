// script.js - Sys Pão - Sistema de Gestão
// Desenvolvido por Leandro Yata - 2025

// ========== VARIÁVEIS GLOBAIS ==========
let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let compras = JSON.parse(localStorage.getItem('compras')) || [];
let fornecedores = JSON.parse(localStorage.getItem('fornecedores')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
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
    setInterval(atualizarDataHoraFooter, 60000);
    
    // Verificar se já está logado
    if (localStorage.getItem('loggedIn') === 'true') {
        console.log('Usuário já logado, redirecionando...');
        loginScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        hamburgerMenuContainer.style.display = 'flex';
        document.body.classList.add('logged-in');
        
        // SEMPRE iniciar na Dashboard
        routeMenu('dashboard');
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
});

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
        loginScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        hamburgerMenuContainer.style.display = 'flex';
        document.body.classList.add('logged-in');
        
        // SEMPRE iniciar na Dashboard
        routeMenu('dashboard');
        errorDiv.classList.add('hidden');
    } else {
        errorDiv.textContent = '❌ Usuário ou senha incorretos! Use: admin/admin';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    loginScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    hamburgerMenuContainer.style.display = 'none';
    document.body.classList.remove('logged-in');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
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
    
    // Fechar menu (mobile)
    toggleMenu();
    
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
        document.getElementById('totalVendas').textContent = `R$ ${totalVendas.toFixed(2)}`;
        document.getElementById('totalCompras').textContent = `R$ ${totalCompras.toFixed(2)}`;
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
                    Valor: R$ ${parseFloat(ultimaCompra.valorTotal || 0).toFixed(2)}<br>
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
    
    estoque.forEach((item, index) => {
        const tr = document.createElement('tr');
        const estoqueBaixo = parseFloat(item.quantidade || 0) < 10;
        tr.style.backgroundColor = estoqueBaixo ? '#ffebee' : '';
        
        tr.innerHTML = `
            <td style="${estoqueBaixo ? 'color: #d32f2f; font-weight: bold;' : ''}">${item.nome || ''}</td>
            <td>${item.tipo || ''}</td>
            <td style="${estoqueBaixo ? 'color: #d32f2f; font-weight: bold;' : ''}">${item.quantidade || 0}</td>
            <td>${item.unidade || ''}</td>
            <td>R$ ${item.preco ? parseFloat(item.preco).toFixed(2) : '0.00'}</td>
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
    const filtro = document.getElementById('filtroEstoque').value.toLowerCase();
    const linhas = document.querySelectorAll('#estoqueBody tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(filtro) ? '' : 'none';
    });
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
    
    vendas.forEach((venda, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${venda.data || ''}</td>
            <td>${venda.produto || ''}</td>
            <td>${venda.quantidade || 0}</td>
            <td>R$ ${parseFloat(venda.valor || 0).toFixed(2)}</td>
            <td>${venda.hora || ''}</td>
            <td>${venda.cliente || 'Cliente não informado'}</td>
            <td>
                <button onclick="excluirVenda(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarVendas() {
    const filtro = document.getElementById('filtroVendas').value.toLowerCase();
    const linhas = document.querySelectorAll('#vendasBody tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(filtro) ? '' : 'none';
    });
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
        cliente: cliente || 'Cliente não informado'
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
    
    alert('✅ Venda registrada com sucesso!');
}

function limparFormVenda() {
    document.getElementById('formVenda').reset();
    document.getElementById('vendaValor').value = '';
    document.getElementById('vendaData').value = new Date().toISOString().split('T')[0];
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
    
    compras.forEach((compra, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${compra.data || ''}</td>
            <td>${compra.produto || ''}</td>
            <td>${compra.quantidade || 0}</td>
            <td>R$ ${parseFloat(compra.valorUnitario || 0).toFixed(2)}</td>
            <td>R$ ${parseFloat(compra.valorTotal || 0).toFixed(2)}</td>
            <td>${compra.fornecedor || '-'}</td>
            <td>
                <button onclick="excluirCompra(${index})" title="Excluir" style="background:transparent;color:#d9534f;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarCompras() {
    const filtro = document.getElementById('filtroCompras').value.toLowerCase();
    const linhas = document.querySelectorAll('#comprasBody tr');
    
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(filtro) ? '' : 'none';
    });
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
        quantidade: parseInt(document.getElementById('compraQtd').value) || 0,
        valorUnitario: parseFloat(document.getElementById('compraValorUnitario').value) || 0,
        valorTotal: parseFloat(document.getElementById('compraValorTotal').value) || 0,
        fornecedor: document.getElementById('compraFornecedor').value,
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
    } else {
        estoque.push({
            nome: compra.produto,
            tipo: 'Insumo',
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
                            </tr>
                        </thead>
                        <tbody>
                            ${vendasFiltradas.map(v => `
                                <tr>
                                    <td>${v.data}</td>
                                    <td>${v.produto}</td>
                                    <td>${v.quantidade}</td>
                                    <td>R$ ${parseFloat(v.valor).toFixed(2)}</td>
                                    <td>${v.cliente}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p><strong>Total de Vendas: R$ ${vendasFiltradas.reduce((sum, v) => sum + parseFloat(v.valor), 0).toFixed(2)}</strong></p>
            `;
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
                                    <td>R$ ${parseFloat(e.preco || 0).toFixed(2)}</td>
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
                                    <td>R$ ${parseFloat(c.valorUnitario).toFixed(2)}</td>
                                    <td>R$ ${parseFloat(c.valorTotal).toFixed(2)}</td>
                                    <td>${c.fornecedor}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <p><strong>Total em Compras: R$ ${comprasFiltradas.reduce((sum, c) => sum + parseFloat(c.valorTotal), 0).toFixed(2)}</strong></p>
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
            let clientesFiltrados = clientes;
            
            if (cliente) {
                clientesFiltrados = clientesFiltrados.filter(c => c.nome === cliente);
            }
            
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
            break;
            
        case 'lucro':
            const totalVendas = vendas.reduce((sum, v) => sum + parseFloat(v.valor), 0);
            const totalCompras = compras.reduce((sum, c) => sum + parseFloat(c.valorTotal), 0);
            const lucro = totalVendas - totalCompras;
            
            conteudo += `
                <div class="dashboard-card">
                    <h3>💵 Análise de Lucro/Prejuízo</h3>
                    <div class="stat-number" style="color: ${lucro >= 0 ? '#4CAF50' : '#F44336'}">R$ ${lucro.toFixed(2)}</div>
                    <div class="stat-label">${lucro >= 0 ? 'Lucro' : 'Prejuízo'}</div>
                    <p><strong>Total de Vendas:</strong> R$ ${totalVendas.toFixed(2)}</p>
                    <p><strong>Total de Compras:</strong> R$ ${totalCompras.toFixed(2)}</p>
                </div>
            `;
            break;
    }
    
    document.getElementById('relatorioContent').innerHTML = conteudo;
}

function limparFiltrosRelatorio() {
    document.getElementById('relTipo').value = 'vendas';
    document.getElementById('filtroProduto').value = '';
    document.getElementById('filtroInicio').value = '';
    document.getElementById('filtroFim').value = '';
    document.getElementById('filtroFornecedor').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('relatorioContent').innerHTML = '';
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
    const usuario = 'admin'; // Em um sistema real, pegaria do usuário logado
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setTextColor(210, 105, 30); // Cor laranja
    doc.text('🥖 Padaria Pão Quentinho', 15, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('🥖 Sys Pão - Sistema de Gestão', 15, 30);
    doc.text(`Relatório: ${titulo}`, 15, 40);
    doc.text(`Data/Hora: ${dataHora}`, 15, 50);
    doc.text(`Usuário: ${usuario}`, 15, 60);
    
    // Linha divisória
    doc.setDrawColor(210, 105, 30);
    doc.line(15, 65, 280, 65);
    
    // Conteúdo do relatório
    let y = 80;
    
    switch(tipo) {
        case 'vendas':
            doc.setFontSize(14);
            doc.text('Detalhes das Vendas', 15, y);
            y += 15;
            
            // Cabeçalho da tabela
            doc.setFontSize(10);
            doc.setFillColor(239, 219, 190);
            doc.rect(15, y, 260, 10, 'F');
            doc.text('Data', 20, y + 7);
            doc.text('Produto', 50, y + 7);
            doc.text('Qtd', 120, y + 7);
            doc.text('Valor (R$)', 150, y + 7);
            doc.text('Cliente', 190, y + 7);
            y += 15;
            
            // Dados
            const vendasFiltradas = obterDadosFiltrados();
            vendasFiltradas.forEach(venda => {
                if (y > 180) {
                    doc.addPage('landscape');
                    y = 20;
                }
                doc.text(venda.data || '', 20, y);
                doc.text(venda.produto || '', 50, y);
                doc.text((venda.quantidade || 0).toString(), 120, y);
                doc.text(`R$ ${parseFloat(venda.valor || 0).toFixed(2)}`, 150, y);
                doc.text(venda.cliente || 'Não informado', 190, y);
                y += 10;
            });
            
            // Total
            y += 5;
            doc.setFontSize(12);
            doc.text(`Total de Vendas: R$ ${vendasFiltradas.reduce((sum, v) => sum + parseFloat(v.valor || 0), 0).toFixed(2)}`, 15, y);
            break;
            
        case 'estoque':
            doc.setFontSize(14);
            doc.text('Situação do Estoque', 15, y);
            y += 15;
            
            // Cabeçalho da tabela
            doc.setFontSize(10);
            doc.setFillColor(239, 219, 190);
            doc.rect(15, y, 260, 10, 'F');
            doc.text('Produto', 20, y + 7);
            doc.text('Tipo', 80, y + 7);
            doc.text('Qtd', 120, y + 7);
            doc.text('Unidade', 150, y + 7);
            doc.text('Preço (R$)', 190, y + 7);
            doc.text('Fornecedor', 230, y + 7);
            y += 15;
            
            // Dados
            const estoqueFiltrado = obterDadosFiltrados();
            estoqueFiltrado.forEach(item => {
                if (y > 180) {
                    doc.addPage('landscape');
                    y = 20;
                }
                doc.text(item.nome || '', 20, y);
                doc.text(item.tipo || '', 80, y);
                doc.text((item.quantidade || 0).toString(), 120, y);
                doc.text(item.unidade || '', 150, y);
                doc.text(`R$ ${parseFloat(item.preco || 0).toFixed(2)}`, 190, y);
                doc.text(item.fornecedor || '-', 230, y);
                y += 10;
            });
            break;
            
        // Outros tipos de relatório seguem a mesma lógica
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
        ['🥖 Padaria Pão Quentinho'],
        ['🥖 Sys Pão - Sistema de Gestão'],
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
                parseFloat(venda.valor || 0),
                venda.cliente || 'Não informado'
            ]);
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Data', 'Produto', 'Quantidade', 'Valor (R$)', 'Cliente']);
            break;
            
        case 'estoque':
            dados = obterDadosFiltrados().map(item => [
                item.nome,
                item.tipo,
                item.quantidade,
                item.unidade,
                parseFloat(item.preco || 0),
                item.fornecedor || '-'
            ]);
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Produto', 'Tipo', 'Quantidade', 'Unidade', 'Preço (R$)', 'Fornecedor']);
            break;
            
        case 'compras':
            dados = obterDadosFiltrados().map(compra => [
                compra.data,
                compra.produto,
                compra.quantidade,
                parseFloat(compra.valorUnitario || 0),
                parseFloat(compra.valorTotal || 0),
                compra.fornecedor || '-'
            ]);
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Data', 'Produto', 'Quantidade', 'Valor Unitário (R$)', 'Valor Total (R$)', 'Fornecedor']);
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
            const totalVendas = vendas.reduce((sum, v) => sum + parseFloat(v.valor || 0), 0);
            const totalCompras = compras.reduce((sum, c) => sum + parseFloat(c.valorTotal || 0), 0);
            const lucro = totalVendas - totalCompras;
            
            dados = [
                ['Total de Vendas', `R$ ${totalVendas.toFixed(2)}`],
                ['Total de Compras', `R$ ${totalCompras.toFixed(2)}`],
                ['Resultado', `R$ ${lucro.toFixed(2)}`],
                ['Situação', lucro >= 0 ? 'Lucro' : 'Prejuízo']
            ];
            
            // Adicionar cabeçalho da tabela
            headerData.push(['Descrição', 'Valor']);
            break;
    }
    
    // Combinar cabeçalho e dados
    const wsData = [...headerData, ...dados];
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    // Salvar arquivo
    XLSX.writeFile(wb, `Relatorio_${tipo}_${agora.toISOString().slice(0, 10)}.xlsx`);
}

function obterDadosFiltrados() {
    const tipo = document.getElementById('relTipo').value;
    const produto = document.getElementById('filtroProduto').value;
    const inicio = document.getElementById('filtroInicio').value;
    const fim = document.getElementById('filtroFim').value;
    const fornecedor = document.getElementById('filtroFornecedor').value;
    const cliente = document.getElementById('filtroCliente').value;
    
    let dados = [];
    
    switch(tipo) {
        case 'vendas':
            dados = vendas;
            if (produto) dados = dados.filter(v => v.produto === produto);
            if (inicio) dados = dados.filter(v => v.data >= inicio);
            if (fim) dados = dados.filter(v => v.data <= fim);
            if (cliente) dados = dados.filter(v => v.cliente === cliente);
            break;
            
        case 'estoque':
            dados = estoque;
            if (produto) dados = dados.filter(e => e.nome === produto);
            break;
            
        case 'compras':
            dados = compras;
            if (produto) dados = dados.filter(c => c.produto === produto);
            if (inicio) dados = dados.filter(c => c.data >= inicio);
            if (fim) dados = dados.filter(c => c.data <= fim);
            if (fornecedor) dados = dados.filter(c => c.fornecedor === fornecedor);
            break;
            
        case 'fornecedores':
            dados = fornecedores;
            if (fornecedor) dados = dados.filter(f => f.nome === fornecedor);
            break;
            
        case 'clientes':
            dados = clientes;
            if (cliente) dados = dados.filter(c => c.nome === cliente);
            break;
            
        case 'lucro':
            // Para lucro, retornamos um array vazio pois o cálculo é feito separadamente
            dados = [];
            break;
    }
    
    return dados;
}

// ========== EXPORTAÇÃO PDF ==========
function exportTableAsPDF(tableId, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const table = document.getElementById(tableId);
    const title = filename.replace('.pdf', '').replace('_', ' ');
    
    doc.text(title, 10, 10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 10, 20);
    
    // Simples exportação de texto
    let y = 40;
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        if (index === 0) {
            // Cabeçalho
            const headers = row.querySelectorAll('th');
            let headerText = '';
            headers.forEach(header => {
                headerText += header.textContent + ' | ';
            });
            doc.text(headerText, 10, y);
            y += 10;
        } else {
            // Dados
            const cells = row.querySelectorAll('td');
            let rowText = '';
            cells.forEach(cell => {
                rowText += cell.textContent + ' | ';
            });
            doc.text(rowText, 10, y);
            y += 10;
            
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        }
    });
    
    doc.save(filename);
}

// ========== UTILITÁRIOS ==========
function atualizarDataHoraFooter() {
    const agora = new Date();
    const dataHora = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('footerDataHora').textContent = dataHora;
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
// Variáveis globais
let menuOpen = false;
let chartProdutosVendidos = null;
let listaEstoqueVisivel = false;
let listaVendasVisivel = false;
let listaComprasVisivel = false;
let listaFornecedoresVisivel = false;
let listaRelatoriosVisivel = false;
let listaUsuariosVisivel = false;
let sortConfig = {
  key: null,
  direction: 'asc'
};
let editandoVenda = false;
let editandoCompra = false;
let editandoFornecedor = false;
let indiceEditandoVenda = -1;
let indiceEditandoCompra = -1;
let indiceEditandoFornecedor = -1;
let relatoriosSalvos = [];
let usuarioFoto = null;

// ========== NOVAS FUNÇÕES GLOBAIS ==========

// Atualizar data e hora no footer
function atualizarDataHoraFooter() {
  const agora = new Date();
  const dataHora = agora.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById('footerDataHora').textContent = dataHora;
}

// Fechar todas as seções de cadastro ao iniciar
function fecharTodasSecoesCadastro() {
  const details = document.querySelectorAll('details');
  details.forEach(detail => {
    detail.open = false;
  });
}

// ========== FUNÇÕES DE NAVEGAÇÃO E LOGIN ==========

function showHamburgerIfLogged() {
  document.getElementById("hamburgerMenuContainer").style.display="flex";
}

function toggleMenu() {
  menuOpen = !menuOpen;
  document.getElementById('menuOptions').classList.toggle('open');
  if(menuOpen){
    document.body.style.overflow="hidden";
  } else {
    document.body.style.overflow="";
  }
}

function routeMenu(sec) {
  toggleMenu();
  navigate(sec);
  ['Dash','Pro','Ven','Com','For','Rel','Usu','Info'].forEach(id=>{
    let btn = document.getElementById('menu'+id+'Btn');
    if (btn) btn.classList.remove('active');
  });
  if(sec==='dashboard') document.getElementById('menuDashBtn').classList.add('active');
  if(sec==='produtos') document.getElementById('menuProBtn').classList.add('active');
  if(sec==='vendas') document.getElementById('menuVenBtn').classList.add('active');
  if(sec==='compras') document.getElementById('menuComBtn').classList.add('active');
  if(sec==='fornecedores') document.getElementById('menuForBtn').classList.add('active');
  if(sec==='relatorios') document.getElementById('menuRelBtn').classList.add('active');
  if(sec==='usuarios') document.getElementById('menuUsuBtn').classList.add('active');
  if(sec==='informacoes') document.getElementById('menuInfoBtn').classList.add('active');
}

// Login com Enter
function loginComEnter(event) {
  if (event.key === 'Enter') {
    login();
  }
}

function login() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;
  
  // Verificar se o usuário existe
  const usuarios = getUsuarios();
  const usuarioValido = usuarios.find(u => u.login === user && u.senha === pass);
  
  if(usuarioValido || (user === 'admin' && pass === 'admin')) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    showHamburgerIfLogged();
    document.body.classList.add('logged-in');
    navegarPrimeiraVez();
  } else {
    document.getElementById('loginError').textContent = "❌ Usuário ou senha inválidos. Tente novamente!";
    document.getElementById('loginError').classList.remove('hidden');
  }
}

function logout(){
  document.getElementById('mainScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById("hamburgerMenuContainer").style.display="none";
  document.body.classList.remove('logged-in');
  document.getElementById('menuOptions').classList.remove('open');
  document.body.style.overflow='';
}

function navigate(sec) {
  for(const id of ["Dashboard","Informacoes", "Produtos", "Vendas", "Compras", "Fornecedores", "Relatorios", "Usuarios"]) {
    document.getElementById('sec'+capitalize(sec)).classList.add('hidden');
  }
  document.getElementById('sec'+capitalize(sec)).classList.remove('hidden');
  if(sec==='produtos') atualizarEstoqueTable();
  if(sec==='vendas') atualizarVendasTable();
  if(sec==='compras') atualizarComprasTable();
  if(sec==='fornecedores') atualizarFornecedoresTable();
  if(sec==='relatorios') atualizarFiltrosRelatorio();
  if(sec==='usuarios') atualizarUsuariosTable();
  if(sec==='dashboard') atualizarDashboard();
  window.scrollTo(0, 0);
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function navegarPrimeiraVez(){
  if(!localStorage.getItem('padaria_estoque')) inicializarDemo();
  fecharTodasSecoesCadastro();
  atualizarEstoqueTable();
  atualizarComboProdutos();
  atualizarVendasTable();
  atualizarComprasTable();
  atualizarFornecedoresTable();
  atualizarFiltrosRelatorio();
  atualizarUsuariosTable();
  atualizarDashboard();
  
  // Carregar relatórios salvos do localStorage
  const relatoriosSalvosStorage = localStorage.getItem('syspao_relatorios');
  if (relatoriosSalvosStorage) {
    relatoriosSalvos = JSON.parse(relatoriosSalvosStorage);
  }
}

function inicializarDemo(){
  // Arrays vazios - sem dados de exemplo
  const estoque = [];
  const vendas = [];
  const compras = [];
  const fornecedores = [];
  const usuarios = [
    {nome:'Administrador', login:'admin', senha:'admin', tipo:'admin', dataCadastro:'2025-01-01'}
  ];
  
  localStorage.setItem('padaria_estoque', JSON.stringify(estoque));
  localStorage.setItem('padaria_vendas', JSON.stringify(vendas));
  localStorage.setItem('padaria_compras', JSON.stringify(compras));
  localStorage.setItem('padaria_fornecedores', JSON.stringify(fornecedores));
  localStorage.setItem('padaria_usuarios', JSON.stringify(usuarios));
}

// ========== FUNÇÕES PARA ESTOQUE ==========

function getEstoque(){
  return JSON.parse(localStorage.getItem('padaria_estoque') || '[]');
}
function setEstoque(arr){
  localStorage.setItem('padaria_estoque', JSON.stringify(arr));
}

function toggleListaEstoque() {
  listaEstoqueVisivel = !listaEstoqueVisivel;
  const container = document.getElementById('listaEstoqueContainer');
  const btn = document.getElementById('btnVerLista');
  
  if (listaEstoqueVisivel) {
    container.classList.remove('hidden');
    btn.textContent = '📋 Ocultar Lista';
    atualizarEstoqueTable();
  } else {
    container.classList.add('hidden');
    btn.textContent = '📋 Ver Lista';
  }
}

function atualizarEstoqueTable(){
  const el = document.getElementById('estoqueBody');
  const estoque = getEstoque();
  el.innerHTML = '';
  
  if(estoque.length === 0) {
    el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#999;">Nenhum item cadastrado</td></tr>';
    return;
  }
  
  estoque.forEach((e,i)=>{
    el.innerHTML += `<tr>
      <td><b>${e.nome}</b></td>
      <td>${e.tipo}</td>
      <td>${e.qtd}</td>
      <td>${e.unidade}</td>
      <td>${(+e.preco || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
      <td>${e.validade||'-'}</td>
      <td>${e.fornecedor||'-'}</td>
      <td style="white-space:nowrap;">
        <button onclick="editarEstoque(${i})" title="Editar" style="background:#4C9A2A;color:white;">✏️</button>
        <button onclick="removerEstoque(${i})" style="background:#d32f2f;color:white;" title="Remover">🗑️</button>
      </td>
    </tr>`;
  });
  atualizarComboProdutos();
  atualizarComboFiltroProduto();
  atualizarComboFornecedor();
}

function adicionarEstoque(ev){
  ev.preventDefault();
  let estoque = getEstoque();
  const nome = document.getElementById('prodNome').value.trim();
  const tipo = document.getElementById('prodTipo').value;
  let qtd = parseFloat(document.getElementById('prodQtd').value);
  if(isNaN(qtd)) qtd=0;
  const unidade = document.getElementById('prodUnidade').value;
  const preco = parseFloat(document.getElementById('prodPreco').value) || 0;
  const validade = document.getElementById('prodValidade').value;
  const fornecedor = document.getElementById('prodFornecedor').value.trim();
  const idx = estoque.findIndex(e=>e.nome.toLowerCase()===nome.toLowerCase());
  if(idx>=0) estoque[idx] = {nome, tipo, qtd, unidade, preco, validade, fornecedor};
  else estoque.push({nome, tipo, qtd, unidade, preco, validade, fornecedor});
  setEstoque(estoque);
  atualizarEstoqueTable();
  limparFormEstoque();
  alert('✅ Item salvo com sucesso!');
}

function editarEstoque(idx){
  const e = getEstoque()[idx];
  document.getElementById('prodNome').value = e.nome;
  document.getElementById('prodTipo').value = e.tipo;
  document.getElementById('prodQtd').value = e.qtd;
  document.getElementById('prodUnidade').value = e.unidade;
  document.getElementById('prodPreco').value = e.preco || "";
  document.getElementById('prodValidade').value = e.validade || "";
  document.getElementById('prodFornecedor').value = e.fornecedor;
  window.scrollTo(0, document.body.scrollHeight);
}

function limparFormEstoque() {
  document.getElementById('formEstoque').reset();
}

function removerEstoque(idx){
  if(confirm("❌ Deseja realmente remover este item do estoque?")) {
    let estoque=getEstoque();
    estoque.splice(idx,1);
    setEstoque(estoque);
    atualizarEstoqueTable();
  }
}

function filtrarEstoque() {
  const filtro = document.getElementById('filtroEstoque').value.toLowerCase();
  const linhas = document.querySelectorAll('#estoqueBody tr');
  
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    if (texto.includes(filtro)) {
      linha.style.display = '';
    } else {
      linha.style.display = 'none';
    }
  });
}

function atualizarComboProdutos(){
  const estq = getEstoque().filter(e=>e.tipo==='Produto');
  const c = document.getElementById('vendaProduto');
  c.innerHTML='';
  if(estq.length === 0) {
    c.innerHTML='<option value="">Nenhum produto cadastrado</option>';
  } else {
    estq.forEach(e=>{
      c.innerHTML+=`<option value="${e.nome}" data-preco="${e.preco || 0}">${e.nome} - ${(+e.preco || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</option>`;
    });
  }
}

function atualizarComboFiltroProduto(){
  const estq = getEstoque();
  const c = document.getElementById('filtroProduto');
  if(!c) return;
  c.innerHTML='<option value="">Todos</option>';
  [...new Set(estq.map(e=>e.nome))].forEach(n=>{
    c.innerHTML+=`<option value="${n}">${n}</option>`;
  });
}

function atualizarComboFornecedor(){
  const estq = getEstoque();
  const c = document.getElementById('filtroFornecedor');
  if(!c) return;
  c.innerHTML='<option value="">Todos</option>';
  [...new Set(estq.map(e=>e.fornecedor).filter(Boolean))].forEach(n=>{
    c.innerHTML+=`<option value="${n}">${n}</option>`;
  });
}

// ========== FUNÇÕES PARA VENDAS ==========

function getVendas(){
  return JSON.parse(localStorage.getItem('padaria_vendas')||'[]');
}
function setVendas(arr){
  localStorage.setItem('padaria_vendas', JSON.stringify(arr));
}

function toggleListaVendas() {
  listaVendasVisivel = !listaVendasVisivel;
  const container = document.getElementById('listaVendasContainer');
  const btn = document.getElementById('btnVerListaVendas');
  
  if (listaVendasVisivel) {
    container.classList.remove('hidden');
    btn.textContent = '📋 Ocultar Lista';
    atualizarVendasTable();
  } else {
    container.classList.add('hidden');
    btn.textContent = '📋 Ver Lista';
  }
}

function atualizarVendasTable(){
  const vendas = getVendas();
  let tbody = document.getElementById('vendasBody');
  tbody.innerHTML='';
  if(vendas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999;">Nenhuma venda registrada</td></tr>';
  } else {
    vendas.forEach((v,i)=>{
      tbody.innerHTML += `<tr>
        <td>${v.data}</td>
        <td><b>${v.produto}</b></td>
        <td>${v.qtd}</td>
        <td><b>${(+v.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b></td>
        <td>${v.hora||'-'}</td>
        <td style="white-space:nowrap;">
          <button onclick="editarVenda(${i})" title="Editar" style="background:#4C9A2A;color:white;">✏️</button>
          <button onclick="removerVenda(${i})" style="background:#d32f2f;color:white;" title="Remover">🗑️</button>
        </td>
      </tr>`;
    });
  }
}

function filtrarVendas() {
  const filtro = document.getElementById('filtroVendas').value.toLowerCase();
  const linhas = document.querySelectorAll('#vendasBody tr');
  
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    if (texto.includes(filtro)) {
      linha.style.display = '';
    } else {
      linha.style.display = 'none';
    }
  });
}

function registrarVenda(ev){
  ev.preventDefault();
  let vendas=getVendas();
  let produto=document.getElementById('vendaProduto').value;
  let qtd=parseInt(document.getElementById('vendaQtd').value);
  let valor=parseFloat(document.getElementById('vendaValor').value);
  let data=document.getElementById('vendaData').value;
  let hora=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  
  if (editandoVenda) {
    vendas[indiceEditandoVenda] = {produto, qtd, valor, data, hora};
    editandoVenda = false;
    indiceEditandoVenda = -1;
  } else {
    vendas.push({produto, qtd, valor, data, hora});
  }
  
  setVendas(vendas);
  atualizarVendasTable();
  ajustarEstoqueProd(produto,qtd);
  limparFormVenda();
  alert('✅ Venda registrada com sucesso!');
}

function editarVenda(idx){
  const v = getVendas()[idx];
  document.getElementById('vendaProduto').value = v.produto;
  document.getElementById('vendaQtd').value = v.qtd;
  document.getElementById('vendaPrecoUnitario').value = v.valor / v.qtd;
  document.getElementById('vendaValor').value = v.valor;
  document.getElementById('vendaData').value = v.data;
  
  editandoVenda = true;
  indiceEditandoVenda = idx;
  
  window.scrollTo(0, document.body.scrollHeight);
}

function limparFormVenda() {
  document.getElementById('formVenda').reset();
  editandoVenda = false;
  indiceEditandoVenda = -1;
  calcularValorTotalVenda();
}

function removerVenda(idx){
  if(confirm("❌ Deseja realmente remover esta venda?")) {
    let vendas=getVendas();
    vendas.splice(idx,1);
    setVendas(vendas);
    atualizarVendasTable();
  }
}

function ajustarEstoqueProd(produto,quantidade){
  let estoque=getEstoque();
  let idx = estoque.findIndex(e=>e.nome.toLowerCase()===produto.toLowerCase());
  if(idx>=0 && estoque[idx].qtd>=quantidade) estoque[idx].qtd -= quantidade;
  setEstoque(estoque);
  atualizarEstoqueTable();
}

function atualizarPrecoVenda() {
  const produtoSelecionado = document.getElementById('vendaProduto');
  const precoUnitario = produtoSelecionado.options[produtoSelecionado.selectedIndex].getAttribute('data-preco') || 0;
  document.getElementById('vendaPrecoUnitario').value = precoUnitario;
  calcularValorTotalVenda();
}

function calcularValorTotalVenda() {
  const qtd = parseFloat(document.getElementById('vendaQtd').value) || 0;
  const precoUnitario = parseFloat(document.getElementById('vendaPrecoUnitario').value) || 0;
  document.getElementById('vendaValor').value = (qtd * precoUnitario).toFixed(2);
}

// ========== FUNÇÕES PARA COMPRAS ==========

function getCompras(){
  return JSON.parse(localStorage.getItem('padaria_compras')||'[]');
}
function setCompras(arr){
  localStorage.setItem('padaria_compras', JSON.stringify(arr));
}

function toggleListaCompras() {
  listaComprasVisivel = !listaComprasVisivel;
  const container = document.getElementById('listaComprasContainer');
  const btn = document.getElementById('btnVerListaCompras');
  
  if (listaComprasVisivel) {
    container.classList.remove('hidden');
    btn.textContent = '📋 Ocultar Lista';
    atualizarComprasTable();
  } else {
    container.classList.add('hidden');
    btn.textContent = '📋 Ver Lista';
  }
}

function atualizarComprasTable(){
  const compras = getCompras();
  let tbody = document.getElementById('comprasBody');
  tbody.innerHTML='';
  if(compras.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Nenhuma compra registrada</td></tr>';
  } else {
    compras.forEach((c,i)=>{
      tbody.innerHTML += `<tr>
        <td>${c.data}</td>
        <td><b>${c.produto}</b></td>
        <td>${c.qtd}</td>
        <td>${(+c.valorUnitario).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
        <td><b>${(+c.valorTotal).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b></td>
        <td>${c.fornecedor||'-'}</td>
        <td style="white-space:nowrap;">
          <button onclick="editarCompra(${i})" title="Editar" style="background:#4C9A2A;color:white;">✏️</button>
          <button onclick="removerCompra(${i})" style="background:#d32f2f;color:white;" title="Remover">🗑️</button>
        </td>
      </tr>`;
    });
  }
}

function filtrarCompras() {
  const filtro = document.getElementById('filtroCompras').value.toLowerCase();
  const linhas = document.querySelectorAll('#comprasBody tr');
  
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    if (texto.includes(filtro)) {
      linha.style.display = '';
    } else {
      linha.style.display = 'none';
    }
  });
}

function registrarCompra(ev){
  ev.preventDefault();
  let compras=getCompras();
  let produto=document.getElementById('compraProduto').value.trim();
  let qtd=parseInt(document.getElementById('compraQtd').value);
  let valorUnitario=parseFloat(document.getElementById('compraValorUnitario').value);
  let valorTotal=parseFloat(document.getElementById('compraValorTotal').value);
  let fornecedor=document.getElementById('compraFornecedor').value.trim();
  let data=document.getElementById('compraData').value;
  
  if (editandoCompra) {
    compras[indiceEditandoCompra] = {produto, qtd, valorUnitario, valorTotal, fornecedor, data};
    editandoCompra = false;
    indiceEditandoCompra = -1;
  } else {
    compras.push({produto, qtd, valorUnitario, valorTotal, fornecedor, data});
  }
  
  setCompras(compras);
  atualizarComprasTable();
  
  // Atualizar estoque
  let estoque = getEstoque();
  let idx = estoque.findIndex(e=>e.nome.toLowerCase()===produto.toLowerCase());
  if(idx>=0) {
    estoque[idx].qtd += qtd;
    if(fornecedor) estoque[idx].fornecedor = fornecedor;
  } else {
    estoque.push({nome:produto, tipo:'Insumo', qtd, unidade:'un', preco: 0, validade:'', fornecedor});
  }
  setEstoque(estoque);
  atualizarEstoqueTable();
  
  limparFormCompra();
  alert('✅ Compra registrada com sucesso!');
}

function editarCompra(idx){
  const c = getCompras()[idx];
  document.getElementById('compraProduto').value = c.produto;
  document.getElementById('compraQtd').value = c.qtd;
  document.getElementById('compraValorUnitario').value = c.valorUnitario;
  document.getElementById('compraValorTotal').value = c.valorTotal;
  document.getElementById('compraFornecedor').value = c.fornecedor || "";
  document.getElementById('compraData').value = c.data;
  
  editandoCompra = true;
  indiceEditandoCompra = idx;
  
  window.scrollTo(0, document.body.scrollHeight);
}

function limparFormCompra() {
  document.getElementById('formCompra').reset();
  editandoCompra = false;
  indiceEditandoCompra = -1;
  calcularValorTotalCompra();
}

function removerCompra(idx){
  if(confirm("❌ Deseja realmente remover esta compra?")) {
    let compras=getCompras();
    compras.splice(idx,1);
    setCompras(compras);
    atualizarComprasTable();
  }
}

// Calcular valor total da compra
document.getElementById('compraQtd')?.addEventListener('input', calcularValorTotalCompra);
document.getElementById('compraValorUnitario')?.addEventListener('input', calcularValorTotalCompra);

function calcularValorTotalCompra(){
  const qtd = parseFloat(document.getElementById('compraQtd').value) || 0;
  const valorUnitario = parseFloat(document.getElementById('compraValorUnitario').value) || 0;
  document.getElementById('compraValorTotal').value = (qtd * valorUnitario).toFixed(2);
}

function atualizarPrecoCompra() {
  const produto = document.getElementById('compraProduto').value.trim();
  const estoque = getEstoque();
  const item = estoque.find(e => e.nome.toLowerCase() === produto.toLowerCase());
  
  if (item && item.preco) {
    document.getElementById('compraValorUnitario').value = item.preco;
    calcularValorTotalCompra();
  }
}

// ========== FUNÇÕES PARA FORNECEDORES ==========

function getFornecedores(){
  return JSON.parse(localStorage.getItem('padaria_fornecedores')||'[]');
}
function setFornecedores(arr){
  localStorage.setItem('padaria_fornecedores', JSON.stringify(arr));
}

function toggleListaFornecedores() {
  listaFornecedoresVisivel = !listaFornecedoresVisivel;
  const container = document.getElementById('listaFornecedoresContainer');
  const btn = document.getElementById('btnVerListaFornecedores');
  
  if (listaFornecedoresVisivel) {
    container.classList.remove('hidden');
    btn.textContent = '📋 Ocultar Lista';
    atualizarFornecedoresTable();
  } else {
    container.classList.add('hidden');
    btn.textContent = '📋 Ver Lista';
  }
}

function atualizarFornecedoresTable(){
  const fornecedores = getFornecedores();
  let tbody = document.getElementById('fornecedoresBody');
  tbody.innerHTML='';
  if(fornecedores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Nenhum fornecedor cadastrado</td></tr>';
  } else {
    fornecedores.forEach((f,i)=>{
      tbody.innerHTML += `<tr>
        <td><b>${f.nome}</b> ${(!f.cnpj && !f.telefone) ? '<span style="color:#d2691e;font-size:0.8em;">(dados incompletos)</span>' : ''}</td>
        <td>${f.cnpj||'-'}</td>
        <td>${f.telefone||'-'}</td>
        <td>${f.email||'-'}</td>
        <td>${f.endereco||'-'}</td>
        <td>${f.produtos||'-'}</td>
        <td style="white-space:nowrap;">
          <button onclick="editarFornecedor(${i})" title="Editar" style="background:#4C9A2A;color:white;">✏️</button>
          <button onclick="removerFornecedor(${i})" style="background:#d32f2f;color:white;" title="Remover">🗑️</button>
        </td>
      </tr>`;
    });
  }
}

function filtrarFornecedores() {
  const filtro = document.getElementById('filtroFornecedores').value.toLowerCase();
  const linhas = document.querySelectorAll('#fornecedoresBody tr');
  
  linhas.forEach(linha => {
    const texto = linha.textContent.toLowerCase();
    if (texto.includes(filtro)) {
      linha.style.display = '';
    } else {
      linha.style.display = 'none';
    }
  });
}

function adicionarFornecedor(ev){
  ev.preventDefault();
  let fornecedores = getFornecedores();
  const nome = document.getElementById('fornecedorNome').value.trim();
  const cnpj = document.getElementById('fornecedorCnpj').value.trim();
  const telefone = document.getElementById('fornecedorTelefone').value.trim();
  const email = document.getElementById('fornecedorEmail').value.trim();
  const endereco = document.getElementById('fornecedorEndereco').value.trim();
  const produtos = document.getElementById('fornecedorProdutos').value.trim();
  
  if (editandoFornecedor) {
    fornecedores[indiceEditandoFornecedor] = {nome, cnpj, telefone, email, endereco, produtos};
    editandoFornecedor = false;
    indiceEditandoFornecedor = -1;
  } else {
    const idx = fornecedores.findIndex(f=>f.nome.toLowerCase()===nome.toLowerCase());
    if(idx>=0) fornecedores[idx] = {nome, cnpj, telefone, email, endereco, produtos};
    else fornecedores.push({nome, cnpj, telefone, email, endereco, produtos});
  }
  
  setFornecedores(fornecedores);
  atualizarFornecedoresTable();
  limparFormFornecedor();
  alert('✅ Fornecedor salvo com sucesso!');
}

function editarFornecedor(idx){
  const f = getFornecedores()[idx];
  document.getElementById('fornecedorNome').value = f.nome;
  document.getElementById('fornecedorCnpj').value = f.cnpj || "";
  document.getElementById('fornecedorTelefone').value = f.telefone || "";
  document.getElementById('fornecedorEmail').value = f.email || "";
  document.getElementById('fornecedorEndereco').value = f.endereco || "";
  document.getElementById('fornecedorProdutos').value = f.produtos || "";
  
  editandoFornecedor = true;
  indiceEditandoFornecedor = idx;
  
  window.scrollTo(0, document.body.scrollHeight);
}

function limparFormFornecedor() {
  document.getElementById('formFornecedor').reset();
  editandoFornecedor = false;
  indiceEditandoFornecedor = -1;
}

function removerFornecedor(idx){
  if(confirm("❌ Deseja realmente remover este fornecedor?")) {
    let fornecedores=getFornecedores();
    fornecedores.splice(idx,1);
    setFornecedores(fornecedores);
    atualizarFornecedoresTable();
  }
}

// ========== FUNÇÕES PARA AUTCOMPLETE ==========

function autocompleteFornecedor(input, context) {
  const fornecedores = getFornecedores();
  const currentValue = input.value.toLowerCase();
  const autocompleteId = `autocomplete-${input.id}`;
  const autocompleteList = document.getElementById(autocompleteId);
  
  // Limpar lista anterior
  autocompleteList.innerHTML = '';
  
  if (currentValue.length < 1) return;
  
  // Filtrar fornecedores que contêm o texto digitado
  const matches = fornecedores
    .map(f => f.nome)
    .filter(nome => nome.toLowerCase().includes(currentValue))
    .slice(0, 5); // Limitar a 5 sugestões
  
  // Adicionar sugestões à lista
  matches.forEach(match => {
    const div = document.createElement('div');
    div.textContent = match;
    div.addEventListener('click', function() {
      input.value = match;
      autocompleteList.innerHTML = '';
    });
    autocompleteList.appendChild(div);
  });
}

function autocompleteProduto(input, context) {
  const estoque = getEstoque();
  const currentValue = input.value.toLowerCase();
  const autocompleteId = `autocomplete-${input.id}`;
  const autocompleteList = document.getElementById(autocompleteId);
  
  // Limpar lista anterior
  autocompleteList.innerHTML = '';
  
  if (currentValue.length < 2) return;
  
  // Filtrar produtos que começam com o texto digitado
  const matches = estoque
    .map(e => e.nome)
    .filter(nome => nome.toLowerCase().includes(currentValue))
    .slice(0, 5); // Limitar a 5 sugestões
  
  // Adicionar sugestões à lista
  matches.forEach(match => {
    const div = document.createElement('div');
    div.textContent = match;
    div.addEventListener('click', function() {
      input.value = match;
      autocompleteList.innerHTML = '';
    });
    autocompleteList.appendChild(div);
  });
}

// ========== FUNÇÕES PARA RELATÓRIOS (COM LISTA) ==========

function toggleListaRelatorios() {
  listaRelatoriosVisivel = !listaRelatoriosVisivel;
  const container = document.getElementById('listaRelatoriosContainer');
  const btn = document.getElementById('btnVerListaRelatorios');
  
  if (listaRelatoriosVisivel) {
    container.classList.remove('hidden');
    btn.textContent = '📋 Ocultar Lista';
    atualizarRelatoriosTable();
  } else {
    container.classList.add('hidden');
    btn.textContent = '📋 Ver Lista';
  }
}

function atualizarRelatoriosTable() {
  const tbody = document.getElementById('relatoriosBody');
  tbody.innerHTML = '';
  
  if (relatoriosSalvos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999;">Nenhum relatório salvo</td></tr>';
    return;
  }
  
  relatoriosSalvos.forEach((rel, i) => {
    tbody.innerHTML += `<tr>
      <td><b>${rel.tipo}</b></td>
      <td>${rel.dataCriacao}</td>
      <td>${rel.descricao}</td>
      <td style="white-space:nowrap;">
        <button onclick="visualizarRelatorio(${i})" title="Visualizar" style="background:#17a2b8;color:white;">👁️</button>
        <button onclick="editarRelatorio(${i})" title="Editar" style="background:#4C9A2A;color:white;">✏️</button>
        <button onclick="removerRelatorio(${i})" style="background:#d32f2f;color:white;" title="Remover">🗑️</button>
      </td>
    </tr>`;
  });
}

function salvarRelatorioAtual() {
  const tipo = document.getElementById('relTipo').value;
  const descricao = `Relatório de ${tipo} - ${new Date().toLocaleDateString('pt-BR')}`;
  
  const relatorio = {
    tipo,
    descricao,
    dataCriacao: new Date().toLocaleString('pt-BR'),
    filtros: {
      produto: document.getElementById('filtroProduto').value,
      fornecedor: document.getElementById('filtroFornecedor').value,
      inicio: document.getElementById('filtroInicio').value,
      fim: document.getElementById('filtroFim').value
    }
  };
  
  relatoriosSalvos.push(relatorio);
  salvarRelatoriosNoStorage();
  atualizarRelatoriosTable();
  alert('✅ Relatório salvo com sucesso!');
}

function visualizarRelatorio(idx) {
  const rel = relatoriosSalvos[idx];
  
  // Aplicar filtros salvos
  document.getElementById('relTipo').value = rel.tipo;
  document.getElementById('filtroProduto').value = rel.filtros.produto;
  document.getElementById('filtroFornecedor').value = rel.filtros.fornecedor;
  document.getElementById('filtroInicio').value = rel.filtros.inicio;
  document.getElementById('filtroFim').value = rel.filtros.fim;
  
  // Gerar relatório
  atualizarRelatorio();
  
  // Fechar lista se estiver aberta
  listaRelatoriosVisivel = false;
  document.getElementById('listaRelatoriosContainer').classList.add('hidden');
  document.getElementById('btnVerListaRelatorios').textContent = '📋 Ver Lista';
}

function editarRelatorio(idx) {
  // Similar ao visualizar, mas permite edição
  visualizarRelatorio(idx);
}

function removerRelatorio(idx) {
  if (confirm("❌ Deseja realmente remover este relatório?")) {
    relatoriosSalvos.splice(idx, 1);
    salvarRelatoriosNoStorage();
    atualizarRelatoriosTable();
  }
}

function limparFiltrosRelatorio() {
  document.getElementById('relTipo').value = 'vendas';
  document.getElementById('filtroProduto').value = '';
  document.getElementById('filtroFornecedor').value = '';
  document.getElementById('filtroInicio').value = '';
  document.getElementById('filtroFim').value = '';
  document.getElementById('relatorioContent').innerHTML = '';
}

function salvarRelatoriosNoStorage() {
  localStorage.setItem('syspao_relatorios', JSON.stringify(relatoriosSalvos));
}

// ========== FUNÇÕES PARA USUÁRIOS (COM LISTA E FOTO) ==========

function getUsuarios(){
  return JSON.parse(localStorage.getItem('padaria_usuarios')||'[]');
}
function setUsuarios(arr){
  localStorage.setItem('padaria_usuarios', JSON.stringify(arr));
}

function toggleListaUsuarios() {
  listaUsuariosVisivel = !listaUsuariosVisivel;
  const container = document.getElementById('listaUsuariosContainer');
  const btn = document.getElementById('btnVerListaUsuarios');
  
  if (listaUsuariosVisivel) {
    container.classList.remove('hidden');
    btn.textContent = '📋 Ocultar Lista';
    atualizarUsuariosTable();
  } else {
    container.classList.add('hidden');
    btn.textContent = '📋 Ver Lista';
  }
}

function atualizarUsuariosTable(){
  const usuarios = getUsuarios();
  let tbody = document.getElementById('usuariosBody');
  tbody.innerHTML='';
  
  if(usuarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999;">Nenhum usuário cadastrado</td></tr>';
    return;
  }
  
  usuarios.forEach((u,i)=>{
    tbody.innerHTML += `<tr>
      <td>
        ${u.foto ? `<img src="${u.foto}" class="user-photo-preview" onclick="visualizarFoto('${u.foto}')">` : '👤'}
        <b>${u.nome}</b>
      </td>
      <td>${u.login}</td>
      <td>${u.tipo}</td>
      <td>${u.dataCadastro}</td>
      <td style="white-space:nowrap;">
        <button onclick="editarUsuario(${i})" title="Editar" style="background:#4C9A2A;color:white;">✏️</button>
        <button onclick="removerUsuario(${i})" style="background:#d32f2f;color:white;" title="Remover">🗑️</button>
      </td>
    </tr>`;
  });
}

function adicionarUsuario(ev){
  ev.preventDefault();
  let usuarios = getUsuarios();
  const nome = document.getElementById('usuarioNome').value.trim();
  const login = document.getElementById('usuarioLogin').value.trim();
  const senha = document.getElementById('usuarioSenha').value;
  const tipo = document.getElementById('usuarioTipo').value;
  const dataCadastro = new Date().toISOString().split('T')[0];
  
  // Verificar se o login já existe
  if(usuarios.find(u => u.login === login)) {
    alert('❌ Já existe um usuário com este login!');
    return;
  }
  
  usuarios.push({nome, login, senha, tipo, dataCadastro, foto: usuarioFoto});
  setUsuarios(usuarios);
  atualizarUsuariosTable();
  limparFormUsuario();
  alert('✅ Usuário cadastrado com sucesso!');
}

function editarUsuario(idx){
  const u = getUsuarios()[idx];
  document.getElementById('usuarioNome').value = u.nome;
  document.getElementById('usuarioLogin').value = u.login;
  document.getElementById('usuarioSenha').value = u.senha;
  document.getElementById('usuarioTipo').value = u.tipo;
  if (u.foto) {
    document.getElementById('usuarioFotoPreview').src = u.foto;
    document.getElementById('usuarioFotoPreview').style.display = 'block';
    usuarioFoto = u.foto;
  }
  window.scrollTo(0, document.body.scrollHeight);
}

function limparFormUsuario() {
  document.getElementById('usuarioNome').value = '';
  document.getElementById('usuarioLogin').value = '';
  document.getElementById('usuarioSenha').value = '';
  document.getElementById('usuarioTipo').value = 'admin';
  document.getElementById('usuarioFotoPreview').src = '';
  document.getElementById('usuarioFotoPreview').style.display = 'none';
  usuarioFoto = null;
}

function removerUsuario(idx){
  if(confirm("❌ Deseja realmente remover este usuário?")) {
    let usuarios=getUsuarios();
    // Não permitir remover o último administrador
    const adminCount = usuarios.filter(u => u.tipo === 'admin').length;
    if(usuarios[idx].tipo === 'admin' && adminCount <= 1) {
      alert('❌ Não é possível remover o único administrador do sistema!');
      return;
    }
    usuarios.splice(idx,1);
    setUsuarios(usuarios);
    atualizarUsuariosTable();
  }
}

// Funções para foto do usuário
function capturarFoto() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = function(e) {
    processarImagem(e.target.files[0]);
  };
  input.click();
}

function tirarFoto() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function(stream) {
        // Aqui você implementaria a captura da foto
        // Por simplicidade, vamos usar o input file como fallback
        alert('📸 Funcionalidade de câmera direta requer implementação adicional. Use a opção "Carregar Imagem".');
        stream.getTracks().forEach(track => track.stop());
        capturarFoto();
      })
      .catch(function(error) {
        console.error('Erro ao acessar câmera:', error);
        capturarFoto();
      });
  } else {
    capturarFoto();
  }
}

function processarImagem(file) {
  if (!file || !file.type.match('image.*')) {
    alert('❌ Por favor, selecione uma imagem válida.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Redimensionar para 256x256
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 256;
      
      ctx.drawImage(img, 0, 0, 256, 256);
      usuarioFoto = canvas.toDataURL('image/jpeg', 0.8);
      
      document.getElementById('usuarioFotoPreview').src = usuarioFoto;
      document.getElementById('usuarioFotoPreview').style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function visualizarFoto(fotoUrl) {
  document.getElementById('modalFoto').src = fotoUrl;
  document.getElementById('photoModal').classList.add('open');
}

function fecharModal() {
  document.getElementById('photoModal').classList.remove('open');
}

// ========== FUNÇÕES PARA RELATÓRIOS ==========

function atualizarFiltrosRelatorio(){
  atualizarComboFiltroProduto();
  atualizarComboFornecedor();
}

function atualizarRelatorio(){
  let tipo = document.getElementById('relTipo').value;
  let prod = document.getElementById('filtroProduto').value;
  let forn = document.getElementById('filtroFornecedor').value;
  let inicio = document.getElementById('filtroInicio').value;
  let fim = document.getElementById('filtroFim').value;
  
  if(tipo==='estoque') gerarRelatorioEstoque(prod, forn);
  else if(tipo==='vendas') gerarRelatorioVendas(prod, inicio, fim);
  else if(tipo==='compras') gerarRelatorioCompras(prod, forn, inicio, fim);
  else if(tipo==='fornecedores') gerarRelatorioFornecedores();
  else if(tipo==='lucro') gerarRelatorioLucro(inicio, fim);
}

function gerarRelatorioEstoque(produto, fornecedor){
  let data = getEstoque().filter(e=>{
    let ok = true;
    if(produto) ok = ok && e.nome===produto;
    if(fornecedor) ok = ok && e.fornecedor===fornecedor;
    return ok;
  });
  let html = `<h3>📦 Relatório de Estoque ${produto?(" - "+produto):''} ${fornecedor?(" (Fornecedor: "+fornecedor+")"):''}</h3>
    <div class="table-container"><table style="width:100%;margin-bottom:12px;"><thead>
    <tr>
      <th>Produto/Insumo</th><th>Tipo</th><th>Quantidade</th><th>Unidade</th><th>Preço (R$)</th><th>Validade</th><th>Fornecedor</th>
    </tr></thead><tbody>`;
  if(data.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Nenhum item encontrado</td></tr>';
  } else {
    data.forEach(e=>{
      html += `<tr>
        <td><b>${e.nome}</b></td>
        <td>${e.tipo}</td>
        <td>${e.qtd}</td>
        <td>${e.unidade}</td>
        <td>${(+e.preco || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
        <td>${e.validade||'-'}</td>
        <td>${e.fornecedor||'-'}</td>
      </tr>`;
    });
  }
  html += "</tbody></table></div>";
  html += `<div style="background:#f0f0f0;padding:15px;border-radius:8px;margin-top:15px;"><b>📊 Total de itens:</b> ${data.length}</div>`;
  document.getElementById('relatorioContent').innerHTML = html;
}

function gerarRelatorioVendas(produto, inicio, fim){
  let vendas = getVendas();
  if(produto) vendas = vendas.filter(v => v.produto === produto);
  if(inicio) vendas = vendas.filter(v => v.data >= inicio);
  if(fim) vendas = vendas.filter(v => v.data <= fim);
  let total = vendas.reduce((s,v)=>s+Number(v.valor), 0);
  let html = `<h3>💰 Relatório de Vendas ${produto?('- '+produto):''}</h3>
    <div class="table-container"><table style="width:100%;margin-bottom:12px;"><thead>
    <tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Valor (R$)</th><th>Hora</th></tr></thead><tbody>`;
  if(vendas.length === 0) {
    html += '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999;">Nenhuma venda encontrada</td></tr>';
  } else {
    vendas.forEach(v=>{
      html += `<tr>
        <td>${v.data}</td>
        <td><b>${v.produto}</b></td>
        <td>${v.qtd}</td>
        <td><b>${(+v.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b></td>
        <td>${v.hora||'-'}</td>
      </tr>`;
    });
  }
  html += "</tbody></table></div>";
  html += `<div style="background:#e9f8d7;padding:15px;border-radius:8px;margin-top:15px;">
    <p style="margin:5px 0;"><b>📊 Quantidade de vendas:</b> ${vendas.length}</p>
    <p style="margin:5px 0;"><b>💵 Total arrecadado:</b> <span style="color: #4C9A2A;font-size:1.3em;font-weight:bold;">${total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></p>
  </div>`;
  document.getElementById('relatorioContent').innerHTML = html;
}

function gerarRelatorioCompras(produto, fornecedor, inicio, fim){
  let compras = getCompras();
  if(produto) compras = compras.filter(c => c.produto === produto);
  if(fornecedor) compras = compras.filter(c => c.fornecedor === fornecedor);
  if(inicio) compras = compras.filter(c => c.data >= inicio);
  if(fim) compras = compras.filter(c => c.data <= fim);
  let total = compras.reduce((s,c)=>s+Number(c.valorTotal), 0);
  let html = `<h3>🛒 Relatório de Compras</h3>
    <div class="table-container"><table style="width:100%;margin-bottom:12px;"><thead>
    <tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Valor Unitário</th><th>Valor Total</th><th>Fornecedor</th></tr></thead><tbody>`;
  if(compras.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999;">Nenhuma compra encontrada</td></tr>';
  } else {
    compras.forEach(c=>{
      html += `<tr>
        <td>${c.data}</td>
        <td><b>${c.produto}</b></td>
        <td>${c.qtd}</td>
        <td>${(+c.valorUnitario).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
        <td><b>${(+c.valorTotal).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b></td>
        <td>${c.fornecedor||'-'}</td>
      </tr>`;
    });
  }
  html += "</tbody></table></div>";
  html += `<div style="background:#e0f0ff;padding:15px;border-radius:8px;margin-top:15px;">
    <p style="margin:5px 0;"><b>📊 Quantidade de compras:</b> ${compras.length}</p>
    <p style="margin:5px 0;"><b>💵 Total gasto:</b> <span style="color: #1a73e8;font-size:1.3em;font-weight:bold;">${total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></p>
  </div>`;
  document.getElementById('relatorioContent').innerHTML = html;
}

function gerarRelatorioFornecedores(){
  let fornecedores = getFornecedores();
  let html = `<h3>🏢 Relatório de Fornecedores</h3>
    <div class="table-container"><table style="width:100%;margin-bottom:12px;"><thead>
    <tr><th>Nome</th><th>CNPJ</th><th>Telefone</th><th>Email</th><th>Endereço</th><th>Produtos Fornecidos</th></tr></thead><tbody>`;
  if(fornecedores.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999;">Nenhum fornecedor encontrado</td></tr>';
  } else {
    fornecedores.forEach(f=>{
      html += `<tr>
        <td><b>${f.nome}</b></td>
        <td>${f.cnpj||'-'}</td>
        <td>${f.telefone||'-'}</td>
        <td>${f.email||'-'}</td>
        <td>${f.endereco||'-'}</td>
        <td>${f.produtos||'-'}</td>
      </tr>`;
    });
  }
  html += "</tbody></table></div>";
  html += `<div style="background:#f0f0f0;padding:15px;border-radius:8px;margin-top:15px;"><b>📊 Total de fornecedores:</b> ${fornecedores.length}</div>`;
  document.getElementById('relatorioContent').innerHTML = html;
}

function gerarRelatorioLucro(inicio, fim){
  let vendas = getVendas();
  let compras = getCompras();
  
  if(inicio) {
    vendas = vendas.filter(v => v.data >= inicio);
    compras = compras.filter(c => c.data >= inicio);
  }
  if(fim) {
    vendas = vendas.filter(v => v.data <= fim);
    compras = compras.filter(c => c.data <= fim);
  }
  
  let totalVendas = vendas.reduce((s,v)=>s+Number(v.valor), 0);
  let totalCompras = compras.reduce((s,c)=>s+Number(c.valorTotal), 0);
  let lucro = totalVendas - totalCompras;
  
  let html = `<h3>💵 Relatório de Lucro/Prejuízo</h3>
    <div style="background:#f0f0f0;padding:20px;border-radius:12px;margin:20px 0;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;">
        <div style="text-align:center;background:#e9f8d7;padding:15px;border-radius:8px;">
          <h4 style="margin:0 0 10px 0;color:#4C9A2A;">💰 Total de Vendas</h4>
          <div style="font-size:1.8em;font-weight:bold;color:#4C9A2A;">${totalVendas.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
        </div>
        <div style="text-align:center;background:#e0f0ff;padding:15px;border-radius:8px;">
          <h4 style="margin:0 0 10px 0;color:#1a73e8;">🛒 Total de Compras</h4>
          <div style="font-size:1.8em;font-weight:bold;color:#1a73e8;">${totalCompras.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
        </div>
        <div style="text-align:center;background:${lucro >= 0 ? '#e9f8d7' : '#ffd7d7'};padding:15px;border-radius:8px;">
          <h4 style="margin:0 0 10px 0;color:${lucro >= 0 ? '#4C9A2A' : '#d32f2f'};">${lucro >= 0 ? '📈 Lucro' : '📉 Prejuízo'}</h4>
          <div style="font-size:1.8em;font-weight:bold;color:${lucro >= 0 ? '#4C9A2A' : '#d32f2f'};">${lucro.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
        </div>
      </div>
    </div>`;
  
  document.getElementById('relatorioContent').innerHTML = html;
}

// ========== FUNÇÕES PARA DASHBOARD ==========

function atualizarDashboard(){
  // Atualizar estatísticas
  const vendas = getVendas();
  const estoque = getEstoque();
  const compras = getCompras();
  
  // Total de vendas
  const totalVendas = vendas.reduce((s,v)=>s+Number(v.valor), 0);
  document.getElementById('totalVendas').textContent = totalVendas.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  
  // Total de produtos vendidos
  const totalProdutosVendidos = vendas.reduce((s,v)=>s+Number(v.qtd), 0);
  document.getElementById('totalProdutosVendidos').textContent = totalProdutosVendidos;
  
  // Total de itens em estoque
  document.getElementById('totalItensEstoque').textContent = estoque.length;
  
  // Produtos com estoque baixo (menos de 10 unidades)
  const produtosBaixoEstoque = estoque.filter(e => e.qtd < 10).length;
  document.getElementById('produtosBaixoEstoque').textContent = produtosBaixoEstoque;
  
  // Total de compras
  const totalCompras = compras.reduce((s,c)=>s+Number(c.valorTotal), 0);
  document.getElementById('totalCompras').textContent = totalCompras.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  
  // Últimas compras
  const ultimasCompras = compras.slice(-3).reverse();
  let html = '';
  if(ultimasCompras.length === 0) {
    html = '<p style="text-align:center;color:#999;margin:10px 0;">Nenhuma compra recente</p>';
  } else {
    ultimasCompras.forEach(c => {
      html += `<div style="display:flex;justify-content:space-between;margin:8px 0;padding:5px;background:#f5f5f5;border-radius:5px;">
        <span>${c.produto}</span>
        <span><b>${(+c.valorTotal).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b></span>
      </div>`;
    });
  }
  document.getElementById('ultimasCompras').innerHTML = html;
  
  // Atualizar gráfico de produtos mais vendidos
  atualizarGraficoProdutosVendidos();
}

function atualizarGraficoProdutosVendidos(){
  const vendas = getVendas();
  
  // Agrupar vendas por produto
  const produtosVendidos = {};
  vendas.forEach(v => {
    if(produtosVendidos[v.produto]) {
      produtosVendidos[v.produto] += v.qtd;
    } else {
      produtosVendidos[v.produto] = v.qtd;
    }
  });
  
  // Ordenar por quantidade (do maior para o menor)
  const produtosOrdenados = Object.entries(produtosVendidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5 produtos
  
  const labels = produtosOrdenados.map(p => p[0]);
  const data = produtosOrdenados.map(p => p[1]);
  
  const ctx = document.getElementById('chartProdutosVendidos').getContext('2d');
  
  // Destruir gráfico anterior se existir
  if(chartProdutosVendidos) {
    chartProdutosVendidos.destroy();
  }
  
  // Criar novo gráfico
  chartProdutosVendidos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Quantidade Vendida',
        data: data,
        backgroundColor: [
          'rgba(210, 105, 30, 0.7)',
          'rgba(160, 82, 45, 0.7)',
          'rgba(139, 69, 19, 0.7)',
          'rgba(122, 62, 31, 0.7)',
          'rgba(92, 64, 51, 0.7)'
        ],
        borderColor: [
          'rgba(210, 105, 30, 1)',
          'rgba(160, 82, 45, 1)',
          'rgba(139, 69, 19, 1)',
          'rgba(122, 62, 31, 1)',
          'rgba(92, 64, 51, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Top 5 Produtos Mais Vendidos'
        }
      }
    }
  });
}

// ========== FUNÇÕES PARA EXPORTAÇÃO PDF ==========

function exportTableAsPDF(tableId, filename){
  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(16);
  doc.text("Sys Pão - Sistema de Gestão", 11, 14);
  doc.setFontSize(10);
  doc.text("Relatório emitido em: "+(new Date()).toLocaleString('pt-BR'),11,22);
  doc.autoTable({ html: '#'+tableId,
    theme: 'grid',
    headStyles:{fillColor:[210,105,30],textColor:[255,255,255]},
    startY: 30
  });
  doc.save(filename);
}

function exportRelatorioPDF(){
  const sec = document.getElementById('relatorioContent');
  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(16);
  doc.text("Sys Pão - Sistema de Gestão", 11, 14);
  doc.setFontSize(10);
  doc.text("Relatório gerencial emitido em: "+(new Date()).toLocaleString('pt-BR'),11,22);
  doc.setFontSize(11);
  let str = sec.innerText || sec.textContent;
  let lines = doc.splitTextToSize(str, 178);
  doc.text(lines,11,32);
  doc.save('Relatorio_SysPao.pdf');
}

// ========== INICIALIZAÇÃO ==========

// Fechar autocomplete ao clicar fora
document.addEventListener('click', function(e) {
  const autocompleteItems = document.querySelectorAll('.autocomplete-items');
  autocompleteItems.forEach(item => {
    if (e.target !== item && !item.contains(e.target)) {
      item.innerHTML = '';
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  if(window.jspdf && !window.jspdf.jsPDF.API.autoTable) {
    let s = document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
    document.head.appendChild(s);
  }
  
  // Configurar data atual nos formulários
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('vendaData').value = hoje;
  document.getElementById('compraData').value = hoje;
  
  // Configurar eventos para cálculos automáticos
  document.getElementById('vendaQtd')?.addEventListener('input', calcularValorTotalVenda);
  document.getElementById('vendaPrecoUnitario')?.addEventListener('input', calcularValorTotalVenda);
  
  // ADICIONE ESTAS LINHAS:
  // Iniciar atualização da data/hora
  setInterval(atualizarDataHoraFooter, 1000);
  atualizarDataHoraFooter();
  
  // Carregar relatórios salvos
  const relatoriosSalvosStorage = localStorage.getItem('syspao_relatorios');
  if (relatoriosSalvosStorage) {
    relatoriosSalvos = JSON.parse(relatoriosSalvosStorage);
  }
});
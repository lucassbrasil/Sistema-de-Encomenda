const STORAGE_KEY = "controle-encomendas";

const form = document.getElementById("form-encomenda");
const itensBox = document.getElementById("itens");
const lista = document.getElementById("lista");
const totais = {
  itens: document.getElementById("total-itens"),
  extra: document.getElementById("total-extras"),
  geral: document.getElementById("total-geral"),
  qtd: document.getElementById("resumo-qtd"),
  gasto: document.getElementById("resumo-gasto"),
  media: document.getElementById("resumo-media"),
};

function dinheiro(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function texto(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lerEncomendas() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function salvarEncomendas(encomendas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encomendas));
}

function numero(id) {
  return Number(document.getElementById(id).value) || 0;
}

function calcularFormulario() {
  const itens = [...itensBox.querySelectorAll(".item")].map((linha) => {
    const qtd = Number(linha.querySelector(".qtd").value) || 0;
    const preco = Number(linha.querySelector(".preco").value) || 0;
    return qtd * preco;
  });
  const totalItens = itens.reduce((soma, valor) => soma + valor, 0);
  const extras = numero("frete") + numero("taxas") + numero("outros");
  const total = totalItens + extras;

  totais.itens.textContent = dinheiro(totalItens);
  totais.extra.textContent = dinheiro(extras);
  totais.geral.textContent = dinheiro(total);

  return { totalItens, extras, total };
}

function novaLinhaItem(item = { nome: "", qtd: 1, preco: "" }) {
  const linha = document.createElement("div");
  linha.className = "item";
  linha.innerHTML = `
    <div>
      <label>Item</label>
      <input class="nome" placeholder="Ex.: caixa, produto, material" value="${item.nome}">
    </div>
    <div>
      <label>Qtd</label>
      <input class="qtd" type="number" min="1" step="1" value="${item.qtd}">
    </div>
    <div>
      <label>Preço unitário (R$)</label>
      <input class="preco" type="number" min="0" step="0.01" value="${item.preco}">
    </div>
    <button type="button" class="remove" aria-label="Remover item">x</button>
  `;
  linha.querySelector(".remove").onclick = () => {
    if (itensBox.children.length > 1) linha.remove();
    calcularFormulario();
  };
  linha.querySelectorAll("input").forEach((campo) => {
    campo.addEventListener("input", calcularFormulario);
  });
  itensBox.appendChild(linha);
}

function renderizarLista() {
  const encomendas = lerEncomendas();
  const gasto = encomendas.reduce((soma, item) => soma + item.total, 0);

  totais.qtd.textContent = encomendas.length;
  totais.gasto.textContent = dinheiro(gasto);
  totais.media.textContent = dinheiro(encomendas.length ? gasto / encomendas.length : 0);

  if (!encomendas.length) {
    lista.innerHTML = `<p class="empty">Nenhuma encomenda cadastrada ainda.</p>`;
    return;
  }

  lista.innerHTML = encomendas
    .map(
      (encomenda) => `
      <article class="order">
        <header>
          <div>
            <h3>${texto(encomenda.cliente)}</h3>
            <small>${texto(new Date(encomenda.data + "T00:00:00").toLocaleDateString("pt-BR"))} · ${encomenda.itens.length} item(ns)</small>
          </div>
          <span class="badge">${texto(encomenda.status)}</span>
        </header>
        <p>${texto(encomenda.descricao || "Sem descrição")}</p>
        <p><strong>${dinheiro(encomenda.total)}</strong> · itens ${dinheiro(encomenda.totalItens)} + extras ${dinheiro(encomenda.extras)}</p>
        <button type="button" class="remove" data-id="${encomenda.id}">Excluir</button>
      </article>
    `
    )
    .join("");

  lista.querySelectorAll("[data-id]").forEach((botao) => {
    botao.onclick = () => {
      const restantes = lerEncomendas().filter((item) => item.id !== botao.dataset.id);
      salvarEncomendas(restantes);
      renderizarLista();
    };
  });
}

form.addEventListener("input", calcularFormulario);

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const { totalItens, extras, total } = calcularFormulario();
  const itens = [...itensBox.querySelectorAll(".item")]
    .map((linha) => ({
      nome: linha.querySelector(".nome").value.trim(),
      qtd: Number(linha.querySelector(".qtd").value) || 0,
      preco: Number(linha.querySelector(".preco").value) || 0,
    }))
    .filter((item) => item.nome && item.qtd > 0);

  if (!itens.length) {
    alert("Adicione pelo menos um item com nome e quantidade.");
    return;
  }

  const encomenda = {
    id: String(Date.now()),
    cliente: document.getElementById("cliente").value.trim(),
    data: document.getElementById("data").value,
    status: document.getElementById("status").value,
    descricao: document.getElementById("descricao").value.trim(),
    frete: numero("frete"),
    taxas: numero("taxas"),
    outros: numero("outros"),
    itens,
    totalItens,
    extras,
    total,
  };

  const encomendas = lerEncomendas();
  encomendas.unshift(encomenda);
  salvarEncomendas(encomendas);
  form.reset();
  itensBox.innerHTML = "";
  novaLinhaItem();
  document.getElementById("data").value = new Date().toISOString().slice(0, 10);
  calcularFormulario();
  renderizarLista();
});

document.getElementById("add-item").onclick = () => novaLinhaItem();

novaLinhaItem();
document.getElementById("data").value = new Date().toISOString().slice(0, 10);
calcularFormulario();
renderizarLista();

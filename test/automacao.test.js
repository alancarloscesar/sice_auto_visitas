import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import puppeteer from 'puppeteer';
import { criarAutomacao } from '../src/automacao.js';

test('sincroniza AJAX, opções dependentes, atividades e erros sem pausas fixas', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/lento' || req.url === '/erro') {
      setTimeout(() => { res.writeHead(req.url === '/erro' ? 500 : 200); res.end('ok'); }, 250);
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<button id="novo" onclick="requisitar('/lento', () => { const form=document.createElement('form'); form.id='formCadastro'; form.innerHTML='<select id=ano><option value=2026>2026</option></select>'; document.body.append(form); })">Novo</button>
      <div id="bloqueio" style="position:fixed;inset:0;z-index:999;background:white">Carregando</div>
      <select id="aluno" onchange="carregar()"><option value="">Escolha</option><option value="1">Aluno</option></select>
      <select id="empresa"><option value="">Escolha</option></select>
      <input id="radio" type="checkbox"><button id="erro" onclick="requisitar('/erro',()=>{})">Erro</button>
      <div class="ui-messages-info">Atividade salva com sucesso</div>
      <button id="salvar" onclick="requisitar('/lento', () => { if(window.confirmar) document.querySelector('.ui-messages-info').textContent='Visita cadastrada com sucesso'; })">Salvar</button>
      <button id="j_idt253" onclick="document.querySelector('#dialogo').style.display='block'">Abrir</button>
      <div id="dialogo" style="display:none"><textarea id="atvdSug"></textarea><select id="respSug"><option value="RCA">RCA</option></select>
      <button id="j_idt260" onclick="adicionar()">Adicionar</button></div><table><tbody id="atividades"></tbody></table>
      <script>
      window.addEventListener('load', () => setTimeout(() => document.querySelector('#bloqueio').remove(), 500));
      function requisitar(url, callback) { const xhr = new XMLHttpRequest(); xhr.open('GET', url); xhr.onload=callback; xhr.send(); }
      function carregar() { requisitar('/lento', () => { document.querySelector('#empresa').innerHTML='<option value="2">Empresa</option>'; }); }
      function adicionar() { requisitar('/lento', () => {
        if (window.recusarAtividade) return;
        const td=document.createElement('td');
        td.textContent=document.querySelector('#atvdSug').value.toUpperCase().normalize('NFD').replaceAll(' ', '\\u00a0  ');
        const tr=document.createElement('tr'); tr.append(td); document.querySelector('#atividades').append(tr);
        document.querySelector('#atvdSug').value='';
        document.querySelector('#respSug').selectedIndex=-1;
        if (!window.manterAtividadesAbertas) document.querySelector('#dialogo').style.display='none';
      }); }
      </script>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const auto = await criarAutomacao(page, 3000);
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    for (const valor of [null, undefined, '', '   ']) {
      await assert.rejects(auto.selecionar('#campo-inexistente', valor), /Valor não informado/);
    }
    await auto.abrirCadastro();
    await auto.selecionar('#ano', '2026');
    await auto.selecionar('#aluno', '1');
    await page.evaluate(() => {
      const campo = document.createElement('select');
      campo.id = 'lstAlunos';
      campo.innerHTML = '<option value="2676088">MARIA ELIZA CAETANO SABINO</option><option value="3277548">MARIA GISELE PARENTE LIMA</option>';
      document.body.append(campo);
    });
    await assert.rejects(auto.selecionarAluno(2676088, 'MARIA GISELE PARENTE LIMA'), /selecionou "MARIA ELIZA/);
    await auto.selecionarAluno(3277548, 'Maria Gisele Parente Lima');
    assert.equal(await page.$eval('#empresa', el => el.options[0].value), '2');
    await auto.selecionar('#empresa', '2');
    await assert.rejects(auto.selecionar('#empresa', '34874', { opcoesCarregadas: true }), /34874.*não está disponível.*2 — Empresa/);
    assert.equal(await page.$eval('#empresa', el => el.value), '2');
    await auto.marcar('#radio');
    await auto.marcar('#radio');
    assert.equal(await page.$eval('#radio', el => el.checked), true);
    await auto.atividadeExtra('Primeira atividade');
    await page.evaluate(() => { window.manterAtividadesAbertas = true; });
    await auto.atividadeExtra('Segunda atividade');
    const textoQueFalhou = 'Desenvolve atividades para prospectar possíveis clientes através das redes sociais da concedente.';
    await auto.atividadeExtra(textoQueFalhou);
    assert.deepEqual(await page.$$eval('#atividades td', els => els.map(el => el.textContent.normalize('NFC').replace(/\s+/gu, ' ').trim())),
      ['PRIMEIRA ATIVIDADE', 'SEGUNDA ATIVIDADE', textoQueFalhou.toUpperCase()]);
    // Uma linha antiga não pode confirmar uma tentativa rejeitada pelo portal.
    await page.evaluate(() => { window.recusarAtividade = true; });
    await assert.rejects(auto.atividadeExtra(textoQueFalhou), /3000ms exceeded/);
    assert.equal(await page.$$eval('#atividades tr', els => els.length), 3);
    await assert.rejects(auto.selecionar('#empresa', 'inexistente'), error => {
      assert.match(error.message, /selecionar #empresa/);
      assert.match(error.message, /valor esperado: inexistente/);
      assert.match(error.message, /"opcoes":\["2"\]/);
      return true;
    });
    await assert.rejects(auto.salvar(), /3000ms exceeded/);
    await page.evaluate(() => { window.confirmar = true; });
    await auto.salvar();
    await page.evaluate(() => {
      const aviso = document.createElement('div');
      aviso.id = 'ErrorAjax';
      aviso.textContent = 'Sessão expirada. Identifique-se novamente.';
      document.body.append(aviso);
    });
    await assert.rejects(auto.selecionar('#empresa', '2'), /Sessão expirada/);
    await page.evaluate(() => document.querySelector('#ErrorAjax').remove());
    await assert.rejects(auto.clicar('#erro', true), /HTTP 500/);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});

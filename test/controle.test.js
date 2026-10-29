import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { dataISO, chaveVisita, planejar, executarLote, lerHistorico, relatorio, bloquearExecucao } from '../src/controle.js';
import { preencherAtividades } from '../src/atividades.js';

const aluno = (id, data = '2026-10-15') => ({ nome: `Aluno ${id}`, value_aluno: id, value_concedente: 10, ativo: 1, data_visita: data });

test('datas vazias, inválidas, mudança de mês e ano', () => {
  assert.equal(dataISO(null), null);
  assert.equal(dataISO('  '), null);
  assert.equal(dataISO('15/01/2027'), '2027-01-15');
  assert.equal(dataISO(new Date('2026-10-15T00:00:00Z')), '2026-10-15');
  assert.throws(() => dataISO('31/02/2026'), /inválida/);
  const historico = { visitas: { '1|2026-09-15': { status: 'informado_usuario' } } };
  const itens = planejar([aluno(1, '2026-09-15'), aluno(2, null), aluno(3, '31/02/2026')], historico);
  assert.deepEqual(itens.map(i => i.status), ['ja_registrado', 'sem_data', 'erro']);
  assert.equal(planejar([aluno(1)], historico)[0].status, 'aguardando');
  assert.equal(planejar([aluno(2, '2027-01-15')], historico)[0].status, 'aguardando');
});

test('identificador duplicado não permite cadastro de outra pessoa', () => {
  const itens = planejar([aluno(1), { ...aluno(1), nome: 'Outra pessoa', ativo: 0 }], { visitas: {} });
  assert.equal(itens.find(i => i.nome === 'Aluno 1').status, 'erro');
});

test('lote continua após erro, persiste sucesso e bloqueia repetição ambígua', async () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'sice-controle-'));
  try {
    const arquivo = path.join(pasta, 'historico.json');
    const historico = { versao: 1, visitas: {} };
    const itens = planejar([aluno(1), aluno(2), aluno(3), aluno(4, null)], historico);
    await executarLote(itens, historico, arquivo, async (item, antesDoClique) => {
      if (item.aluno.value_aluno === 1) throw new Error('Concedente inexistente');
      antesDoClique();
      // A tentativa deve estar em disco ANTES do possível envio ao portal.
      assert.equal(lerHistorico(arquivo).visitas[chaveVisita(item.aluno, item.data)].status, 'em_confirmacao');
      if (item.aluno.value_aluno === 2) throw new Error('Resposta perdida após salvar');
    });
    assert.deepEqual(itens.map(i => i.status), ['erro', 'conferir', 'concluido', 'sem_data']);
    const nova = planejar([aluno(1), aluno(2), aluno(3), aluno(4, null)], lerHistorico(arquivo));
    assert.deepEqual(nova.map(i => i.status), ['aguardando', 'conferir', 'ja_registrado', 'sem_data']);
    relatorio(itens, pasta);
    assert.equal(JSON.parse(fs.readFileSync(path.join(pasta, 'ultima-execucao.json'))).length, 4);
    const liberar = bloquearExecucao(path.join(pasta, 'execucao.lock'));
    assert.throws(() => bloquearExecucao(path.join(pasta, 'execucao.lock')), /Já existe/);
    liberar();
  } finally {
    // Diretório exclusivo criado pelo teste no temporário do sistema.
    for (const arquivo of fs.readdirSync(pasta)) fs.unlinkSync(path.join(pasta, arquivo));
    fs.rmdirSync(pasta);
  }
});

test('sessão expirada deixa os restantes como não processados', async () => {
  const itens = planejar([aluno(1), aluno(2)], { visitas: {} });
  await executarLote(itens, { visitas: {} }, 'nao-usado.json', async () => { throw new Error('Sessão expirada'); });
  assert.deepEqual(itens.map(i => i.status), ['erro', 'aguardando']);
});

test('regras de Gráfica Tavares reconhecem a caixa usada na planilha', async () => {
  const marcados = [];
  await preencherAtividades({ marcar: async s => marcados.push(s) }, { concedente: 'GRÁFICA TAVARES' });
  assert(marcados.some(s => s.includes('atividade:161:')));
});

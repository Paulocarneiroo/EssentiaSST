import { empresaService } from '../../services/empresaService.js';
import { formatCnpj, formatDate } from '../../services/format.js';
import { LABEL_GRAU_RISCO } from '../../services/labels.js';
import { isAdmin } from '../../state/session.js';
import type { Empresa } from '../../types/empresa.js';
import { alertBox, badge, card, definitionList, pageHeader } from '../components.js';
import { bindAction } from '../forms.js';
import { readNumber, readString, selectField, textField } from '../formFields.js';
import { esc } from '../html.js';
import { openFormModal } from '../modal.js';
import { showToast } from '../toast.js';

const OPCOES_GRAU_RISCO = [1, 2, 3, 4].map((grau) => ({
  value: grau,
  label: LABEL_GRAU_RISCO[grau],
}));

const camposEmpresa = (empresa: Empresa): string => `
  ${textField({ name: 'cnpj', label: 'CNPJ', col: 6, required: true, maxlength: 18, value: formatCnpj(empresa.cnpj) })}
  ${selectField({ name: 'grauRisco', label: 'Grau de risco (NR-04)', col: 6, required: true, options: OPCOES_GRAU_RISCO, value: empresa.grauRisco })}
  ${textField({ name: 'razaoSocial', label: 'Razão social', col: 12, required: true, value: empresa.razaoSocial })}
  ${textField({ name: 'nomeFantasia', label: 'Nome fantasia', col: 6, required: true, value: empresa.nomeFantasia })}
  ${textField({ name: 'cnae', label: 'CNAE', col: 6, required: true, maxlength: 10, value: empresa.cnae })}
`;

export const renderEmpresaView = async (root: HTMLElement): Promise<void> => {
  const desenhar = async (): Promise<void> => {
    const empresa = await empresaService.minhaEmpresa();

    root.innerHTML = `
      ${pageHeader({
        titulo: 'Dados da empresa',
        subtitulo: 'Cadastro fiscal e de risco que contextualiza toda a operação de SST da conta.',
        acoes: isAdmin()
          ? '<button type="button" class="btn btn-primary" data-action="editar">Editar dados</button>'
          : '',
      })}

      <div class="row g-4">
        <div class="col-lg-7">
          ${card(`
            <h2 class="h6 mb-3">Identificação</h2>
            ${definitionList([
              { termo: 'Razão social', valor: esc(empresa.razaoSocial) },
              { termo: 'Nome fantasia', valor: esc(empresa.nomeFantasia) },
              { termo: 'CNPJ', valor: esc(formatCnpj(empresa.cnpj)) },
              { termo: 'CNAE', valor: esc(empresa.cnae) },
              {
                termo: 'Grau de risco (NR-04)',
                valor: badge(
                  LABEL_GRAU_RISCO[empresa.grauRisco] ?? String(empresa.grauRisco),
                  empresa.grauRisco >= 3 ? 'warning' : 'secondary',
                ),
              },
              { termo: 'Cadastrada em', valor: esc(formatDate(empresa.createdAt)) },
            ])}
          `)}
        </div>

        <div class="col-lg-5">
          ${card(`
            <h2 class="h6 mb-3">O que o grau de risco define</h2>
            <p class="text-muted small mb-3">
              O grau de risco da NR-04 determina a periodicidade do exame periódico na avaliação
              de aptidão: 24 meses nos graus 1 e 2, e 12 meses nos graus 3 e 4 — reduzida a 12 meses
              também para menores de 18, maiores de 45 anos e trabalhadores com restrição.
            </p>
            ${alertBox(
              'Os dados desta conta são visíveis apenas a usuários desta empresa. Recursos de outros clientes da plataforma não são acessíveis nem retornados nas listagens.',
              'info',
            )}
          `)}
        </div>
      </div>
    `;

    bindAction(root, 'editar', () => {
      openFormModal({
        titulo: 'Editar dados da empresa',
        campos: camposEmpresa(empresa),
        confirmLabel: 'Salvar alterações',
        onConfirm: async (form) => {
          await empresaService.atualizar({
            cnpj: readString(form, 'cnpj'),
            razaoSocial: readString(form, 'razaoSocial'),
            nomeFantasia: readString(form, 'nomeFantasia'),
            cnae: readString(form, 'cnae'),
            grauRisco: readNumber(form, 'grauRisco'),
          });
          showToast('Dados da empresa atualizados.');
          await desenhar();
        },
      });
    });
  };

  await desenhar();
};

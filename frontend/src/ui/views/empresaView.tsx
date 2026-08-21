import { useCallback, useEffect, useState } from 'react';
import { empresaService } from '../../services/empresaService';
import { formatCnpj, formatDate } from '../../services/format';
import { LABEL_GRAU_RISCO } from '../../services/labels';
import { isAdmin } from '../../state/session';
import type { Empresa } from '../../types/empresa';
import {
  AlertBox,
  Badge,
  Card,
  DefinitionList,
  Loading,
  PageError,
  PageHeader,
  useDocumentTitle,
} from '../components';
import { readNumber, readString, SelectField, TextField } from '../formFields';
import { openFormModal } from '../modal';
import { showToast } from '../toast';

const OPCOES_GRAU_RISCO = [1, 2, 3, 4].map((grau) => ({
  value: grau,
  label: LABEL_GRAU_RISCO[grau],
}));

const CamposEmpresa = ({ empresa }: { empresa: Empresa }) => (
  <>
    <TextField
      name="cnpj"
      label="CNPJ"
      col={6}
      required
      maxlength={18}
      value={formatCnpj(empresa.cnpj)}
    />
    <SelectField
      name="grauRisco"
      label="Grau de risco (NR-04)"
      col={6}
      required
      options={OPCOES_GRAU_RISCO}
      value={empresa.grauRisco}
    />
    <TextField name="razaoSocial" label="Razão social" col={12} required value={empresa.razaoSocial} />
    <TextField name="nomeFantasia" label="Nome fantasia" col={6} required value={empresa.nomeFantasia} />
    <TextField name="cnae" label="CNAE" col={6} required maxlength={10} value={empresa.cnae} />
  </>
);

export const EmpresaPage = () => {
  useDocumentTitle('Empresa');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<void> => {
    setEmpresa(await empresaService.minhaEmpresa());
  }, []);

  useEffect(() => {
    let ativo = true;
    void recarregar().catch((error: unknown) => {
      if (!ativo) return;
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar esta página.');
    });
    return () => {
      ativo = false;
    };
  }, [recarregar]);

  if (erro) return <PageError titulo="Empresa" mensagem={erro} />;
  if (!empresa) return <Loading />;

  return (
    <>
      <PageHeader
        titulo="Dados da empresa"
        subtitulo="Cadastro fiscal e de risco que contextualiza toda a operação de SST da conta."
        acoes={
          isAdmin() ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                openFormModal({
                  titulo: 'Editar dados da empresa',
                  campos: <CamposEmpresa empresa={empresa} />,
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
                    await recarregar();
                  },
                })
              }
            >
              Editar dados
            </button>
          ) : null
        }
      />

      <div className="row g-4">
        <div className="col-lg-7">
          <Card>
            <h2 className="h6 mb-3">Identificação</h2>
            <DefinitionList
              itens={[
                { termo: 'Razão social', valor: empresa.razaoSocial },
                { termo: 'Nome fantasia', valor: empresa.nomeFantasia },
                { termo: 'CNPJ', valor: formatCnpj(empresa.cnpj) },
                { termo: 'CNAE', valor: empresa.cnae },
                {
                  termo: 'Grau de risco (NR-04)',
                  valor: (
                    <Badge
                      label={LABEL_GRAU_RISCO[empresa.grauRisco] ?? String(empresa.grauRisco)}
                      variant={empresa.grauRisco >= 3 ? 'warning' : 'secondary'}
                    />
                  ),
                },
                { termo: 'Cadastrada em', valor: formatDate(empresa.createdAt) },
              ]}
            />
          </Card>
        </div>

        <div className="col-lg-5">
          <Card>
            <h2 className="h6 mb-3">O que o grau de risco define</h2>
            <p className="text-muted small mb-3">
              O grau de risco da NR-04 determina a periodicidade do exame periódico na avaliação de
              aptidão: 24 meses nos graus 1 e 2, e 12 meses nos graus 3 e 4 — reduzida a 12 meses também
              para menores de 18, maiores de 45 anos e trabalhadores com restrição.
            </p>
            <AlertBox
              mensagem="Os dados desta conta são visíveis apenas a usuários desta empresa. Recursos de outros clientes da plataforma não são acessíveis nem retornados nas listagens."
              variant="info"
            />
          </Card>
        </div>
      </div>
    </>
  );
};

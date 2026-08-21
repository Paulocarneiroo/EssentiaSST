import { authService } from '../../services/authService';
import { LABEL_PAPEL, opcoesDe } from '../../services/labels';
import { getEmpresaId, getUsuario } from '../../state/session';
import { PAPEIS } from '../../types/usuario';
import { AlertBox, Card, DefinitionList, PageHeader, useDocumentTitle } from '../components';
import { readString, SelectField, TextField } from '../formFields';
import { useFormSubmit } from '../forms';
import { showToast } from '../toast';

export const UsuarioPage = () => {
  useDocumentTitle('Usuários');
  const usuario = getUsuario();
  const { onSubmit, busy, erro, carregando } = useFormSubmit(
    async (formulario) => {
      const criado = await authService.registrarUsuario({
        empresaId: getEmpresaId() ?? '',
        nome: readString(formulario, 'nome'),
        email: readString(formulario, 'email'),
        senha: readString(formulario, 'senha'),
        papel: readString(formulario, 'papel') as 'ADMIN' | 'OPERADOR',
      });
      showToast(`Usuário ${criado.nome} registrado como ${LABEL_PAPEL[criado.papel]}.`);
      formulario.reset();
    },
    {
      carregando: 'Registrando...',
      erroPadrao: 'Não foi possível registrar o usuário.',
      erroInline: true,
    },
  );

  return (
    <>
      <PageHeader
        titulo="Usuários"
        subtitulo="Dê acesso à sua equipe com identidade própria e papel definido."
      />

      <div className="row g-4">
        <div className="col-lg-7">
          <Card>
            <h2 className="h6 mb-3">Registrar novo usuário</h2>
            <form className="row g-3" noValidate onSubmit={(event) => void onSubmit(event)}>
              <div className={`alert alert-danger col-12 mb-0${erro ? '' : ' d-none'}`} role="alert">
                {erro}
              </div>
              <TextField name="nome" label="Nome completo" col={12} required />
              <TextField name="email" label="E-mail" type="email" col={6} required />
              <TextField
                name="senha"
                label="Senha provisória"
                type="password"
                col={6}
                required
                help="Mínimo de 6 caracteres. A senha é armazenada apenas como hash."
              />
              <SelectField
                name="papel"
                label="Papel"
                col={6}
                required
                options={opcoesDe(PAPEIS, LABEL_PAPEL)}
                value="OPERADOR"
                help="Operador executa as rotinas; administrador também transmite ao eSocial e exclui registros."
              />
              <div className="col-12">
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      {carregando}
                    </>
                  ) : (
                    'Registrar usuário'
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="col-lg-5">
          <Card>
            <h2 className="h6 mb-3">Sua identidade</h2>
            <DefinitionList
              itens={[
                { termo: 'Nome', valor: usuario?.nome ?? '—' },
                { termo: 'E-mail', valor: usuario?.email ?? '—' },
                { termo: 'Papel', valor: usuario ? LABEL_PAPEL[usuario.papel] : '—' },
              ]}
            />
            <hr />
            <AlertBox
              mensagem="O usuário registrado aqui nasce sempre vinculado à sua empresa. Ações restritas ao papel de administrador são recusadas pela API quando executadas por um operador."
              variant="info"
            />
          </Card>
        </div>
      </div>
    </>
  );
};

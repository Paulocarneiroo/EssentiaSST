import { authService } from '../../services/authService.js';
import { LABEL_PAPEL, opcoesDe } from '../../services/labels.js';
import { getEmpresaId, getUsuario } from '../../state/session.js';
import { PAPEIS } from '../../types/usuario.js';
import { alertBox, card, definitionList, pageHeader } from '../components.js';
import { bindSubmit } from '../forms.js';
import { readString, selectField, textField } from '../formFields.js';
import { esc } from '../html.js';
import { showToast } from '../toast.js';

/**
 * H2.1 — registro de usuários da equipe. A API não expõe listagem de usuários,
 * então a tela cobre o cadastro e a identidade do próprio usuário autenticado.
 */
export const renderUsuarioView = (root: HTMLElement): void => {
  const usuario = getUsuario();

  root.innerHTML = `
    ${pageHeader({
      titulo: 'Usuários',
      subtitulo: 'Dê acesso à sua equipe com identidade própria e papel definido.',
    })}

    <div class="row g-4">
      <div class="col-lg-7">
        ${card(`
          <h2 class="h6 mb-3">Registrar novo usuário</h2>
          <form id="form-usuario" class="row g-3" novalidate>
            <div class="alert alert-danger d-none col-12 mb-0" role="alert" data-role="erro"></div>
            ${textField({ name: 'nome', label: 'Nome completo', col: 12, required: true })}
            ${textField({ name: 'email', label: 'E-mail', type: 'email', col: 6, required: true })}
            ${textField({ name: 'senha', label: 'Senha provisória', type: 'password', col: 6, required: true, help: 'Mínimo de 6 caracteres. A senha é armazenada apenas como hash.' })}
            ${selectField({
              name: 'papel',
              label: 'Papel',
              col: 6,
              required: true,
              options: opcoesDe(PAPEIS, LABEL_PAPEL),
              value: 'OPERADOR',
              help: 'Operador executa as rotinas; administrador também transmite ao eSocial e exclui registros.',
            })}
            <div class="col-12">
              <button type="submit" class="btn btn-primary">Registrar usuário</button>
            </div>
          </form>
        `)}
      </div>

      <div class="col-lg-5">
        ${card(`
          <h2 class="h6 mb-3">Sua identidade</h2>
          ${definitionList([
            { termo: 'Nome', valor: esc(usuario?.nome ?? '—') },
            { termo: 'E-mail', valor: esc(usuario?.email ?? '—') },
            { termo: 'Papel', valor: esc(usuario ? LABEL_PAPEL[usuario.papel] : '—') },
          ])}
          <hr />
          ${alertBox(
            'O usuário registrado aqui nasce sempre vinculado à sua empresa. Ações restritas ao papel de administrador são recusadas pela API quando executadas por um operador.',
            'info',
          )}
        `)}
      </div>
    </div>
  `;

  const form = root.querySelector('#form-usuario') as HTMLFormElement;
  bindSubmit(
    form,
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
};

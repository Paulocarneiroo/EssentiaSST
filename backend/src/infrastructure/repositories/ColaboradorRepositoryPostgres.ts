import type {
  Colaborador,
  CreateColaboradorData,
  UpdateColaboradorData,
} from '../../domain/entities/Colaborador.js';
import type { IColaboradorRepository } from '../../application/ports/IColaboradorRepository.js';
import { query } from '../../database/pool.js';

interface ColaboradorRow {
  id: string;
  empresa_id: string;
  cpf: string;
  nome: string;
  data_nascimento: Date;
  cargo: string;
  data_admissao: Date;
  data_demissao: Date | null;
  created_at: Date;
  updated_at: Date;
}

const mapRow = (row: ColaboradorRow): Colaborador => ({
  id: row.id,
  empresaId: row.empresa_id,
  cpf: row.cpf,
  nome: row.nome,
  dataNascimento: row.data_nascimento,
  cargo: row.cargo,
  dataAdmissao: row.data_admissao,
  dataDemissao: row.data_demissao,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const SELECT_COLUMNS = `id, empresa_id, cpf, nome, data_nascimento, cargo,
  data_admissao, data_demissao, created_at, updated_at`;

export class ColaboradorRepositoryPostgres implements IColaboradorRepository {
  async findAll(empresaId?: string): Promise<Colaborador[]> {
    if (empresaId) {
      const { rows } = await query<ColaboradorRow>(
        `SELECT ${SELECT_COLUMNS} FROM colaboradores WHERE empresa_id = $1 ORDER BY nome`,
        [empresaId],
      );
      return rows.map(mapRow);
    }

    const { rows } = await query<ColaboradorRow>(
      `SELECT ${SELECT_COLUMNS} FROM colaboradores ORDER BY nome`,
    );
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Colaborador | null> {
    const { rows } = await query<ColaboradorRow>(
      `SELECT ${SELECT_COLUMNS} FROM colaboradores WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByCpfAndEmpresa(cpf: string, empresaId: string): Promise<Colaborador | null> {
    const { rows } = await query<ColaboradorRow>(
      `SELECT ${SELECT_COLUMNS} FROM colaboradores WHERE cpf = $1 AND empresa_id = $2`,
      [cpf, empresaId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: CreateColaboradorData): Promise<Colaborador> {
    const { rows } = await query<ColaboradorRow>(
      `INSERT INTO colaboradores (
         empresa_id, cpf, nome, data_nascimento, cargo, data_admissao, data_demissao
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${SELECT_COLUMNS}`,
      [
        data.empresaId,
        data.cpf,
        data.nome,
        data.dataNascimento,
        data.cargo,
        data.dataAdmissao,
        data.dataDemissao ?? null,
      ],
    );
    const row = rows[0];
    if (!row) {
      throw new Error('Falha ao criar colaborador.');
    }
    return mapRow(row);
  }

  async update(id: string, data: UpdateColaboradorData): Promise<Colaborador | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (data.empresaId !== undefined) {
      fields.push(`empresa_id = $${index++}`);
      values.push(data.empresaId);
    }
    if (data.cpf !== undefined) {
      fields.push(`cpf = $${index++}`);
      values.push(data.cpf);
    }
    if (data.nome !== undefined) {
      fields.push(`nome = $${index++}`);
      values.push(data.nome);
    }
    if (data.dataNascimento !== undefined) {
      fields.push(`data_nascimento = $${index++}`);
      values.push(data.dataNascimento);
    }
    if (data.cargo !== undefined) {
      fields.push(`cargo = $${index++}`);
      values.push(data.cargo);
    }
    if (data.dataAdmissao !== undefined) {
      fields.push(`data_admissao = $${index++}`);
      values.push(data.dataAdmissao);
    }
    if (data.dataDemissao !== undefined) {
      fields.push(`data_demissao = $${index++}`);
      values.push(data.dataDemissao);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await query<ColaboradorRow>(
      `UPDATE colaboradores SET ${fields.join(', ')}
       WHERE id = $${index}
       RETURNING ${SELECT_COLUMNS}`,
      values,
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM colaboradores WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}

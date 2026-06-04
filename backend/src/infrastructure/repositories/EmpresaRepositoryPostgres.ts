import type { CreateEmpresaData, Empresa, UpdateEmpresaData } from '../../domain/entities/Empresa.js';
import type { IEmpresaRepository } from '../../application/ports/IEmpresaRepository.js';
import { query } from '../../database/pool.js';

interface EmpresaRow {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cnae: string;
  grau_risco: number;
  created_at: Date;
  updated_at: Date;
}

const mapRow = (row: EmpresaRow): Empresa => ({
  id: row.id,
  cnpj: row.cnpj,
  razaoSocial: row.razao_social,
  nomeFantasia: row.nome_fantasia,
  cnae: row.cnae,
  grauRisco: row.grau_risco,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class EmpresaRepositoryPostgres implements IEmpresaRepository {
  async findAll(): Promise<Empresa[]> {
    const { rows } = await query<EmpresaRow>(
      `SELECT id, cnpj, razao_social, nome_fantasia, cnae, grau_risco, created_at, updated_at
       FROM empresas ORDER BY razao_social`,
    );
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Empresa | null> {
    const { rows } = await query<EmpresaRow>(
      `SELECT id, cnpj, razao_social, nome_fantasia, cnae, grau_risco, created_at, updated_at
       FROM empresas WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByCnpj(cnpj: string): Promise<Empresa | null> {
    const { rows } = await query<EmpresaRow>(
      `SELECT id, cnpj, razao_social, nome_fantasia, cnae, grau_risco, created_at, updated_at
       FROM empresas WHERE cnpj = $1`,
      [cnpj],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: CreateEmpresaData): Promise<Empresa> {
    const { rows } = await query<EmpresaRow>(
      `INSERT INTO empresas (cnpj, razao_social, nome_fantasia, cnae, grau_risco)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, cnpj, razao_social, nome_fantasia, cnae, grau_risco, created_at, updated_at`,
      [data.cnpj, data.razaoSocial, data.nomeFantasia, data.cnae, data.grauRisco],
    );
    const row = rows[0];
    if (!row) {
      throw new Error('Falha ao criar empresa.');
    }
    return mapRow(row);
  }

  async update(id: string, data: UpdateEmpresaData): Promise<Empresa | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (data.cnpj !== undefined) {
      fields.push(`cnpj = $${index++}`);
      values.push(data.cnpj);
    }
    if (data.razaoSocial !== undefined) {
      fields.push(`razao_social = $${index++}`);
      values.push(data.razaoSocial);
    }
    if (data.nomeFantasia !== undefined) {
      fields.push(`nome_fantasia = $${index++}`);
      values.push(data.nomeFantasia);
    }
    if (data.cnae !== undefined) {
      fields.push(`cnae = $${index++}`);
      values.push(data.cnae);
    }
    if (data.grauRisco !== undefined) {
      fields.push(`grau_risco = $${index++}`);
      values.push(data.grauRisco);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await query<EmpresaRow>(
      `UPDATE empresas SET ${fields.join(', ')}
       WHERE id = $${index}
       RETURNING id, cnpj, razao_social, nome_fantasia, cnae, grau_risco, created_at, updated_at`,
      values,
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM empresas WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}

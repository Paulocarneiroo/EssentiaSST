import type { Usuario as UsuarioModel } from '@prisma/client';
import type { CreateUsuarioData, Usuario } from '../../domain/entities/Usuario.js';
import type { IUsuarioRepository } from '../../application/ports/IUsuarioRepository.js';
import { prisma } from '../database/prisma.js';

const toUsuario = (row: UsuarioModel): Usuario => ({
  id: row.id,
  empresaId: row.empresaId,
  nome: row.nome,
  email: row.email,
  senhaHash: row.senhaHash,
  papel: row.papel,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class UsuarioRepositoryPrisma implements IUsuarioRepository {
  async findById(id: string): Promise<Usuario | null> {
    const row = await prisma.usuario.findUnique({ where: { id } });
    return row ? toUsuario(row) : null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const row = await prisma.usuario.findUnique({ where: { email } });
    return row ? toUsuario(row) : null;
  }

  async create(data: CreateUsuarioData): Promise<Usuario> {
    const row = await prisma.usuario.create({
      data: {
        empresaId: data.empresaId,
        nome: data.nome,
        email: data.email,
        senhaHash: data.senhaHash,
        papel: data.papel,
      },
    });
    return toUsuario(row);
  }
}

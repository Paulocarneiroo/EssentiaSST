import type { CreateUsuarioData, Usuario } from '../../domain/entities/Usuario.js';

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  create(data: CreateUsuarioData): Promise<Usuario>;
}

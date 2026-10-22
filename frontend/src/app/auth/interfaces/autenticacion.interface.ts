export interface CredencialesIngreso {
  email: string;
  contrasenia: string;
}

export type RolUsuario = 'administrador' | 'superadmin';

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  local?: { id: number; slug: string; nombre: string };
}

export interface RespuestaIngreso {
  token: string;
  usuario: UsuarioAutenticado;
}

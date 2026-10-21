export interface CredencialesIngreso {
  email: string;
  contrasenia: string;
}

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin';
}

export interface RespuestaIngreso {
  token: string;
  usuario: UsuarioAutenticado;
}

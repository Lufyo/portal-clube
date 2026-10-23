export class ErroDeNegocio extends Error {
  constructor(
    mensagem: string,
    public status: number, // código HTTP (409, 500...)
    public campo?: string // campo do formulário a que o erro se refere
  ) {
    super(mensagem);
  }
}
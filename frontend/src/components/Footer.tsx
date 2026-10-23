export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-clube-escuro text-sm text-gray-300 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="font-bold text-white">
          Sport Club <span className="text-clube">do Recife</span>
        </p>
        <p className="mt-2">
          Projeto acadêmico: Centro Universitário Maurício de Nassau, Ciência
          da Computação.
        </p>
        <p className="mt-4">© {ano} Portal Sport Club do Recife.</p>
      </div>
    </footer>
  );
}
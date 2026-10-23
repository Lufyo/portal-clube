type Props = {
  id: string;
  rotulo: string;
  tipo?: string;
  valor: string;
  onChange: (valor: string) => void;
  erro?: string; // mensagem de erro vinda da API
  ajuda?: string; // dica exibida abaixo do campo
  autoComplete?: string;
  placeholder?: string;
};

export default function CampoFormulario({
  id,
  rotulo,
  tipo = "text",
  valor,
  onChange,
  erro,
  ajuda,
  autoComplete,
  placeholder,
}: Props) {
  // aria-describedby liga o campo à mensagem, para leitores de tela
  const descricaoId = erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricaoId}
        className={`mt-1 w-full rounded border px-3 py-2 ${
          erro ? "border-red-600" : "border-gray-300"
        }`}
      />
      {erro ? (
        <p id={`${id}-erro`} className="mt-1 text-sm text-red-700">
          {erro}
        </p>
      ) : (
        ajuda && (
          <p id={`${id}-ajuda`} className="mt-1 text-sm text-gray-600">
            {ajuda}
          </p>
        )
      )}
    </div>
  );
}
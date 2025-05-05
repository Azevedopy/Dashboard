export function GenierMaterialsList({ materials, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-full bg-gray-800 animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">Nenhum material faltante registrado no período selecionado.</div>
    )
  }

  return (
    <ul className="space-y-2">
      {materials.map((material, index) => (
        <li key={index} className="p-3 bg-gray-800 rounded flex items-center">
          <span className="h-2 w-2 bg-amber-500 rounded-full mr-3"></span>
          <span className="text-gray-200">{material}</span>
        </li>
      ))}
    </ul>
  )
}

export default function NoShowUserTable({ users = [] }) {
  if (!users.length) {
    return <p className="admin-chart__empty">Sin no-shows en el período seleccionado.</p>
  }

  const max = users[0]?.count || 1

  return (
    <div className="nsu-wrapper">
      <table className="nsu-table">
        <thead>
          <tr>
            <th className="nsu-th nsu-th--rank">#</th>
            <th className="nsu-th">Nombre</th>
            <th className="nsu-th nsu-th--email">Correo</th>
            <th className="nsu-th nsu-th--count">No shows</th>
            <th className="nsu-th nsu-th--bar" />
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id_usuario} className="nsu-row">
              <td className="nsu-td nsu-td--rank">{i + 1}</td>
              <td className="nsu-td">
                {u.nombre} {u.apellido}
              </td>
              <td className="nsu-td nsu-td--email">{u.correo_institucional}</td>
              <td className="nsu-td nsu-td--count">{u.count}</td>
              <td className="nsu-td nsu-td--bar">
                <div className="nsu-bar-track">
                  <div
                    className="nsu-bar-fill"
                    style={{ width: `${(u.count / max) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
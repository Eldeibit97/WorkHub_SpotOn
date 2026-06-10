import { useMemo, useState } from 'react'

function parseCsvLine(line) {
  const values = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (char === ',' && !insideQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values.map((value) => value.trim())
}

function rowsFromCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((value) => value.replace(/^"|"$/g, ''))
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? ''
      return acc
    }, {})
  })
}

function mapUserRow(row) {
  return {
    nombre: row.nombre || '',
    apellido: row.apellido || '',
    correo_institucional: row.correo_institucional || '',
    rol: row.rol || '',
    password: row.password || '',
    password_hash: row.password_hash || '',
  }
}

export default function ImportCsvModal({ onClose, onImport, loading }) {
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  async function onFileChange(event) {
    setError('')
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const parsed = rowsFromCsv(content).map(mapUserRow)
      setRows(parsed)
      setFileName(file.name)
      if (!parsed.length) {
        setError('El archivo no contiene filas de usuarios válidas.')
      }
    } catch {
      setError('No se pudo leer el archivo CSV.')
    }
  }

  const previewRows = useMemo(() => rows, [rows])

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal admin-modal--wide admin-modal--scrollable" role="dialog" aria-modal="true">
        <button className="admin-modal-close" onClick={onClose} aria-label="Cerrar importación">
          x
        </button>
        <div className="admin-modal__body">
          <h3>Import Data</h3>
          <p className="admin-helper-text">
            Carga un CSV de usuarios para previsualizar antes de importar.
          </p>
          <div className="admin-csv-format">
          <p className="admin-csv-format__title">Formato requerido del CSV</p>
          <p className="admin-helper-text admin-csv-format__intro">
            Primera fila: encabezados exactos (minúsculas, separados por coma). Si el correo ya
            existe, se actualiza el usuario; si no, se crea uno nuevo.
          </p>
          <div className="admin-table-scroll">
            <table className="admin-table admin-table--compact admin-csv-format__table">
              <thead>
                <tr>
                  <th>Columna</th>
                  <th>Obligatoria</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>nombre</code></td>
                  <td>Sí</td>
                  <td>Nombre del usuario</td>
                </tr>
                <tr>
                  <td><code>apellido</code></td>
                  <td>Sí</td>
                  <td>Apellido del usuario</td>
                </tr>
                <tr>
                  <td><code>correo_institucional</code></td>
                  <td>Sí</td>
                  <td>Correo institucional (se guarda en minúsculas)</td>
                </tr>
                <tr>
                  <td><code>rol</code></td>
                  <td>Sí</td>
                  <td>
                    Rol del usuario. Valores válidos: <code>admin</code>, <code>employee</code>
                  </td>
                </tr>
                <tr>
                  <td><code>password</code></td>
                  <td>No</td>
                  <td>Contraseña en texto plano (mínimo 8 caracteres)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <input className="admin-input" type="file" accept=".csv,text/csv" onChange={onFileChange} />
        {fileName && <p className="admin-helper-text">Archivo: {fileName}</p>}
        {error && <p className="admin-error">{error}</p>}

        {!!previewRows.length && (
          <div className="admin-table-scroll admin-table-scroll--preview">
            <table className="admin-table admin-table--compact">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={`${row.correo_institucional}-${index}`}>
                    <td>{row.nombre || '-'}</td>
                    <td>{row.apellido || '-'}</td>
                    <td>{row.correo_institucional || '-'}</td>
                    <td>{row.rol || '-'}</td>
                    <td>{row.password_hash ? 'Con hash' : row.password ? 'En plano' : 'Vacía'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>

        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn--secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => onImport(rows)}
            disabled={loading || rows.length === 0}
          >
            {loading ? 'Importando...' : `Importar ${rows.length} usuario(s)`}
          </button>
        </div>
      </div>
    </div>
  )
}

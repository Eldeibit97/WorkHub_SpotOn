import { useEffect, useState } from 'react'
import {
  createUser,
  deleteUser,
  getRoles,
  importUsersCsv,
  listUsers,
  updateUser,
  updateUserPassword,
  updateUserRoles,
} from '../../api/users'
import DeleteUserConfirmModal from './components/DeleteUserConfirmModal'
import ImportCsvModal from './components/ImportCsvModal'
import UserFormModal from './components/UserFormModal'
import UsersTable from './components/UsersTable'
import UsersToolbar from './components/UsersToolbar'

const DEFAULT_PAGE_SIZE = 12

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortKey, setSortKey] = useState('nombre')
  const [sortDirection, setSortDirection] = useState('asc')

  const [selectedUser, setSelectedUser] = useState(null)
  const [formMode, setFormMode] = useState('edit')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    fetchUsuarios()
  }, [page, pageSize, search, roleFilter, sortKey, sortDirection])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    loadRoles()
  }, [])

  async function fetchUsuarios() {
    setCargando(true)
    setError('')
    try {
      const data = await listUsers({
        page,
        pageSize,
        search,
        role: roleFilter,
        sortKey,
        sortDirection,
      })
      const nextUsers = data.usuarios || data.users || []
      const total = data.total ?? nextUsers.length
      const computedPages = data.totalPages || Math.max(1, Math.ceil(total / pageSize))
      setUsuarios(applyClientSort(nextUsers, sortKey, sortDirection))
      setTotalItems(total)
      setTotalPages(computedPages)
    } catch (fetchError) {
      setError(fetchError.message || 'Error al cargar usuarios')
    } finally {
      setCargando(false)
    }
  }

  async function loadRoles() {
    try {
      const data = await getRoles()
      const dynamicRoles = data.roles || data.data || []
      setRoles(dynamicRoles.length ? dynamicRoles : ['employee', 'admin'])
    } catch {
      setRoles(['employee', 'admin'])
    }
  }

  function openCreateModal() {
    setFormMode('create')
    setSelectedUser(null)
    setShowUserModal(true)
  }

  function openEditModal(targetUser) {
    setFormMode('edit')
    setSelectedUser(targetUser)
    setShowUserModal(true)
  }

  function closeUserModal() {
    setShowUserModal(false)
    setSelectedUser(null)
  }

  function requestDeleteFromRow(targetUser) {
    setSelectedUser(targetUser)
    setShowDeleteModal(true)
  }

  function handleSortChange(nextKey, nextDirection) {
    setSortKey(nextKey)
    setSortDirection(nextDirection)
    setPage(1)
  }

  async function saveUser(formData) {
    setSaving(true)
    setError('')
    try {
      if (formMode === 'create') {
        await createUser({
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo_institucional: formData.correo_institucional,
          rol: formData.rol,
          password: formData.password,
        })
        setMensaje('Usuario creado correctamente.')
      } else if (selectedUser) {
        await updateUser(selectedUser.id_usuario, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo_institucional: formData.correo_institucional,
        })
        await updateUserRoles(selectedUser.id_usuario, [formData.rol])
        if (formData.password.trim()) {
          await updateUserPassword(selectedUser.id_usuario, formData.password)
        }
        setMensaje('Usuario actualizado correctamente.')
      }
      closeUserModal()
      fetchUsuarios()
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar el usuario')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDeleteUser() {
    if (!selectedUser) return
    setSaving(true)
    setError('')
    try {
      await deleteUser(selectedUser.id_usuario)
      setMensaje('Usuario eliminado correctamente.')
      setShowDeleteModal(false)
      closeUserModal()
      fetchUsuarios()
    } catch (deleteError) {
      setError(deleteError.message || 'No se pudo eliminar el usuario')
    } finally {
      setSaving(false)
    }
  }

  async function handleImport(rows) {
    setImporting(true)
    setError('')
    try {
      await importUsersCsv(rows)
      setMensaje(`Importación completada. ${rows.length} filas enviadas.`)
      setShowImportModal(false)
      fetchUsuarios()
    } catch (importError) {
      setError(importError.message || 'No se pudo completar la importación')
    } finally {
      setImporting(false)
    }
  }

  function handlePageSizeChange(nextSize) {
    setPageSize(nextSize)
    setPage(1)
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Usuarios</h1>
          <p className="admin-subtitle">
            Gestiona información, accesos y permisos del equipo desde un solo panel.
          </p>
        </div>
      </header>

      <UsersToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        roleFilter={roleFilter}
        onRoleFilterChange={(value) => {
          setPage(1)
          setRoleFilter(value)
        }}
        roles={roles}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onOpenImport={() => setShowImportModal(true)}
        onOpenCreate={openCreateModal}
      />

      {mensaje && <div className="admin-feedback admin-feedback--success">{mensaje}</div>}
      {error && <div className="admin-feedback admin-feedback--error">{error}</div>}

      <UsersTable
        users={usuarios}
        loading={cargando}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onPageChange={setPage}
        onEdit={openEditModal}
        onDelete={requestDeleteFromRow}
      />

      {showUserModal && (
        <UserFormModal
          mode={formMode}
          user={selectedUser}
          roles={roles}
          loading={saving}
          onClose={closeUserModal}
          onSave={saveUser}
          onDeleteRequest={() => setShowDeleteModal(true)}
        />
      )}

      {showDeleteModal && (
        <DeleteUserConfirmModal
          user={selectedUser}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteUser}
          loading={saving}
        />
      )}

      {showImportModal && (
        <ImportCsvModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          loading={importing}
        />
      )}
    </div>
  )
}

function applyClientSort(items, key, direction) {
  if (!key) return items
  const sorted = [...items]
  sorted.sort((a, b) => {
    const aValue = (a[key] ?? '').toString().toLowerCase()
    const bValue = (b[key] ?? '').toString().toLowerCase()
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}

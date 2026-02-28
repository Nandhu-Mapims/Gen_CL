import { useEffect, useState, useMemo } from 'react'
import { apiClient } from '../../api/client'

export function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')

  // ── Add top-level department form ──
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [addingTop, setAddingTop] = useState(false)

  // ── Add sub-domain inline (which parent is open) ──
  const [subParentId, setSubParentId] = useState(null) // parentId whose sub-form is open
  const [subName, setSubName] = useState('')
  const [subCode, setSubCode] = useState('')

  // ── Edit ──
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')

  const load = async () => {
    try {
      setError('')
      const data = await apiClient.get('/departments')
      setDepartments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load')
    }
  }

  useEffect(() => { load() }, [])

  // Build hierarchy map
  const { topLevel, childrenOf } = useMemo(() => {
    const top = departments.filter(d => !d.parent)
    const childMap = {}
    departments.filter(d => d.parent).forEach(d => {
      const pid = d.parent?._id || d.parent
      if (!childMap[pid]) childMap[pid] = []
      childMap[pid].push(d)
    })
    return { topLevel: top, childrenOf: childMap }
  }, [departments])

  // ── Handlers ──

  const handleAddTop = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await apiClient.post('/departments', { name: newName, code: newCode, parentId: null })
      setNewName(''); setNewCode(''); setAddingTop(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create')
    }
  }

  const handleAddSub = async (e, parentId) => {
    e.preventDefault()
    setError('')
    try {
      await apiClient.post('/departments', { name: subName, code: subCode, parentId })
      setSubName(''); setSubCode(''); setSubParentId(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create sub-domain')
    }
  }

  const startEdit = (dept) => {
    setEditing(dept._id)
    setEditName(dept.name)
    setEditCode(dept.code)
    setSubParentId(null)
  }

  const handleEdit = async (e, dept) => {
    e.preventDefault()
    setError('')
    try {
      await apiClient.put(`/departments/${dept._id}`, {
        name: editName, code: editCode, isActive: dept.isActive,
        parentId: dept.parent?._id || dept.parent || null,
      })
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update')
    }
  }

  const toggleActive = async (dept) => {
    try {
      await apiClient.put(`/departments/${dept._id}`, {
        name: dept.name, code: dept.code, isActive: !dept.isActive,
        parentId: dept.parent?._id || dept.parent || null,
      })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (dept) => {
    const subCount = (childrenOf[dept._id] ?? []).length
    const message = subCount > 0
      ? `"${dept.name}" has ${subCount} sub-domain(s). Deleting it will not remove them; delete sub-domains first if needed. Continue?`
      : `Delete "${dept.name}"? This cannot be undone.`
    if (!window.confirm(message)) return
    setError('')
    try {
      await apiClient.delete(`/departments/${dept._id}`)
      setEditing(null)
      setSubParentId(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to delete')
    }
  }

  // ── Row Components ──

  const SubRow = ({ dept }) => (
    <>
      <tr className="bg-slate-50/70 border-b border-slate-100">
        <td className="pl-10 pr-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 select-none">└</span>
            {editing === dept._id ? (
              <form onSubmit={(e) => handleEdit(e, dept)} className="flex items-center gap-2">
                <input
                  className="border border-slate-300 rounded px-2 py-1 text-xs w-40 focus:ring-1 focus:ring-maroon-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  autoFocus
                />
                <input
                  className="border border-slate-300 rounded px-2 py-1 text-xs w-24 focus:ring-1 focus:ring-maroon-500 font-mono"
                  value={editCode}
                  onChange={e => setEditCode(e.target.value.toUpperCase())}
                  required
                />
                <button type="submit" className="text-xs text-emerald-700 font-semibold hover:underline">Save</button>
                <button type="button" onClick={() => setEditing(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
              </form>
            ) : (
              <span className="text-sm text-slate-700">{dept.name}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{dept.code}</td>
        <td className="px-4 py-2.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dept.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {dept.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-3">
            {editing !== dept._id && (
              <button onClick={() => startEdit(dept)} className="text-xs text-maroon-700 hover:underline font-medium">Edit</button>
            )}
            <button onClick={() => toggleActive(dept)} className="text-xs text-slate-500 hover:underline">
              {dept.isActive ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => handleDelete(dept)} className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium">
              Delete
            </button>
          </div>
        </td>
      </tr>
    </>
  )

  const SubAddRow = ({ parentId }) => (
    <tr className="bg-blue-50/40 border-b border-slate-100">
      <td colSpan={4} className="pl-10 pr-4 py-2.5">
        <form onSubmit={(e) => handleAddSub(e, parentId)} className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-300 select-none">└</span>
          <input
            className="border border-blue-300 rounded px-2 py-1.5 text-sm w-48 focus:ring-2 focus:ring-blue-400"
            placeholder="Sub-domain name"
            value={subName}
            onChange={e => setSubName(e.target.value)}
            required
            autoFocus
          />
          <input
            className="border border-blue-300 rounded px-2 py-1.5 text-sm w-28 font-mono focus:ring-2 focus:ring-blue-400"
            placeholder="CODE"
            value={subCode}
            onChange={e => setSubCode(e.target.value.toUpperCase())}
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            Add
          </button>
          <button
            type="button"
            onClick={() => { setSubParentId(null); setSubName(''); setSubCode('') }}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
          >
            Cancel
          </button>
        </form>
      </td>
    </tr>
  )

  const ParentRow = ({ dept }) => {
    const subs = childrenOf[dept._id] || []
    const isSubOpen = subParentId === dept._id
    return (
      <>
        <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
          <td className="px-5 py-3">
            {editing === dept._id ? (
              <form onSubmit={(e) => handleEdit(e, dept)} className="flex items-center gap-2">
                <input
                  className="border border-slate-300 rounded px-2 py-1 text-sm w-44 focus:ring-1 focus:ring-maroon-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  autoFocus
                />
                <input
                  className="border border-slate-300 rounded px-2 py-1 text-sm w-24 font-mono focus:ring-1 focus:ring-maroon-500"
                  value={editCode}
                  onChange={e => setEditCode(e.target.value.toUpperCase())}
                  required
                />
                <button type="submit" className="text-xs text-emerald-700 font-semibold hover:underline">Save</button>
                <button type="button" onClick={() => setEditing(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">{dept.name}</span>
                <span className="text-[10px] font-semibold bg-maroon-50 text-maroon-700 border border-maroon-100 px-1.5 py-0.5 rounded-full">
                  Dept
                </span>
                {subs.length > 0 && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {subs.length} sub
                  </span>
                )}
              </div>
            )}
          </td>
          <td className="px-5 py-3 text-xs font-mono text-slate-500">{dept.code}</td>
          <td className="px-5 py-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dept.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {dept.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-5 py-3">
            <div className="flex items-center gap-3">
              {editing !== dept._id && (
                <>
                  <button
                    onClick={() => {
                      if (isSubOpen) { setSubParentId(null); setSubName(''); setSubCode('') }
                      else { setSubParentId(dept._id); setSubName(''); setSubCode(''); setEditing(null) }
                    }}
                    className="text-xs text-blue-700 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    + Add Sub-domain
                  </button>
                  <button onClick={() => startEdit(dept)} className="text-xs text-maroon-700 hover:underline font-medium">Edit</button>
                  <button onClick={() => toggleActive(dept)} className="text-xs text-slate-500 hover:underline">
                    {dept.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(dept)} className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium">
                    Delete
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>

        {/* Existing sub-domains */}
        {subs.map(sub => <SubRow key={sub._id} dept={sub} />)}

        {/* Inline add sub-domain form */}
        {isSubOpen && <SubAddRow parentId={dept._id} />}
      </>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Department Management</h2>
          <p className="text-sm text-slate-600 mt-1">Create departments and add sub-domains directly under each one</p>
        </div>
        <button
          onClick={() => { setAddingTop(v => !v); setSubParentId(null) }}
          className="bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition-all"
        >
          {addingTop ? 'Cancel' : '+ Add Department'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-4 text-red-500 hover:text-red-700 font-medium">✕</button>
        </div>
      )}

      {/* Add top-level department */}
      {addingTop && (
        <form
          onSubmit={handleAddTop}
          className="bg-white shadow-sm rounded-xl border-2 border-maroon-200 p-4 flex flex-wrap gap-3 items-end"
        >
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              className="border border-slate-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Housekeeping Department"
              required
              autoFocus
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
            <input
              className="border border-slate-300 rounded-lg w-full px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="e.g. HK"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-maroon-600 hover:bg-maroon-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Create
            </button>
            <button type="button" onClick={() => { setAddingTop(false); setNewName(''); setNewCode('') }} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-xs text-slate-600 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 font-semibold text-xs text-slate-600 uppercase tracking-wide w-32">Code</th>
              <th className="text-left px-5 py-3 font-semibold text-xs text-slate-600 uppercase tracking-wide w-24">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-xs text-slate-600 uppercase tracking-wide w-64">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topLevel.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">
                  No departments yet. Click <strong>+ Add Department</strong> to create one.
                </td>
              </tr>
            )}
            {topLevel.map(dept => <ParentRow key={dept._id} dept={dept} />)}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {topLevel.map(dept => {
          const subs = childrenOf[dept._id] || []
          const isSubOpen = subParentId === dept._id
          return (
            <div key={dept._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Parent header */}
              <div className="p-4 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{dept.name}</span>
                    <span className="text-[10px] bg-maroon-50 text-maroon-700 border border-maroon-100 px-1.5 py-0.5 rounded-full font-semibold">Dept</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 mt-0.5 block">{dept.code}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${dept.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Sub-domains list */}
              {subs.length > 0 && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {subs.map(sub => (
                    <div key={sub._id} className="pl-6 pr-4 py-2.5 flex items-center justify-between bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">└</span>
                        <span className="text-sm text-slate-700">{sub.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{sub.code}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => startEdit(sub)} className="text-xs text-maroon-700 font-medium">Edit</button>
                        <button onClick={() => toggleActive(sub)} className="text-xs text-slate-500">
                          {sub.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(sub)} className="text-xs text-red-600 font-medium">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline add sub-domain */}
              {isSubOpen && (
                <div className="border-t border-blue-100 bg-blue-50/40 px-4 py-3">
                  <form onSubmit={(e) => handleAddSub(e, dept._id)} className="space-y-2">
                    <input
                      className="border border-blue-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                      placeholder="Sub-domain name"
                      value={subName}
                      onChange={e => setSubName(e.target.value)}
                      required autoFocus
                    />
                    <input
                      className="border border-blue-300 rounded-lg w-full px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-400"
                      placeholder="CODE"
                      value={subCode}
                      onChange={e => setSubCode(e.target.value.toUpperCase())}
                      required
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg">Add</button>
                      <button type="button" onClick={() => { setSubParentId(null); setSubName(''); setSubCode('') }} className="flex-1 border border-slate-300 text-slate-600 text-sm py-2 rounded-lg">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Action row */}
              <div className="border-t border-slate-100 px-4 py-2.5 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (isSubOpen) { setSubParentId(null); setSubName(''); setSubCode('') }
                    else { setSubParentId(dept._id); setSubName(''); setSubCode(''); setEditing(null) }
                  }}
                  className="flex-1 min-w-[120px] text-xs text-blue-700 font-semibold border border-blue-200 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg transition-colors"
                >
                  + Add Sub-domain
                </button>
                <button onClick={() => startEdit(dept)} className="flex-1 min-w-[70px] text-xs text-maroon-700 font-medium border border-maroon-200 bg-maroon-50 hover:bg-maroon-100 py-1.5 rounded-lg transition-colors">
                  Edit
                </button>
                <button onClick={() => toggleActive(dept)} className="flex-1 min-w-[70px] text-xs text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 py-1.5 rounded-lg transition-colors">
                  {dept.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(dept)} className="flex-1 min-w-[70px] text-xs text-red-600 font-medium border border-red-200 bg-red-50 hover:bg-red-100 py-1.5 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

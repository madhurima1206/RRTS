import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SupervisorDashboard.css";

const API_BASE_URL = "http://localhost:5001/api";

/* ------------------- Fixed materials & defaults ------------------- */
const FIXED_MATERIALS = ["Cement", "Asphalt", "Gravel"];
const DEFAULT_PERSONNEL_TYPES = [
  { id: "laborers", name: "Laborers", quantity: 999, unit: "persons" },
  { id: "skilled", name: "Skilled Workers", quantity: 999, unit: "persons" },
  { id: "supervisor", name: "Supervisors", quantity: 999, unit: "persons" }
];

/* ------------------- StructuredAssessmentForm ------------------- */
export const StructuredAssessmentForm = ({ complaint, resources, onSubmit, onCancel, loading }) => {
  // Inventory-sourced options
  const machineOptions = resources.filter(r => r.type === 'machine');
  const personnelOptionsFromInventory = resources.filter(r => r.type === 'personnel');

  // If no personnel in inventory, fall back to default personnel types
  const personnelOptions = personnelOptionsFromInventory.length > 0
    ? personnelOptionsFromInventory
    : DEFAULT_PERSONNEL_TYPES;

  const [priority, setPriority] = useState(complaint?.priority || 'medium');
  const [estimatedDays, setEstimatedDays] = useState(complaint?.estimatedDays || 3);
  const [materialsQty, setMaterialsQty] = useState(() =>
    FIXED_MATERIALS.reduce((acc, m) => ({ ...acc, [m]: 0 }), {})
  );
  const [machines, setMachines] = useState([]);
  const [personnel, setPersonnel] = useState(() => {
    // start with one preselected personnel row if options exist
    const first = personnelOptions[0];
    return first ? [{ resourceId: String(first.id), name: first.name, quantity: 1, unit: first.unit || '' }] : [];
  });

  const findMaterialResource = (materialName) => {
    if (!materialName) return null;
    const lower = String(materialName).toLowerCase();
    return resources.find(r => r.type === 'material' && String(r.name).toLowerCase().includes(lower)) || null;
  };

  const handleMaterialQtyChange = (material, value) => {
    setMaterialsQty(prev => ({ ...prev, [material]: Number(value) }));
  };

  const addPersonnel = () => {
    const first = personnelOptions[0];
    setPersonnel(prev => [...prev, {
      resourceId: first ? String(first.id) : '',
      name: first ? first.name : '',
      quantity: 1,
      unit: first ? (first.unit || '') : ''
    }]);
  };
  const removePersonnel = (i) => setPersonnel(prev => prev.filter((_, idx) => idx !== i));
  const updatePersonnel = (i, field, value) => {
    setPersonnel(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'resourceId') {
        // try to sync name/unit when option is from inventory or defaults
        const r = personnelOptions.find(x => String(x.id) === String(value));
        if (r) {
          next[i].name = r.name;
          next[i].unit = r.unit || '';
          // don't force-clip quantity here; let user adjust
        }
      }
      return next;
    });
  };

  const toggleMachine = (id) => {
    setMachines(prev => {
      const exists = prev.some(x => String(x) === String(id));
      if (exists) return prev.filter(x => String(x) !== String(id));
      return [...prev, id];
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const mats = FIXED_MATERIALS
      .map(name => {
        const qty = Number(materialsQty[name] || 0);
        if (!qty || qty <= 0) return null;
        const matched = findMaterialResource(name);
        return {
          resourceId: matched ? matched.id : null,
          name,
          quantity: qty,
          unit: matched ? (matched.unit || '') : 'units'
        };
      })
      .filter(Boolean);

    const pers = personnel
      .filter(p => p.resourceId && Number(p.quantity) > 0)
      .map(p => ({ resourceId: p.resourceId, name: p.name, quantity: Number(p.quantity), unit: p.unit }));

    const mach = machines.slice();

    if (mats.length === 0 && pers.length === 0 && mach.length === 0) {
      if (!window.confirm('You did not select any structured items. Submit assessment with no structured resources?')) return;
    }

    onSubmit({
      priority,
      estimatedDays,
      materials: mats,
      machines: mach,
      personnel: pers
    });
  };

  return (
    <form onSubmit={handleSubmit} className="assessment-form structured">
      <div className="form-group">
        <label>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="form-section">
        <h4>Materials</h4>
        <p className="muted">Select quantity for each fixed material. Quantity 0 = not requested.</p>
        <div className="material-rows">
          {FIXED_MATERIALS.map(mat => {
            const matched = findMaterialResource(mat);
            return (
              <div className="material-row" key={mat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <label style={{ minWidth: 100 }}>{mat}{matched ? ` (${matched.name})` : ''}</label>
                <select value={materialsQty[mat]} onChange={(e) => handleMaterialQtyChange(mat, e.target.value)}>
                  {Array.from({ length: 21 }).map((_, i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <span>{matched ? (matched.unit || 'units') : 'units'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-section">
        <h4>Machines (toggle required)</h4>
        <div className="rows">
          {machineOptions.length === 0 && <p>No machines found in inventory.</p>}
          {machineOptions.map(r => (
            <label key={r.id} style={{ display: 'block', marginBottom: 6 }}>
              <input type="checkbox" checked={machines.some(id => String(id) === String(r.id))} onChange={() => toggleMachine(r.id)} /> {r.name} {r.available ? '' : '(unavailable)'}
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h4>Personnel</h4>
        <div className="rows">
          {personnel.map((row, idx) => (
            <div className="row" key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <select
                value={row.resourceId}
                onChange={(e) => updatePersonnel(idx, 'resourceId', e.target.value)}
                required
              >
                {personnelOptions.length === 0 ? (
                  <option value="">No personnel types</option>
                ) : (
                  <>
                    <option value="">Select personnel type</option>
                    {personnelOptions.map(r => <option key={r.id} value={String(r.id)}>{r.name} ({r.quantity || '—'} available)</option>)}
                  </>
                )}
              </select>
              <input type="number" min="1" value={row.quantity} onChange={(e) => updatePersonnel(idx, 'quantity', e.target.value)} required style={{ width: 80 }} />
              <span>{row.unit}</span>
              <button type="button" onClick={() => removePersonnel(idx)}>Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPersonnel} className="btn-secondary">Add Personnel Row</button>
      </div>

      <div className="form-group">
        <label>Estimated Days</label>
        <input type="number" min="1" max="30" value={estimatedDays} onChange={(e) => setEstimatedDays(Number(e.target.value))} required />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel" disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Assessment'}</button>
      </div>
    </form>
  );
};

/* ------------------- StructuredResourceRequestForm ------------------- */
export const StructuredResourceRequestForm = ({ complaint, resources, onSubmit, onCancel, loading }) => {
  const machineOptions = resources.filter(r => r.type === 'machine');
  const personnelOptionsFromInventory = resources.filter(r => r.type === 'personnel');
  const personnelOptions = personnelOptionsFromInventory.length > 0 ? personnelOptionsFromInventory : DEFAULT_PERSONNEL_TYPES;

  const [priority, setPriority] = useState(complaint?.priority || 'medium');
  const [estimatedDays, setEstimatedDays] = useState(complaint?.estimatedDays || 3);
  const [materialsQty, setMaterialsQty] = useState(() =>
    FIXED_MATERIALS.reduce((acc, m) => ({ ...acc, [m]: 0 }), {})
  );
  const [machines, setMachines] = useState([]);
  const [personnel, setPersonnel] = useState(() => {
    const first = personnelOptions[0];
    return first ? [{ resourceId: String(first.id), name: first.name, quantity: 1, unit: first.unit || '' }] : [];
  });

  const findMaterialResource = (materialName) => {
    if (!materialName) return null;
    const lower = String(materialName).toLowerCase();
    return resources.find(r => r.type === 'material' && String(r.name).toLowerCase().includes(lower)) || null;
  };

  const handleMaterialQtyChange = (material, value) => {
    setMaterialsQty(prev => ({ ...prev, [material]: Number(value) }));
  };

  const addPersonnelRow = () => {
    const first = personnelOptions[0];
    setPersonnel(prev => [...prev, {
      resourceId: first ? String(first.id) : '',
      name: first ? first.name : '',
      quantity: 1,
      unit: first ? (first.unit || '') : ''
    }]);
  };
  const removePersonnelRow = (i) => setPersonnel(prev => prev.filter((_, idx) => idx !== i));
  const updatePersonnelRow = (i, field, value) => {
    setPersonnel(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'resourceId') {
        const r = personnelOptions.find(x => String(x.id) === String(value));
        if (r) {
          next[i].name = r.name;
          next[i].unit = r.unit || '';
        }
      }
      return next;
    });
  };

  const toggleMachine = (id) => {
    setMachines(prev => prev.some(x => String(x) === String(id)) ? prev.filter(x => String(x) !== String(id)) : [...prev, id]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const mats = FIXED_MATERIALS
      .map(name => {
        const qty = Number(materialsQty[name] || 0);
        if (!qty || qty <= 0) return null;
        const matched = findMaterialResource(name);
        return {
          resourceId: matched ? matched.id : null,
          name,
          quantity: qty,
          unit: matched ? (matched.unit || '') : 'units'
        };
      })
      .filter(Boolean);

    const pers = personnel
      .filter(p => p.resourceId && Number(p.quantity) > 0)
      .map(p => ({ resourceId: p.resourceId, name: p.name, quantity: Number(p.quantity), unit: p.unit }));

    const mach = machines.slice();

    if (mats.length === 0 && pers.length === 0 && mach.length === 0) {
      if (!window.confirm('No selections made. Submit empty resource request?')) return;
    }

    onSubmit({ priority, estimatedDays, materials: mats, machines: mach, personnel: pers });
  };

  return (
    <form onSubmit={handleSubmit} className="resource-request-form structured">
      <div className="form-group">
        <label>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="form-section">
        <h4>Materials</h4>
        <p className="muted">Select quantity for each fixed material. Quantity 0 = not requested.</p>
        <div className="material-rows">
          {FIXED_MATERIALS.map(mat => {
            const matched = findMaterialResource(mat);
            return (
              <div className="material-row" key={mat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <label style={{ minWidth: 100 }}>{mat}{matched ? ` (${matched.name})` : ''}</label>
                <select value={materialsQty[mat]} onChange={(e) => handleMaterialQtyChange(mat, e.target.value)}>
                  {Array.from({ length: 21 }).map((_, i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <span>{matched ? (matched.unit || 'units') : 'units'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-section">
        <h4>Machines</h4>
        <div className="rows">
          {machineOptions.length === 0 && <p>No machines available in inventory.</p>}
          {machineOptions.map(r => (
            <label key={r.id} style={{ display: 'block', marginBottom: 6 }}>
              <input type="checkbox" checked={machines.some(id => String(id) === String(r.id))} onChange={() => toggleMachine(r.id)} /> {r.name}
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h4>Personnel</h4>
        <div className="rows">
          {personnel.map((row, idx) => (
            <div className="row" key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <select
                value={row.resourceId}
                onChange={(e) => updatePersonnelRow(idx, 'resourceId', e.target.value)}
                required
              >
                {personnelOptions.length === 0 ? (
                  <option value="">No personnel types</option>
                ) : (
                  <>
                    <option value="">Select personnel type</option>
                    {personnelOptions.map(r => <option key={r.id} value={String(r.id)}>{r.name} ({r.quantity || '—'} available)</option>)}
                  </>
                )}
              </select>
              <input type="number" min="1" value={row.quantity} onChange={(e) => updatePersonnelRow(idx, 'quantity', e.target.value)} required style={{ width: 80 }} />
              <span>{row.unit}</span>
              <button type="button" onClick={() => removePersonnelRow(idx)}>Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPersonnelRow} className="btn-secondary">Add Personnel Row</button>
      </div>

      <div className="form-group">
        <label>Estimated Days</label>
        <input type="number" min="1" max="30" value={estimatedDays} onChange={(e) => setEstimatedDays(Number(e.target.value))} required />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel" disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Resource Request'}</button>
      </div>
    </form>
  );
};

/* ------------------- Full SupervisorDashboard component ------------------- */
const SupervisorDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("assessment");
  const [complaints, setComplaints] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [expandedArea, setExpandedArea] = useState(null);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [showResourceRequest, setShowResourceRequest] = useState(false);
  const [assessedComplaints, setAssessedComplaints] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [completedComplaints, setCompletedComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to format location object/string
  const formatLocation = (location) => {
    if (typeof location === "string") return location;
    if (typeof location === "object" && location !== null) {
      return `${location.street || ""}${location.street ? ", " : ""}${location.area || ""}${location.area ? ", " : ""}${location.city || ""}${location.state ? ", " + location.state : ""} ${location.zipCode || ""}`.trim();
    }
    return "Unknown Location";
  };

  useEffect(() => {
    // initial load
    fetchResources();
    fetchComplaints();
    fetchResourceRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.get(`${API_BASE_URL}/resources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResources(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setResources([]);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.get(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(resp.data) ? resp.data : [];
      setComplaints(data);
      setAssessedComplaints(data.filter(c => c.status === 'under_review' || c.status === 'assigned'));
      setAssignedComplaints(data.filter(c => c.status === 'assigned'));
      setCompletedComplaints(data.filter(c => c.status === 'completed'));
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setComplaints([]);
      setAssessedComplaints([]);
      setAssignedComplaints([]);
      setCompletedComplaints([]);
    }
  };

  // derive resource requests from complaints (those flagged or under_review with estimates)
  const fetchResourceRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.get(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(resp.data) ? resp.data : [];
      const requests = data
        .filter(complaint => {
          const underReview = complaint.status === 'under_review';
          const hasFlag = complaint.resourceRequested === true;
          const hasEstimate = complaint.estimatedMaterials && String(complaint.estimatedMaterials).trim() !== '';
          return hasFlag || (underReview && hasEstimate);
        })
        .map(complaint => ({
          id: complaint.id,
          complaintId: complaint.id,
          materials: complaint.estimatedMaterials,
          machines: complaint.requiredMachines,
          personnel: complaint.requiredPersonnel,
          priority: complaint.priority,
          estimatedDays: complaint.estimatedDays || 3,
          status: 'pending',
          supervisorId: complaint.supervisorId,
          createdAt: complaint.requestedAt || complaint.createdAt,
          updatedAt: complaint.updatedAt
        }));
      setResourceRequests(requests);
    } catch (err) {
      console.error("Error fetching resource requests:", err);
      setResourceRequests([]);
    }
  };

  // Submit structured assessment (maps structured selections into same textual fields used by backend)
  const submitAssessment = async (assessmentData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Convert materials/personnel/machines into textual fields for backend
      const materialsStr = (assessmentData.materials || []).map(m => `${m.name}: ${m.quantity} ${m.unit || ''}`).join(', ');
      const machinesStr = (assessmentData.machines || []).map(mid => {
        const r = resources.find(x => String(x.id) === String(mid));
        return r ? r.name : `Machine#${mid}`;
      }).join(', ');
      const personnelStr = (assessmentData.personnel || []).map(p => `${p.name}: ${p.quantity} ${p.unit || ''}`).join(', ');

      const updateData = {
        status: "under_review",
        priority: assessmentData.priority,
        estimatedMaterials: materialsStr || assessmentData.materialsFreeText || '',
        requiredMachines: machinesStr || assessmentData.machinesFreeText || '',
        requiredPersonnel: personnelStr || assessmentData.personnelFreeText || '',
        estimatedDays: assessmentData.estimatedDays || 3,
        supervisorId: user?.id || null
      };

      await axios.put(`${API_BASE_URL}/complaints/${selectedComplaint.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      setSelectedComplaint(null);
      await Promise.all([fetchComplaints(), fetchResourceRequests()]);
      alert("Assessment submitted — complaint moved to 'Assessed Complaints'.");
    } catch (err) {
      console.error("Error submitting assessment:", err.response?.data || err.message);
      alert("Failed to submit assessment: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Submit a structured resource request (similar conversion)
  const submitResourceRequest = async (requestData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const materialsStr = (requestData.materials || []).map(m => `${m.name}: ${m.quantity} ${m.unit || ''}`).join(', ');
      const machinesStr = (requestData.machines || []).map(mid => {
        const r = resources.find(x => String(x.id) === String(mid));
        return r ? r.name : `Machine#${mid}`;
      }).join(', ');
      const personnelStr = (requestData.personnel || []).map(p => `${p.name}: ${p.quantity} ${p.unit || ''}`).join(', ');

      const updateData = {
        status: "under_review",
        priority: requestData.priority,
        estimatedMaterials: materialsStr || requestData.materialsFreeText || '',
        requiredMachines: machinesStr || requestData.machinesFreeText || '',
        requiredPersonnel: personnelStr || requestData.personnelFreeText || '',
        estimatedDays: requestData.estimatedDays || 3,
        supervisorId: user?.id || null,
        resourceRequested: true,
        requestedAt: new Date().toISOString()
      };

      await axios.put(`${API_BASE_URL}/complaints/${selectedComplaint.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      setShowResourceRequest(false);
      setSelectedComplaint(null);
      await Promise.all([fetchComplaints(), fetchResourceRequests()]);
      alert("Resource request submitted to administrator.");
    } catch (err) {
      console.error("Error submitting resource request:", err.response?.data || err.message);
      alert("Failed to submit resource request: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Mark work as completed
  const markWorkCompleted = async (complaintId) => {
    try {
      const token = localStorage.getItem("token");
      const completionNotes = prompt("Please add completion notes (optional):");
      await axios.put(`${API_BASE_URL}/complaints/${complaintId}`, {
        status: "completed",
        completedAt: new Date().toISOString(),
        completionNotes: completionNotes || "Work completed by supervisor",
        completedBy: user?.id || null
      }, { headers: { Authorization: `Bearer ${token}` }});
      await fetchComplaints();
      alert("Work marked completed.");
    } catch (err) {
      console.error("Error marking completed:", err);
      alert("Failed to mark completed.");
    }
  };

  // Sorting helpers (priority order: critical > high > medium > low)
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortComplaintsByPriority = (list) => {
    return [...list].sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
  };

  // Group pending complaints by area for assessment tab
  const groupedComplaints = complaints.reduce((acc, complaint) => {
    if (complaint.status === 'pending') {
      const area = (typeof complaint.location === 'object' ? (complaint.location.area || 'Unknown Area') : (complaint.location || 'Unknown Area'));
      if (!acc[area]) acc[area] = [];
      acc[area].push(complaint);
    }
    return acc;
  }, {});

  const getAreaStats = (arr) => ({
    total: arr.length,
    pending: arr.filter(c => c.status === 'pending').length,
    critical: arr.filter(c => c.priority === 'critical').length,
    high: arr.filter(c => c.priority === 'high').length
  });

  return (
    <div className="supervisor-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Supervisor Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="container">
          <div className="dashboard-tabs">
            <button className={`tab-btn ${activeTab === 'assessment' ? 'active' : ''}`} onClick={() => setActiveTab('assessment')}>Area-wise Assessment</button>
            <button className={`tab-btn ${activeTab === 'assessed' ? 'active' : ''}`} onClick={() => setActiveTab('assessed')}>Assessed Complaints ({assessedComplaints.length})</button>
            <button className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`} onClick={() => setActiveTab('assigned')}>Assigned Work ({assignedComplaints.length})</button>
            <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>Completed Work ({completedComplaints.length})</button>
            <button className={`tab-btn ${activeTab === 'resource-requests' ? 'active' : ''}`} onClick={() => setActiveTab('resource-requests')}>Resource Requests ({resourceRequests.length})</button>
          </div>

          <div className="tab-content">
            {activeTab === 'assessment' && (
              <div className="assessment-section">
                <h2>Area-wise Road Complaints Assessment</h2>
                <p className="subtitle">Assess road conditions and determine priority based on severity and locality type</p>

                {Object.keys(groupedComplaints).length === 0 ? (
                  <p>No pending complaints available for assessment.</p>
                ) : (
                  Object.entries(groupedComplaints).map(([area, areaComplaints]) => {
                    const stats = getAreaStats(areaComplaints);
                    return (
                      <div key={area} className="area-section">
                        <div className="area-header" onClick={() => setExpandedArea(expandedArea === area ? null : area)}>
                          <div className="area-title">
                            <h3>{area}</h3>
                            <div className="area-stats">
                              <span className="stat total">{stats.total} total</span>
                              {stats.critical > 0 && <span className="stat critical">{stats.critical} critical</span>}
                              {stats.high > 0 && <span className="stat high">{stats.high} high</span>}
                              <span className="stat pending">{stats.pending} pending</span>
                            </div>
                          </div>
                          <span className="toggle-icon">{expandedArea === area ? '▲' : '▼'}</span>
                        </div>

                        {expandedArea === area && (
                          <div className="complaints-grid">
                            {areaComplaints.map(complaint => (
                              <div key={complaint.id} className="complaint-card">
                                <div className="complaint-header">
                                  <h4>{complaint.title}</h4>
                                  <span className={`severity-badge ${complaint.severity || ''}`}>{complaint.severity}</span>
                                </div>
                                <div className="complaint-details">
                                  <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                                  <p><strong>Problem:</strong> {complaint.problemType}</p>
                                  <p><strong>Description:</strong> {complaint.description}</p>
                                  <p><strong>Submitted:</strong> {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="complaint-status">
                                  <span className={`status-badge ${complaint.status || ''}`}>{complaint.status}</span>
                                  <div className="complaint-actions">
                                    {complaint.status === 'pending' && (
                                      <button className="btn-assess" onClick={() => setSelectedComplaint(complaint)}>Assess Road</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'assessed' && (
              <div className="assessed-section">
                <h2>Assessed Complaints - Ready for Resource Request</h2>
                <p className="subtitle">These complaints have been assessed and can request resources</p>

                {assessedComplaints.length === 0 ? (
                  <p>No assessed complaints available.</p>
                ) : (
                  <div className="assessed-complaints-list">
                    {sortComplaintsByPriority(assessedComplaints).map(complaint => (
                      <div key={complaint.id} className="assessed-complaint-card">
                        <div className="complaint-header">
                          <h4>{complaint.title}</h4>
                          <div className="priority-indicators">
                            <span className={`priority-badge ${complaint.priority}`}>{complaint.priority} priority</span>
                            <span className={`severity-badge ${complaint.severity}`}>{complaint.severity}</span>
                          </div>
                        </div>
                        <div className="complaint-details">
                          <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                          <p><strong>Estimated Materials:</strong> {complaint.estimatedMaterials || "Not specified"}</p>
                          <p><strong>Required Machines:</strong> {complaint.requiredMachines || "Not specified"}</p>
                          <p><strong>Required Personnel:</strong> {complaint.requiredPersonnel || "Not specified"}</p>
                        </div>
                        <div className="complaint-actions">
                          {complaint.status === 'under_review' && (
                            <button className="btn-request" onClick={() => { setSelectedComplaint(complaint); setShowResourceRequest(true); }}>
                              Request Resources
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assigned' && (
              <div className="assigned-section">
                <h2>Assigned Work - Ready for Completion</h2>
                {assignedComplaints.length === 0 ? (
                  <p>No assigned work available.</p>
                ) : (
                  <div className="assigned-complaints-list">
                    {sortComplaintsByPriority(assignedComplaints).map(complaint => (
                      <div key={complaint.id} className="assigned-complaint-card">
                        <div className="complaint-header">
                          <h4>{complaint.title}</h4>
                          <div className="priority-indicators">
                            <span className={`priority-badge ${complaint.priority}`}>{complaint.priority} priority</span>
                            <span className={`severity-badge ${complaint.severity}`}>{complaint.severity}</span>
                          </div>
                        </div>
                        <div className="complaint-details">
                          <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                          <p><strong>Description:</strong> {complaint.description}</p>
                          <p><strong>Assigned Resources:</strong> {complaint.estimatedMaterials || "Not specified"}</p>
                        </div>
                        <div className="complaint-meta">
                          <p><strong>Assigned On:</strong> {complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="complaint-actions">
                          <button className="btn-complete" onClick={() => markWorkCompleted(complaint.id)}>Mark as Completed</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="completed-section">
                <h2>Completed Work</h2>
                {completedComplaints.length === 0 ? (
                  <p>No completed work yet.</p>
                ) : (
                  <div className="completed-complaints-list">
                    {completedComplaints.map(c => (
                      <div key={c.id} className="completed-complaint-card">
                        <h4>{c.title}</h4>
                        <p><strong>Completion Notes:</strong> {c.completionNotes || "No notes provided"}</p>
                        <p><strong>Completed On:</strong> {c.completedAt ? new Date(c.completedAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resource-requests' && (
              <div className="resource-requests-section">
                <h2>My Resource Requests ({resourceRequests.length})</h2>
                <p className="subtitle">These are your requests submitted to the administrator</p>

                {resourceRequests.length === 0 ? (
                  <p>No resource requests submitted yet. Submit a request from the 'Assessed Complaints' tab.</p>
                ) : (
                  <div className="requests-list">
                    {resourceRequests.map(request => {
                      const complaint = complaints.find(c => String(c.id) === String(request.complaintId));
                      return (
                        <div key={request.id} className="request-card">
                          <div className="request-header">
                            <h4>{complaint?.title || `Request for Complaint #${request.complaintId}`}</h4>
                            <span className={`status-badge ${request.status}`}>{request.status}</span>
                          </div>
                          <div className="request-details">
                            <p><strong>Location:</strong> {complaint ? formatLocation(complaint.location) : 'Unknown location'}</p>
                            <p><strong>Problem Type:</strong> {complaint?.problemType || 'N/A'}</p>
                            <p><strong>Materials:</strong> {request.materials || "Not specified"}</p>
                            <p><strong>Machines:</strong> {request.machines || "Not specified"}</p>
                            <p><strong>Personnel:</strong> {request.personnel || "Not specified"}</p>
                            <p><strong>Priority:</strong> <span className={`priority-badge ${request.priority}`}>{request.priority}</span></p>
                            <p><strong>Estimated Days:</strong> {request.estimatedDays}</p>
                            <p><strong>Submitted:</strong> {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Modal (structured) */}
      {selectedComplaint && !showResourceRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Assess Road Condition: {selectedComplaint.title}</h3>
            <p><strong>Location:</strong> {formatLocation(selectedComplaint.location)}</p>
            <StructuredAssessmentForm
              complaint={selectedComplaint}
              resources={resources}
              onSubmit={submitAssessment}
              onCancel={() => setSelectedComplaint(null)}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Resource Request Modal (structured) */}
      {selectedComplaint && showResourceRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Request Resources for: {selectedComplaint.title}</h3>
            <StructuredResourceRequestForm
              complaint={selectedComplaint}
              resources={resources}
              onSubmit={submitResourceRequest}
              onCancel={() => { setShowResourceRequest(false); setSelectedComplaint(null); }}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;

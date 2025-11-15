import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdministratorDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AdministratorDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableWorkers, setAvailableWorkers] = useState([]);
const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [newResource, setNewResource] = useState({
    name: '',
    type: '',
    quantity: '',
    unit: '',
    available: true
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [allocationData, setAllocationData] = useState({
    materials: [],
    machines: [],
    personnel: []
  });
  const [editingResource, setEditingResource] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');

  // Helper function to format location
  const formatLocation = (location) => {
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      return `${location.street || ''}${location.street ? ', ' : ''}${location.area || ''}${location.area ? ', ' : ''}${location.city || ''}${location.state ? ', ' + location.state : ''} ${location.zipCode || ''}`.trim();
    }
    return 'Unknown Location';
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derive resource requests whenever complaints change
  useEffect(() => {
    deriveResourceRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchResources(),
        fetchComplaints(),
        fetchAllocations()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(response.data || []);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
      return [];
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data || []);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaints([]);
      return [];
    }
  };

  const fetchAllocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/allocations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllocations(response.data || []);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching allocations:', error);
      setAllocations([]);
      return [];
    }
  };

  // Derive resource requests from complaints state
  const deriveResourceRequests = () => {
    if (!Array.isArray(complaints)) {
      setResourceRequests([]);
      return;
    }

    const pendingRequests = complaints
      .filter(complaint => {
        const underReview = complaint.status === 'under_review';
        const hasFlag = complaint.resourceRequested === true;
        const hasEstimate = complaint.estimatedMaterials && complaint.estimatedMaterials.toString().trim() !== '';
        // show only those actually requesting resources (flagged or with estimate) and under_review
        return underReview && (hasFlag || hasEstimate);
      })
      .map(complaint => ({
        // keep a consistent shape: id + complaintId
        id: complaint.id,
        complaintId: complaint.id,
        supervisorId: complaint.supervisorId || 'N/A',
        materials: complaint.estimatedMaterials || '',
        machines: complaint.requiredMachines || '',
        personnel: complaint.requiredPersonnel || '',
        priority: complaint.priority || 'medium',
        estimatedDays: complaint.estimatedDays || 3,
        status: 'pending',
        createdAt: complaint.requestedAt || complaint.createdAt || new Date().toISOString(),
        updatedAt: complaint.updatedAt || new Date().toISOString(),
        complaintDetails: {
          title: complaint.title,
          description: complaint.description,
          location: complaint.location,
          problemType: complaint.problemType,
          severity: complaint.severity
        }
      }));

    setResourceRequests(pendingRequests);
  };

  const addResource = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/resources`, {
        ...newResource,
        quantity: parseInt(newResource.quantity, 10)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewResource({ name: '', type: '', quantity: '', unit: '', available: true });
      await fetchResources();
      alert('Resource added successfully!');
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Error adding resource: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateResourceStatus = async (resourceId, available) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/resources/${resourceId}`, 
        { available },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchResources();
      alert('Resource status updated successfully!');
    } catch (error) {
      console.error('Error updating resource status:', error);
      alert('Error updating resource status: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateResourceQuantity = async (resourceId, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      const quantityValue = parseInt(newQuantity, 10);
      
      if (isNaN(quantityValue) || quantityValue < 0) {
        alert('Please enter a valid quantity number');
        return;
      }

      await axios.patch(`${API_BASE_URL}/resources/${resourceId}`, 
        { quantity: quantityValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingResource(null);
      setEditQuantity('');
      await fetchResources();
      alert('Resource quantity updated successfully!');
    } catch (error) {
      console.error('Error updating resource quantity:', error);
      alert('Error updating resource quantity: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditQuantity = (resource) => {
    setEditingResource(resource);
    setEditQuantity(resource.quantity?.toString() || '');
  };

  const cancelEdit = () => {
    setEditingResource(null);
    setEditQuantity('');
  };

  const openAllocationModal = (request) => {
    setSelectedRequest(request);
    setAllocationData({
      materials: [],
      machines: [],
      personnel: []
    });
  };

  // tolerant finder (coerce to string to avoid type mismatches)
  const findResource = (id) => resources.find(r => String(r.id) === String(id));

  // helper: check if machine is available
  const isMachineAvailable = (resourceId) => {
    const r = findResource(resourceId);
    return r ? !!r.available : false;
  };

  // Validate the allocationData against the request requirements
  const validateAllocationAgainstRequest = (request, allocation) => {
    if (!request) return { ok: false, message: 'No selected request.' };

    // Determine which categories were actually requested
    const needsMaterials = request.materials && String(request.materials).trim() !== '';
    const needsMachines = request.machines && String(request.machines).trim() !== '';
    const needsPersonnel = request.personnel && String(request.personnel).trim() !== '';

    // If any required category is missing in allocation, block
    if (needsMaterials && (!allocation.materials || allocation.materials.length === 0)) {
      return { ok: false, message: 'Materials were requested but you have not allocated any materials.' };
    }
    if (needsMachines && (!allocation.machines || allocation.machines.length === 0)) {
      return { ok: false, message: 'Machines were requested but you have not allocated any machines.' };
    }
    if (needsPersonnel && (!allocation.personnel || allocation.personnel.length === 0)) {
      return { ok: false, message: 'Personnel were requested but you have not allocated any personnel.' };
    }

    // For materials and personnel, check quantity availability
    for (const mat of allocation.materials || []) {
      const res = findResource(mat.resourceId);
      const requestedQty = parseInt(mat.quantity || 0, 10);
      const availableQty = parseInt(res?.quantity || 0, 10);
      if (!res) return { ok: false, message: `Material resource id ${mat.resourceId} not found.` };
      if (requestedQty <= 0) return { ok: false, message: `Invalid quantity for ${res.name}.` };
      if (requestedQty > availableQty) return { ok: false, message: `Not enough quantity for ${res.name}. Requested ${requestedQty}, available ${availableQty}.` };
    }

    for (const person of allocation.personnel || []) {
      const res = findResource(person.resourceId);
      const requestedQty = parseInt(person.quantity || 0, 10);
      const availableQty = parseInt(res?.quantity || 0, 10);
      if (!res) return { ok: false, message: `Personnel resource id ${person.resourceId} not found.` };
      if (requestedQty <= 0) return { ok: false, message: `Invalid personnel quantity for ${res.name}.` };
      if (requestedQty > availableQty) return { ok: false, message: `Not enough personnel for ${res.name}. Requested ${requestedQty}, available ${availableQty}.` };
    }

    // For machines, check availability boolean
    for (const machine of allocation.machines || []) {
      const res = findResource(machine.resourceId);
      if (!res) return { ok: false, message: `Machine resource id ${machine.resourceId} not found.` };
      if (!res.available) return { ok: false, message: `Machine ${res.name} is not available.` };
    }

    return { ok: true };
  };

  // addResourceToAllocation merges duplicates and coerces types
  const addResourceToAllocation = (resourceType, resourceId, quantity = 1) => {
    const resource = findResource(resourceId);
    if (!resource) return;

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    setAllocationData(prev => {
      const list = [...(prev[resourceType] || [])];
      const idx = list.findIndex(item => String(item.resourceId) === String(resourceId));
      if (idx >= 0) {
        // merge quantities (prevent allocating more than available)
        const existing = { ...list[idx] };
        existing.quantity = Math.min((existing.quantity || 0) + qty, parseInt(resource.quantity || (existing.quantity + qty), 10));
        list[idx] = existing;
      } else {
        list.push({
          resourceId: String(resourceId),
          name: resource.name,
          quantity: Math.min(qty, parseInt(resource.quantity || qty, 10)),
          unit: resource.unit || ''
        });
      }
      return { ...prev, [resourceType]: list };
    });
  };

  const removeResourceFromAllocation = (resourceType, index) => {
    setAllocationData(prev => ({
      ...prev,
      [resourceType]: prev[resourceType].filter((_, i) => i !== index)
    }));
  };

  // Update resource quantities based on a passed allocation snapshot
  const updateResourceQuantities = async (allocation) => {
    const token = localStorage.getItem('token');

    // Update material quantities
    for (const material of allocation.materials || []) {
      const resource = findResource(material.resourceId);
      if (resource) {
        const newQuantity = Math.max(0, (parseInt(resource.quantity || 0, 10)) - (parseInt(material.quantity || 0, 10)));
        try {
          await axios.patch(
            `${API_BASE_URL}/resources/${resource.id}`,
            { quantity: newQuantity },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error(`Error updating material ${material.resourceId}:`, error.response?.data || error.message);
          throw error;
        }
      } else {
        throw new Error(`Material resource ${material.resourceId} not found`);
      }
    }

    // Update machine availability
    for (const machine of allocation.machines || []) {
      const resource = findResource(machine.resourceId);
      if (!resource) throw new Error(`Machine resource ${machine.resourceId} not found`);
      try {
        await axios.patch(
          `${API_BASE_URL}/resources/${resource.id}`,
          { available: false },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`Error updating machine ${machine.resourceId}:`, error.response?.data || error.message);
        throw error;
      }
    }

    // Update personnel quantities
    for (const person of allocation.personnel || []) {
      const resource = findResource(person.resourceId);
      if (resource) {
        const newQuantity = Math.max(0, (parseInt(resource.quantity || 0, 10)) - (parseInt(person.quantity || 0, 10)));
        try {
          await axios.patch(
            `${API_BASE_URL}/resources/${resource.id}`,
            { quantity: newQuantity },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error(`Error updating personnel ${person.resourceId}:`, error.response?.data || error.message);
          throw error;
        }
      } else {
        throw new Error(`Personnel resource ${person.resourceId} not found`);
      }
    }

    console.log('Resource updates completed');
  };

  // Reject the resource request — revert status to pending and add admin notes
  const rejectResourceRequest = async (complaintId, adminNotes = '') => {
    try {
      const token = localStorage.getItem('token');

      // Update complaint status back to 'pending' and write adminNotes
      await axios.patch(`${API_BASE_URL}/complaints/${complaintId}`, 
        { 
          status: 'pending',
          adminNotes: adminNotes || 'Resource request rejected by administrator'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // remove from pending resourceRequests state (or mark rejected)
      setResourceRequests(prev => prev.filter(r => String(r.complaintId) !== String(complaintId)));

      // Refresh data so supervisor/admin see pending status
      await fetchAllData();

      alert('Resource request rejected — complaint reverted to pending.');
    } catch (error) {
      console.error('Error rejecting resource request:', error);
      alert('Error processing request: ' + (error.response?.data?.message || error.message));
    }
  };

  const getAvailableResources = (type) => {
    return resources.filter(resource => 
      resource.type === type && 
      resource.available &&
      // For machines, quantity may not exist; allow them if available === true
      (type === 'machine' || (parseInt(resource.quantity || 0, 10) > 0))
    );
  };

  const getResourceUtilization = () => {
    const total = resources.length;
    const available = resources.filter(r => r.available && (parseInt(r.quantity || 0, 10) > 0)).length;
    const allocated = total - available;
    
    return {
      total,
      available,
      allocated,
      utilizationRate: total > 0 ? ((allocated / total) * 100).toFixed(1) : 0
    };
  };

  const getComplaintStats = () => {
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      underReview: complaints.filter(c => c.status === 'under_review').length,
      assigned: complaints.filter(c => c.status === 'assigned').length,
      completed: complaints.filter(c => c.status === 'completed').length,
    };
  };

  const getPendingRequestsCount = () => {
    return resourceRequests.filter(req => req.status === 'pending').length;
  };

  const findComplaintById = (complaintId) => {
    return complaints.find(complaint => String(complaint.id) === String(complaintId));
  };

  // Sort helper
  const sortBySeverityPriority = (items, getSeverity = (x) => x.severity, getPriority = (x) => x.priority) => {
    if (!Array.isArray(items)) return [];
    const order = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...items].sort((a, b) => {
      const sevA = order[(getSeverity(a) || '').toString().toLowerCase()] || 0;
      const sevB = order[(getSeverity(b) || '').toString().toLowerCase()] || 0;
      if (sevB !== sevA) return sevB - sevA;
      const priA = order[(getPriority(a) || '').toString().toLowerCase()] || 0;
      const priB = order[(getPriority(b) || '').toString().toLowerCase()] || 0;
      return priB - priA;
    });
  };

  const utilization = getResourceUtilization();
  const complaintStats = getComplaintStats();

  const sortedComplaints = sortBySeverityPriority(complaints || [], c => c.severity, c => c.priority);
  const sortedRequests = sortBySeverityPriority(
    resourceRequests.filter(req => req.status === 'pending'),
    (req) => {
      const c = complaints.find(x => String(x.id) === String(req.complaintId));
      return c?.severity || req.priority || '';
    },
    (req) => req.priority
  );

  // allocateResources: snapshot allocationData, validate, update complaint, update resources, create allocation record
  const allocateResources = async () => {
    if (!selectedRequest) return;

    // defensive: selectedRequest might have .complaintId or .id
    const complaintIdToUse = selectedRequest.complaintId ?? selectedRequest.id;

    // snapshot allocation (prevent state race)
    const allocation = {
      materials: (allocationData.materials || []).map(m => ({ ...m })),
      machines: (allocationData.machines || []).map(m => ({ ...m })),
      personnel: (allocationData.personnel || []).map(p => ({ ...p }))
    };

    try {
      const token = localStorage.getItem('token');

      // validate
      const validation = validateAllocationAgainstRequest(selectedRequest, allocation);
      if (!validation.ok) {
        alert(`Cannot allocate: ${validation.message}`);
        return;
      }

      // 1) Update complaint status to 'assigned' with assignedResources metadata
      const complaintUpdateData = {
        status: 'assigned',
        assignedResources: allocation,
        assignedAt: new Date().toISOString(),
        assignedBy: user?.id || 'admin'
      };

      await axios.patch(
        `${API_BASE_URL}/complaints/${complaintIdToUse}`,
        complaintUpdateData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      // 2) Reduce quantities / mark machines unavailable using allocation snapshot
      await updateResourceQuantities(allocation);

      // 3) Create allocation record (if endpoint available) — non-fatal
      try {
        await axios.post(
          `${API_BASE_URL}/allocations`,
          {
            complaintId: complaintIdToUse,
            allocatedMaterials: allocation.materials,
            allocatedMachines: allocation.machines,
            allocatedPersonnel: allocation.personnel,
            allocatedBy: user?.id || 'admin',
            allocatedAt: new Date().toISOString()
          },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
      } catch (allocErr) {
        console.warn('Allocations endpoint failed (non-fatal):', allocErr?.response?.data || allocErr.message);
      }

      // 4) Update local UI states to reflect assignment immediately
      setResourceRequests(prev => prev.filter(r => String(r.complaintId) !== String(complaintIdToUse)));
      setComplaints(prev => prev.map(c => String(c.id) === String(complaintIdToUse) ? { ...c, status: 'assigned', assignedResources: allocation } : c));

      // Refresh server data so Supervisor and Admin lists reflect the assignment
      await fetchAllData();

      setSelectedRequest(null);
      setAllocationData({ materials: [], machines: [], personnel: [] });

      alert('✅ Resources allocated and complaint assigned successfully!');
    } catch (err) {
      console.error('Allocation error details:', err?.response?.data || err.message || err);
      const serverMsg = err?.response?.data?.message || err?.response?.data || err.message;
      alert('Error allocating resources: ' + serverMsg);
    }
  };

  if (loading) {
    return (
      <div className="administrator-dashboard">
        <div className="dashboard-header">
          <div className="container">
            <h1>Administrator Dashboard</h1>
            <p>Welcome, {user?.name}</p>
          </div>
        </div>
        <div className="loading">Loading data from database...</div>
      </div>
    );
  }

  return (
    <div className="administrator-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Administrator Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="container">
          {/* Statistics Summary */}
          <div className="stats-summary">
            <div className="stat-card">
              <h3>Total Resources</h3>
              <div className="stat-number">{utilization.total}</div>
              <div className="stat-subtitle">
                {utilization.available} available, {utilization.allocated} allocated
              </div>
            </div>
            <div className="stat-card">
              <h3>Complaints</h3>
              <div className="stat-number">{complaintStats.total}</div>
              <div className="stat-subtitle">
                {complaintStats.pending} pending, {complaintStats.assigned} assigned
              </div>
            </div>
            <div className="stat-card">
              <h3>Pending Requests</h3>
              <div className="stat-number">{getPendingRequestsCount()}</div>
              <div className="stat-subtitle">Awaiting approval</div>
            </div>
            <div className="stat-card">
              <h3>Utilization Rate</h3>
              <div className="stat-number">{utilization.utilizationRate}%</div>
              <div className="stat-subtitle">Resource usage</div>
            </div>
          </div>

          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              Resource Management
            </button>
            <button 
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Resource Requests ({getPendingRequestsCount()})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
              onClick={() => setActiveTab('complaints')}
            >
              All Complaints ({complaints.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
              onClick={() => setActiveTab('allocations')}
            >
              Allocations ({allocations.length})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'resources' && (
              <div className="resources-section">
                <h2>Resource Management</h2>
                <div className="add-resource-form">
                  <h3>Add New Resource</h3>
                  <form onSubmit={addResource}>
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="Resource Name"
                        value={newResource.name}
                        onChange={(e) => setNewResource({...newResource, name: e.target.value})}
                        required
                      />
                      <select
                        value={newResource.type}
                        onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="machine">Machine</option>
                        <option value="material">Material</option>
                        <option value="personnel">Personnel</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={newResource.quantity}
                        onChange={(e) => setNewResource({...newResource, quantity: e.target.value})}
                        required
                        min="1"
                      />
                      <input
                        type="text"
                        placeholder="Unit (tons, pieces, etc.)"
                        value={newResource.unit}
                        onChange={(e) => setNewResource({...newResource, unit: e.target.value})}
                        required
                      />
                      <button type="submit" className="btn-primary">Add Resource</button>
                    </div>
                  </form>
                </div>

                <div className="resources-list">
                  <h3>Resource Inventory ({resources.length} items)</h3>
                  {resources.length === 0 ? (
                    <p className="no-data">No resources found in database.</p>
                  ) : (
                    <div className="resources-grid">
                      {resources.map(resource => (
                        <div key={resource.id} className="resource-card">
                          <div className="resource-header">
                            <h4>{resource.name}</h4>
                            <span className={`resource-type ${resource.type}`}>
                              {resource.type}
                            </span>
                          </div>
                          <div className="resource-details">
                            <p>
                              <strong>Quantity:</strong> 
                              {editingResource?.id === resource.id ? (
                                <div className="quantity-edit">
                                  <input
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    min="0"
                                    className="quantity-input"
                                  />
                                  <span className="quantity-unit">{resource.unit}</span>
                                </div>
                              ) : (
                                <span className="quantity-display">{resource.quantity} {resource.unit}</span>
                              )}
                            </p>
                            <p>
                              <strong>Status:</strong> 
                              <span className={`status-badge ${resource.available ? 'available' : 'unavailable'}`}>
                                {resource.available ? 'Available' : 'Unavailable'}
                              </span>
                            </p>
                          </div>
                          <div className="resource-actions">
                            <button 
                              className={`status-toggle ${resource.available ? 'available' : 'unavailable'}`}
                              onClick={() => updateResourceStatus(resource.id, !resource.available)}
                            >
                              {resource.available ? 'Mark Unavailable' : 'Mark Available'}
                            </button>
                            {editingResource?.id === resource.id ? (
                              <>
                                <button 
                                  className="btn-save"
                                  onClick={() => updateResourceQuantity(resource.id, editQuantity)}
                                  disabled={!editQuantity || isNaN(parseInt(editQuantity, 10)) || parseInt(editQuantity, 10) < 0}
                                >
                                  Save
                                </button>
                                <button 
                                  className="btn-cancel"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button 
                                className="btn-edit"
                                onClick={() => openEditQuantity(resource)}
                              >
                                Edit Quantity
                              </button>
                            )}
                          </div>
                          <p className="resource-updated">
                            <strong>Last Updated:</strong> {resource.updatedAt ? new Date(resource.updatedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="requests-section">
                <h2>Resource Requests from Supervisors ({sortedRequests.length})</h2>
                <div className="sorting-info">
                  <p>These are resource requests submitted by supervisors for road repair complaints</p>
                  <p>Display order: Critical → High → Medium → Low</p>
                </div>
                
                {sortedRequests.length === 0 ? (
                  <p className="no-data">No pending resource requests from supervisors.</p>
                ) : (
                  <div className="requests-list">
                    {sortedRequests.map(request => {
                      const complaint = findComplaintById(request.complaintId);
                      return (
                        <div key={request.id} className="request-card">
                          <div className="request-header">
                            <h4>{complaint?.title || 'Unknown Complaint'}</h4>
                            <div className="request-priority">
                              <span className={`severity-badge ${complaint?.severity || 'unknown'}`}>
                                {complaint?.severity || 'Unknown'} Severity
                              </span>
                              <span className={`priority-badge ${request.priority}`}>
                                {request.priority} Priority
                              </span>
                              <span className={`status-badge ${request.status}`}>
                                {request.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="request-details">
                            <div className="detail-column">
                              <p><strong>Supervisor ID:</strong> {request.supervisorId}</p>
                              <p><strong>Location:</strong> {complaint ? formatLocation(complaint.location) : 'Unknown location'}</p>
                              <p><strong>Problem Type:</strong> {complaint?.problemType || 'N/A'}</p>
                              <p><strong>Description:</strong> {complaint?.description || 'No description'}</p>
                              <p><strong>Estimated Days:</strong> {request.estimatedDays} days</p>
                            </div>
                            
                            <div className="detail-column">
                              <p><strong>Materials Required:</strong> {request.materials || 'Not specified'}</p>
                              <p><strong>Machines Required:</strong> {request.machines || 'Not specified'}</p>
                              <p><strong>Personnel Required:</strong> {request.personnel || 'Not specified'}</p>
                              <p><strong>Submitted:</strong> {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</p>
                            </div>
                          </div>

                          <div className="request-actions">
                            <button 
                              className="btn-allocate"
                              onClick={() => openAllocationModal(request)}
                            >
                              Allocate Resources
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => {
                                const notes = prompt('Enter rejection reason:');
                                if (notes !== null) { // User didn't cancel
                                  // pass complaint id explicitly
                                  rejectResourceRequest(request.complaintId ?? request.id, notes);
                                }
                              }}
                            >
                              Reject Request
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'complaints' && (
              <div className="complaints-section">
                <h2>All Complaints - Sorted by Severity ({sortedComplaints.length})</h2>
                <div className="sorting-info">
                  <p>Display order: Critical → High → Medium → Low</p>
                </div>
                {sortedComplaints.length === 0 ? (
                  <p className="no-data">No complaints found in database.</p>
                ) : (
                  <div className="complaints-list">
                    {sortedComplaints.map(complaint => (
                      <div key={complaint.id} className="complaint-card">
                        <div className="complaint-header">
                          <h4>{complaint.title}</h4>
                          <div className="complaint-status">
                            <span className={`status-badge ${complaint.status}`}>
                              {complaint.status}
                            </span>
                            <span className={`severity-badge ${complaint.severity}`}>
                              {complaint.severity}
                            </span>
                            <span className={`priority-badge ${complaint.priority}`}>
                              {complaint.priority}
                            </span>
                          </div>
                        </div>
                        <div className="complaint-details">
                          <p><strong>Description:</strong> {complaint.description}</p>
                          <p><strong>Location:</strong> {formatLocation(complaint.location)}</p>
                          <p><strong>Problem Type:</strong> {complaint.problemType}</p>
                          <p><strong>Resident ID:</strong> {complaint.residentId}</p>
                          <p><strong>Supervisor ID:</strong> {complaint.supervisorId || 'Not assigned'}</p>
                        </div>
                        <div className="complaint-meta">
                          <p><strong>Submitted:</strong> {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'N/A'}</p>
                          <p><strong>Last Updated:</strong> {complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : 'N/A'}</p>
                        </div>
                        {complaint.estimatedMaterials && (
                          <div className="complaint-resources">
                            <p><strong>Estimated Materials:</strong> {complaint.estimatedMaterials}</p>
                            <p><strong>Required Machines:</strong> {complaint.requiredMachines}</p>
                            <p><strong>Required Personnel:</strong> {complaint.requiredPersonnel}</p>
                            {complaint.estimatedDays && (
                              <p><strong>Estimated Days:</strong> {complaint.estimatedDays} days</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'allocations' && (
              <div className="allocations-section">
                <h2>Resource Allocations ({allocations.length})</h2>
                {allocations.length === 0 ? (
                  <p className="no-data">No allocations found.</p>
                ) : (
                  <div className="allocations-list">
                    {allocations.map(allocation => {
                      const complaint = findComplaintById(allocation.complaintId);
                      return (
                        <div key={allocation.id} className="allocation-card">
                          <div className="allocation-header">
                            <h4>Allocation #{allocation.id}</h4>
                            <span className="allocation-date">
                              {allocation.createdAt ? new Date(allocation.createdAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="allocation-details">
                            <p><strong>Complaint:</strong> {complaint?.title || 'Unknown'}</p>
                            <p><strong>Location:</strong> {complaint ? formatLocation(complaint.location) : 'Unknown location'}</p>
                            <p><strong>Allocated By:</strong> {allocation.allocatedBy}</p>
                            
                            {allocation.allocatedMaterials && allocation.allocatedMaterials.length > 0 && (
                              <div className="allocated-resources">
                                <strong>Materials:</strong>
                                <ul>
                                  {allocation.allocatedMaterials.map((material, index) => (
                                    <li key={index}>{material.name} - {material.quantity} {material.unit}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {allocation.allocatedMachines && allocation.allocatedMachines.length > 0 && (
                              <div className="allocated-resources">
                                <strong>Machines:</strong>
                                <ul>
                                  {allocation.allocatedMachines.map((machine, index) => (
                                    <li key={index}>{machine.name} - {machine.quantity || 1} {machine.unit || ''}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {allocation.allocatedPersonnel && allocation.allocatedPersonnel.length > 0 && (
                              <div className="allocated-resources">
                                <strong>Personnel:</strong>
                                <ul>
                                  {allocation.allocatedPersonnel.map((person, index) => (
                                    <li key={index}>{person.name} - {person.quantity} {person.unit}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
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

      {/* Resource Allocation Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content allocation-modal">
            <h3>Allocate Resources for Complaint</h3>
            
            {(() => {
              const complaint = findComplaintById(selectedRequest.complaintId ?? selectedRequest.id);
              return (
                <div className="request-info">
                  <p><strong>Complaint:</strong> {complaint?.title}</p>
                  <p><strong>Severity:</strong> <span className={`severity-badge ${complaint?.severity}`}>{complaint?.severity}</span></p>
                  <p><strong>Location:</strong> {complaint ? formatLocation(complaint.location) : 'Unknown location'}</p>
                  <p><strong>Supervisor ID:</strong> {selectedRequest.supervisorId}</p>
                  <p><strong>Requested Materials:</strong> {selectedRequest.materials || 'Not specified'}</p>
                  <p><strong>Requested Machines:</strong> {selectedRequest.machines || 'Not specified'}</p>
                  <p><strong>Requested Personnel:</strong> {selectedRequest.personnel || 'Not specified'}</p>
                </div>
              );
            })()}

            <div className="allocation-sections">
              {/* Materials Allocation */}
              <div className="allocation-section">
                <h4>Allocate Materials</h4>
                <div className="available-resources">
                  {getAvailableResources('material').map(resource => (
                    <div key={resource.id} className="resource-item">
                      <span>{resource.name} ({resource.quantity} {resource.unit})</span>
                      <input
                        type="number"
                        min="1"
                        max={resource.quantity}
                        placeholder="Qty"
                        onChange={(e) => {
                          const val = e.target.value;
                          // remove previous allocations for this resource
                          setAllocationData(prev => ({
                            ...prev,
                            materials: prev.materials.filter(m => String(m.resourceId) !== String(resource.id))
                          }));
                          if (val && parseInt(val, 10) > 0) {
                            addResourceToAllocation('materials', resource.id, parseInt(val, 10));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="allocated-list">
                  <strong>Allocated Materials:</strong>
                  {allocationData.materials.map((material, index) => (
                    <div key={index} className="allocated-item">
                      {material.name} - {material.quantity} {material.unit}
                      <button onClick={() => removeResourceFromAllocation('materials', index)}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Machines Allocation */}
              <div className="allocation-section">
                <h4>Allocate Machines</h4>
                <div className="available-resources">
                  {getAvailableResources('machine').map(resource => (
                    <div key={resource.id} className="resource-item">
                      <span>{resource.name}</span>
                      <button onClick={() => {
                        const exists = allocationData.machines.some(m => String(m.resourceId) === String(resource.id));
                        if (!exists) addResourceToAllocation('machines', resource.id, 1);
                      }}>
                        Allocate
                      </button>
                    </div>
                  ))}
                </div>
                <div className="allocated-list">
                  <strong>Allocated Machines:</strong>
                  {allocationData.machines.map((machine, index) => (
                    <div key={index} className="allocated-item">
                      {machine.name}
                      <button onClick={() => removeResourceFromAllocation('machines', index)}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personnel Allocation */}
              <div className="allocation-section">
                <h4>Allocate Personnel</h4>
                <div className="available-resources">
                  {getAvailableResources('personnel').map(resource => (
                    <div key={resource.id} className="resource-item">
                      <span>{resource.name} ({resource.quantity} available)</span>
                      <input
                        type="number"
                        min="1"
                        max={resource.quantity}
                        placeholder="Qty"
                        onChange={(e) => {
                          const val = e.target.value;
                          // remove previous allocations for this resource
                          setAllocationData(prev => ({
                            ...prev,
                            personnel: prev.personnel.filter(p => String(p.resourceId) !== String(resource.id))
                          }));
                          if (val && parseInt(val, 10) > 0) {
                            addResourceToAllocation('personnel', resource.id, parseInt(val, 10));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="allocated-list">
                  <strong>Allocated Personnel:</strong>
                  {allocationData.personnel.map((person, index) => (
                    <div key={index} className="allocated-item">
                      {person.name} - {person.quantity} {person.unit}
                      <button onClick={() => removeResourceFromAllocation('personnel', index)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setSelectedRequest(null);
                  setAllocationData({ materials: [], machines: [], personnel: [] });
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={allocateResources}
                disabled={
                  allocationData.materials.length === 0 &&
                  allocationData.machines.length === 0 &&
                  allocationData.personnel.length === 0
                }
              >
                Confirm Allocation
              </button>
              <button
                className="btn-reject"
                onClick={() => {
                  const notes = prompt('Enter rejection reason:');
                  if (notes !== null) {
                    // pass complaintId explicitly
                    const cid = selectedRequest.complaintId ?? selectedRequest.id;
                    rejectResourceRequest(cid, notes);
                    setSelectedRequest(null);
                  }
                }}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministratorDashboard;

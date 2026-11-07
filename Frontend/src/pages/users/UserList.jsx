
import React, { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  RefreshCw,
} from "lucide-react";
import UserForm from "./UserForm";
import "./UserList.css";

const initialUsers = [
  {
    id: 1,
    name: "Hospital Administrator",
    email: "admin@hospital.com",
    phone: "9876543210",
    role: "ADMIN",
    status: "Active",
  },
  {
    id: 2,
    name: "Dr. Rahul Sharma",
    email: "rahul@hospital.com",
    phone: "9876543211",
    role: "DOCTOR",
    status: "Active",
  },
  {
    id: 3,
    name: "Priya Nurse",
    email: "priya@hospital.com",
    phone: "9876543212",
    role: "NURSE",
    status: "Active",
  },
  {
    id: 4,
    name: "Reception Staff",
    email: "reception@hospital.com",
    phone: "9876543213",
    role: "RECEPTIONIST",
    status: "Inactive",
  },
];

export default function UserList() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        user.name.toLowerCase().includes(searchText) ||
        user.email.toLowerCase().includes(searchText) ||
        user.phone.includes(search);

      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeCount = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveCount = users.length - activeCount;

  const handleAdd = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSave = (formData) => {
    if (editingUser) {
      setUsers((previous) =>
        previous.map((user) =>
          user.id === editingUser.id
            ? { ...user, ...formData }
            : user
        )
      );
    } else {
      setUsers((previous) => [
        ...previous,
        {
          ...formData,
          id: Date.now(),
        },
      ]);
    }

    setShowForm(false);
    setEditingUser(null);
  };

  const handleToggleStatus = (id) => {
    setUsers((previous) =>
      previous.map((user) =>
        user.id === id
          ? {
              ...user,
              status:
                user.status === "Active" ? "Inactive" : "Active",
            }
          : user
      )
    );
  };

  const handleDelete = (user) => {
    if (user.role === "ADMIN") {
      alert("Administrator accounts cannot be deleted here.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (confirmed) {
      setUsers((previous) =>
        previous.filter((item) => item.id !== user.id)
      );
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage hospital staff accounts and access permissions.</p>
        </div>

        <button className="user-add-btn" onClick={handleAdd}>
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="users-stats">
        <div className="user-stat-card">
          <div className="user-stat-icon blue">
            <Users size={23} />
          </div>
          <div>
            <span>Total Users</span>
            <h2>{users.length}</h2>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon green">
            <UserCheck size={23} />
          </div>
          <div>
            <span>Active Users</span>
            <h2>{activeCount}</h2>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon orange">
            <UserX size={23} />
          </div>
          <div>
            <span>Inactive Users</span>
            <h2>{inactiveCount}</h2>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon purple">
            <ShieldCheck size={23} />
          </div>
          <div>
            <span>User Roles</span>
            <h2>{new Set(users.map((user) => user.role)).size}</h2>
          </div>
        </div>
      </div>

      <div className="users-content">
        <div className="users-toolbar">
          <div className="user-search">
            <Search size={19} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="LAB_TECH">Lab Technician</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="PATIENT">Patient</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            className="user-reset-btn"
            onClick={() => {
              setSearch("");
              setRoleFilter("All");
              setStatusFilter("All");
            }}
          >
            <RefreshCw size={16} /> Reset
          </button>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>{user.phone}</td>

                  <td>
                    <span className="user-role">
                      {user.role.replace("_", " ")}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`user-status ${
                        user.status === "Active" ? "active" : "inactive"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td>
                    <div className="user-actions">
                      <button
                        title="Edit user"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        title={
                          user.status === "Active"
                            ? "Deactivate user"
                            : "Activate user"
                        }
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.status === "Active" ? (
                          <UserX size={17} />
                        ) : (
                          <UserCheck size={17} />
                        )}
                      </button>

                      <button
                        className="delete-action"
                        title="Delete user"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="users-empty">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="users-footer">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {showForm && (
        <div
          className="user-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div
            className="user-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-modal-header">
              <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={21} />
              </button>
            </div>

            <UserForm
              initialData={editingUser}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

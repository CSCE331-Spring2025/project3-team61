import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export const Route = createFileRoute('/manager-employee')({
  component: ManagerEmployee,
})

interface Employee {
  id: number;
  name: string;
  admin: boolean;
 }

 // TODO add functionality to "Edit Employee" Button
 //const handleEditButton: 

function ManagerEmployee() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminCheckbox, setAdminCheckbox] = useState(false);

  const [newEmployeeModalOpen, setNewEmployeeModal] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeAdmin, setNewEmployeeAdmin] = useState(false);

  useEffect(() => {
    const getEmployees = () => {
      fetch("/api/employee")
        .then((res) => res.json())
        .then((res_json) => {
          setEmployees(res_json);
        });
};

      getEmployees();
  }, []);

  const openModal = (employee: Employee) => {
  setSelectedEmployee(employee);
  setAdminCheckbox(employee.admin);
  setModalOpen(true);
};

  const closeModal = () => {
    setSelectedEmployee(null);
    setModalOpen(false);
  };

  const handleSaveAdminChange = async () => {
    if (!selectedEmployee) return;
  
    const res = await fetch(`/api/employee/${selectedEmployee.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: adminCheckbox }),
    });
  
    if (res.ok) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id ? { ...emp, admin: adminCheckbox } : emp
        )
      );
      closeModal();
    }
  };
  
  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
  
    const res = await fetch(`/api/employee/${selectedEmployee.id}`, {
      method: "DELETE",
    });
  
    if (res.ok) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== selectedEmployee.id));
      closeModal();
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return;

    const res = await fetch("/api/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEmployeeName, admin: newEmployeeAdmin }),
    });

    if (res.ok) {
      const { employee } = await res.json();
      setEmployees((prev) => [...prev, employee]);
      closeAddModal();
    }
  };

  const closeAddModal = () => { // [NEW]
    setNewEmployeeName("");
    setNewEmployeeAdmin(false);
    setNewEmployeeModal(false);
  };

  const admins = employees.filter((e) => e.admin);
  const non_admins = employees.filter((e) => !e.admin);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manager Employees</h1>

      {// admin
      }

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Admins</h2>
        <div className="border rounded-lg p-4 shadow-sm bg-white">
              {admins.map((employee) => (
                <div key={employee.id} className="flex justify-between p-2 border-b">
                  <span>{employee.name}</span>
                  <button className="bg-gray-100 p-2 rounded"
                  onClick={() => openModal(employee)}
                  >
                    Edit Employee
                  </button>
                </div>
              ))}
        </div>
        <Modal isOpen={modalOpen} onRequestClose={closeModal} className="bg-white p-6 rounded shadow-lg w-96 mx-auto mt-20">
          <h2 className="font-bold text-xl">Edit Employee</h2>
          <div className="flex flex-col gap-4">
            <p className="text-gray-400 font-bold">{selectedEmployee?.name}</p>

            <label className="flex justify-end space-x-2">
              <input
                type="checkbox"
                checked={adminCheckbox}
                onChange={(e) => setAdminCheckbox(e.target.checked)}
                className="form-checkbox h-5 w-5 text-slate-700"
              />
              Admin
            </label>

            <button
              onClick={handleSaveAdminChange}
              className="bg-slate-700 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
            <button
              onClick={handleDeleteEmployee}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Delete Employee
            </button>
            <button
              onClick={closeModal}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </Modal>
      </div>

      {// non-admin
      }
      <div>
        <h2 className="text-2xl font-semibold mb-3">Non-Admins</h2>
        <div className="border rounded-lg p-4 shadow-sm bg-white">
              {non_admins.map((employee) => (
                <div key={employee.id} className="flex justify-between p-2 border-b">
                  <span>{employee.name}</span>
                  <button className="bg-gray-100 p-2 rounded"
                  onClick={() => openModal(employee)}
                  >
                    Edit Employee
                  </button>
                </div>
              ))}
        </div>
      </div>
      <Modal isOpen={modalOpen} onRequestClose={closeModal} className="bg-white p-6 rounded shadow-lg w-96 mx-auto mt-20">
          <h2 className="font-bold text-xl">Edit Employee</h2>
          <div className="flex flex-col gap-4">
            <p className="text-gray-400 font-bold">{selectedEmployee?.name}</p>

            <label className="flex justify-end space-x-2">
              <input
                type="checkbox"
                checked={adminCheckbox}
                onChange={(e) => setAdminCheckbox(e.target.checked)}
                className="form-checkbox h-5 w-5 text-slate-700"
              />
              Admin
            </label>

            <button
              onClick={handleSaveAdminChange}
              className="bg-slate-700 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
            <button
              onClick={handleDeleteEmployee}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Delete Employee
            </button>
            <button
              onClick={closeModal}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </Modal>
        
        {//add employee
        }
        <Modal isOpen={newEmployeeModalOpen} onRequestClose={closeAddModal} className="bg-white p-6 rounded shadow-lg w-96 mx-auto mt-20">
        <h2 className="font-bold text-xl">Add Employee</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Employee Name"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            className="border px-4 py-2 rounded"
          />

          <label className="flex justify-end space-x-2">
            <input
              type="checkbox"
              checked={newEmployeeAdmin}
              onChange={(e) => setNewEmployeeAdmin(e.target.checked)}
              className="form-checkbox h-5 w-5 text-slate-700"
            />
            Admin
          </label>

          <button onClick={handleAddEmployee} className="bg-slate-700 text-white px-4 py-2 rounded">
            Add Employee
          </button>
          <button onClick={closeAddModal} className="bg-gray-300 text-black px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </Modal>

        <div className="flex justify-center mt-10">
          <button
            className="bg-slate-600 text-white px-6 py-3 rounded"
            onClick={() => setNewEmployeeModal(true)}
          >
            Add Employee
          </button>
        </div>
    </div>
  );
}
              

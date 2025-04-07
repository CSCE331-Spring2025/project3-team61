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
                  //onClick={() => handleEditButton(product)}
                  >
                    Edit Employee
                  </button>
                </div>
              ))}
        </div>
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
                  //onClick={() => handleEditButton(product)}
                  >
                    Edit Employee
                  </button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
              

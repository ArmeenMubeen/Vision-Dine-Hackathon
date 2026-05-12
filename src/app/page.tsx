import React from 'react';
import { Plus } from 'lucide-react';

const mockDishes = [
  { itemId: '001', name: 'Margherita Pizza', category: 'Main Course', dishId: 'D-101', baseDimension: '30cm' },
  { itemId: '002', name: 'Chicken Alfredo', category: 'Main Course', dishId: 'D-102', baseDimension: '25cm' },
  { itemId: '003', name: 'Classic Cheeseburger', category: 'Main Course', dishId: 'D-103', baseDimension: '15cm' },
  { itemId: '004', name: 'Caesar Salad', category: 'Appetizer', dishId: 'D-104', baseDimension: '20cm' },
  { itemId: '005', name: 'Chocolate Lava Cake', category: 'Dessert', dishId: 'D-105', baseDimension: '10cm' },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage your Dishes</h1>
            <p className="text-gray-500 mt-1">Analyze which dish is better.</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button className="px-4 py-2 border border-gray-300 text-black rounded-md hover:bg-gray-50 transition-colors font-medium">
              Export Data
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center font-medium">
              <Plus className="w-5 h-5 mr-2" />
              Create New Dish
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Item ID</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Dish Name</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Category</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Dish ID</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Base Dimension</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockDishes.map((dish, index) => (
                <tr 
                  key={dish.itemId} 
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === mockDishes.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-6 py-4 text-sm text-gray-600">{dish.itemId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{dish.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dish.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dish.dishId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dish.baseDimension}</td>
                  <td className="px-6 py-4 text-sm">
                    <a href="#" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                      View AR
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

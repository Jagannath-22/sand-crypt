import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Users, LogOut, Ban, CheckCircle, Loader2, Key } from 'lucide-react';

// NOTE: Assumes fetchClient is configured to send 'credentials: "include"'
// If you don't have this utility, replace 'fetchClient' calls with standard fetch.
// For example: await fetchClient('/api/admin/login', { method: 'POST', body: JSON.stringify(credentials) })
const fetchClient = async (endpoint, options = {}) => {
    const url = `/api${endpoint}`; // Assumes proxy or direct path to backend
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers },
    };

    try {
        const response = await fetch(url, finalOptions);

        // Specific handling for Unauthorized responses (401)
        if (response.status === 401) {
            // For admin logout/session expiration
            throw new Error("Unauthorized: Session expired or invalid.");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.error || errorData.message || `API request failed with status ${response.status}`);
        }

        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return null; // No content
        }
        return await response.json();
    } catch (error) {
        console.error("Admin fetch error:", error);
        throw error;
    }
};


// --- Main Component ---
const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [users, setUsers] = useState([]);
    const [loginLoading, setLoginLoading] = useState(false);
    const [banLoading, setBanLoading] = useState(null); // Holds userId being banned/unbanned

    // --- Authentication and State Handlers ---
        // 1. Fetch Users for Dashboard

     const fetchUsers = useCallback(async () => {
        try {
            const data = await fetchClient('/admin/users');
            setUsers(data || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            // If fetch fails, it might be due to 401 (session expiry)
            if (error.message.includes("Unauthorized")) {
                setIsAuthenticated(false);
                toast.error("Admin session expired. Please log in.");
            } else {
                toast.error(error.message || 'Failed to load user list.');
            }
            throw error; // Re-throw to handle in checkAuthStatus
        }
    }, []);


    // 2. Check if the admin is already logged in (by trying to access a protected route)
  const checkAuthStatus = useCallback(async () => {
  try {
    const data = await fetchClient('/admin/check'); // expects 200 or throws 401
    // Accept either { admin: {...} } OR { _id, username, role }
    const admin = data?.admin ?? data;
    if (admin && admin._id) {
      setIsAuthenticated(true);
      // fetch users but don't fail silently — show toast if it fails
      try {
        await fetchUsers();
      } catch (err) {
        console.error('Failed to load users after auth:', err);
      }
    } else {
      setIsAuthenticated(false);
    }
  } catch (error) {
    // 401 or network error -> treat as logged out
    setIsAuthenticated(false);
  } finally {
    setLoading(false);
  }
}, [fetchUsers]);


   
    // 3. Admin Login Handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        try {
            await fetchClient('/admin/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            toast.success('Admin login successful!');
            setIsAuthenticated(true);
            await fetchUsers(); // Fetch data immediately after successful login
        } catch (error) {
            const msg = error.message.includes('Invalid') ? "Invalid credentials." : "Login failed.";
            toast.error(msg);
            console.error(error);
        } finally {
            setLoginLoading(false);
        }
    };

    // 4. Admin Logout Handler
    const handleLogout = async () => {
        try {
            await fetchClient('/admin/logout', { method: 'POST' });
            setIsAuthenticated(false);
            setUsers([]);
            toast.success('Admin logged out.');
        } catch (error) {
            toast.error('Logout failed.');
            console.error(error);
        }
    };

    // 5. Ban/Unban Handler
    const handleToggleBan = async (userId, currentStatus) => {
        setBanLoading(userId);
        const newStatus = !currentStatus;
        try {
            await fetchClient(`/admin/users/${userId}/ban`, {
                method: 'PUT',
                body: JSON.stringify({ banStatus: newStatus })
            });
            
            // Update local state without re-fetching all users
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user._id === userId ? { ...user, isBanned: newStatus } : user
                )
            );

            toast.success(`User ${newStatus ? 'banned' : 'unbanned'} successfully.`);
        } catch (error) {
            toast.error(error.message || `Failed to change ban status.`);
            console.error(error);
        } finally {
            setBanLoading(null);
        }
    };

    // Initial check on mount
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // --- Loading State Renderer ---
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <p>Checking Admin Status...</p>
            </div>
        );
    }
    
    // --- Login Form Renderer ---
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <form onSubmit={handleLogin} className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-blue-500/30">
                    <h2 className="text-3xl font-extrabold text-center text-white flex items-center justify-center">
                        <Shield className="w-7 h-7 mr-2 text-blue-400" />
                        Admin Portal
                    </h2>
                    <p className="text-center text-gray-400">Secure Access for User Management</p>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                placeholder="admin"
                                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 transition"
                                required
                            />
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                placeholder="********"
                                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 transition"
                                required
                            />
                             <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition duration-150 ease-in-out disabled:bg-blue-400"
                    >
                        {loginLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Authenticating...
                            </>
                        ) : (
                            'Secure Login'
                        )}
                    </button>
                </form>
            </div>
        );
    }

    // --- Admin Dashboard Renderer ---
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-700 mb-8">
                <h1 className="text-4xl font-extrabold text-blue-400 flex items-center">
                    <Shield className="w-8 h-8 mr-3" />
                    System Dashboard
                </h1>
                <div className="flex space-x-4 mt-4 sm:mt-0">
                    <button
                        onClick={fetchUsers}
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-200 bg-gray-700 hover:bg-gray-600 transition"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Refresh Users
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </header>

            <h2 className="text-2xl font-semibold mb-4 text-gray-200">User Management ({users.length} Total)</h2>
            
            <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Mobile</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {users.map((user) => (
                            <tr key={user._id} className={`${user.isBanned ? 'bg-red-900/20 hover:bg-red-900/30' : 'hover:bg-gray-700/50'} transition duration-150`}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{user.username}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{user.mobile}</td>
                                <td className="px-4 py-4 text-xs text-gray-500 truncate max-w-xs">{user._id}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                    <span className={`px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {user.isBanned ? 'BANNED' : 'Active'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button
                                        onClick={() => handleToggleBan(user._id, user.isBanned)}
                                        disabled={banLoading === user._id}
                                        className={`flex items-center justify-center w-24 mx-auto py-1 px-3 rounded-lg text-white text-xs transition duration-150 
                                            ${user.isBanned 
                                                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-500' 
                                                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-500'
                                            }`}
                                    >
                                        {banLoading === user._id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : user.isBanned ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" /> Unban
                                            </>
                                        ) : (
                                            <>
                                                <Ban className="w-3 h-3 mr-1" /> Ban
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    No users found or error fetching data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default AdminPage;

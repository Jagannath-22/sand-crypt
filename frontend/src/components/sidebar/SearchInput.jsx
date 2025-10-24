// frontend/src/components/sidebar/SearchInput.jsx
import React, { useState } from 'react';
import { IoSearchSharp } from "react-icons/io5";
import toast from 'react-hot-toast';
import fetchClient from '../../utils/fetchClient.js';

const SearchInput = ({ setSearchedUser, setInviteUser }) => {
    const [search, setSearch] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!search) return;

        setSearchedUser(null);
        setInviteUser(null);

        try {
            const user = await fetchClient(`/api/users/search?query=${search}`);
            setSearchedUser(user);
        } catch (error) {
            if (error.message.includes("User not found")) {
                toast.error("User not found on Sandcrypt.");
                setInviteUser(search);
            } else {
                console.error("Error searching for user:", error);
                toast.error(error.message || "An error occurred during search.");
            }
            setSearchedUser(null);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='flex items-center gap-2'>
            
            <input
                type='text'
                placeholder='Search by name or number...'
                className='input input-bordered rounded-full'
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value === "") {
                        setSearchedUser(null);
                        setInviteUser(null);
                    }
                }}
            />
            <button type='submit' className='btn btn-circle bg-sky-500 text-white'>
                <IoSearchSharp className='w-6 h-6 outline-none'/>
            </button>
        </form>
    );
};

export default SearchInput;
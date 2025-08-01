import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import loginIcons from '../assest/signin.gif';
import SummaryApi from '../common';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import imageTobase64 from '../helpers/imageTobase64';

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState({ strength: 'weak', isValid: false })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [data, setData] = useState({
        email: "",
        password: "",
        name: "",
        confirmPassword: "",
        profilePic: "",
    })
    const navigate = useNavigate()

    const handleOnChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const handleUploadPic = async (e) => {
        const file = e.target.files[0]

        const imagePic = await imageTobase64(file)

        setData((preve) => {
            return {
                ...preve,
                profilePic: imagePic
            }
        })

    }

    const handlePasswordStrengthChange = (strengthInfo) => {
        setPasswordStrength(strengthInfo)
    }

    const validateForm = () => {
        const errors = []

        if (!data.name.trim()) {
            errors.push("Name is required")
        }

        if (!data.email.trim()) {
            errors.push("Email is required")
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            errors.push("Please enter a valid email address")
        }

        if (!data.password) {
            errors.push("Password is required")
        } else if (!passwordStrength.isValid) {
            errors.push("Password does not meet security requirements")
        }

        if (!data.confirmPassword) {
            errors.push("Please confirm your password")
        } else if (data.password !== data.confirmPassword) {
            errors.push("Passwords do not match")
        }

        return errors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error))
            return
        }

        setIsSubmitting(true)

        try {
            const dataResponse = await fetch(SummaryApi.signUP.url, {
                method: SummaryApi.signUP.method,
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(data)
            })

            const dataApi = await dataResponse.json()

            if (dataApi.success) {
                toast.success(dataApi.message)
                navigate("/login")
            } else if (dataApi.error) {
                if (dataApi.errors && Array.isArray(dataApi.errors)) {
                    dataApi.errors.forEach(error => toast.error(error))
                } else {
                    toast.error(dataApi.message || "Registration failed")
                }
            }
        } catch (error) {
            toast.error("Network error. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id='signup'>
            <div className='mx-auto container p-4'>

                <div className='bg-white p-5 w-full max-w-md mx-auto shadow-lg rounded-lg'>

                    <div className='w-20 h-20 mx-auto relative overflow-hidden rounded-full'>
                        <div>
                            <img src={data.profilePic || loginIcons} alt='login icons' />
                        </div>
                        <form>
                            <label>
                                <div className='text-xs bg-opacity-80 bg-slate-200 pb-4 pt-2 cursor-pointer text-center absolute bottom-0 w-full'>
                                    Upload  Photo
                                </div>
                                <input type='file' className='hidden' onChange={handleUploadPic} />
                            </label>
                        </form>
                    </div>

                    <form className='pt-6 flex flex-col gap-3' onSubmit={handleSubmit}>
                        <div className='grid'>
                            <label className='font-medium text-gray-700'>Name : </label>
                            <div className='bg-slate-100 p-2 rounded'>
                                <input
                                    type='text'
                                    placeholder='Enter your full name'
                                    name='name'
                                    value={data.name}
                                    onChange={handleOnChange}
                                    required
                                    className='w-full h-full outline-none bg-transparent' />
                            </div>
                        </div>
                        <div className='grid'>
                            <label className='font-medium text-gray-700'>Email : </label>
                            <div className='bg-slate-100 p-2 rounded'>
                                <input
                                    type='email'
                                    placeholder='Enter your email address'
                                    name='email'
                                    value={data.email}
                                    onChange={handleOnChange}
                                    required
                                    className='w-full h-full outline-none bg-transparent' />
                            </div>
                        </div>

                        <div>
                            <label className='font-medium text-gray-700'>Password : </label>
                            <div className='bg-slate-100 p-2 flex rounded'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder='Create a strong password'
                                    value={data.password}
                                    name='password'
                                    onChange={handleOnChange}
                                    required
                                    className='w-full h-full outline-none bg-transparent' />
                                <div className='cursor-pointer text-xl' onClick={() => setShowPassword((preve) => !preve)}>
                                    <span>
                                        {
                                            showPassword ? (
                                                <FaEyeSlash />
                                            )
                                                :
                                                (
                                                    <FaEye />
                                                )
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Password Strength Indicator */}
                            <PasswordStrengthIndicator
                                password={data.password}
                                onStrengthChange={handlePasswordStrengthChange}
                            />
                        </div>

                        <div>
                            <label className='font-medium text-gray-700'>Confirm Password : </label>
                            <div className='bg-slate-100 p-2 flex rounded'>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder='Confirm your password'
                                    value={data.confirmPassword}
                                    name='confirmPassword'
                                    onChange={handleOnChange}
                                    required
                                    className='w-full h-full outline-none bg-transparent' />

                                <div className='cursor-pointer text-xl' onClick={() => setShowConfirmPassword((preve) => !preve)}>
                                    <span>
                                        {
                                            showConfirmPassword ? (
                                                <FaEyeSlash />
                                            )
                                                :
                                                (
                                                    <FaEye />
                                                )
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Password Match Indicator */}
                            {data.confirmPassword && (
                                <div className={`mt-1 text-sm ${data.password === data.confirmPassword
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}>
                                    {data.password === data.confirmPassword
                                        ? '✓ Passwords match'
                                        : '✗ Passwords do not match'
                                    }
                                </div>
                            )}
                        </div>

                        <button
                            type='submit'
                            disabled={isSubmitting || !passwordStrength.isValid || data.password !== data.confirmPassword}
                            className={`px-6 py-2 w-full max-w-[200px] rounded-full transition-all mx-auto block mt-6 font-medium ${isSubmitting || !passwordStrength.isValid || data.password !== data.confirmPassword
                                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                                }`}
                        >
                            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                        </button>

                    </form>

                    <p className='my-5 text-center'>Already have account ? <Link to={"/login"} className=' text-red-600 hover:text-red-700 hover:underline'>Login</Link></p>
                </div>

            </div>
        </section>
    )
}

export default SignUp
import React, { useContext, useEffect, useState } from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import loginIcons from '../assest/signin.gif';
import SummaryApi from '../common';
import Context from '../context';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [data, setData] = useState({
        email: "",
        password: ""
    })
    const [isLocked, setIsLocked] = useState(false)
    const [lockoutMessage, setLockoutMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showAttemptPopup, setShowAttemptPopup] = useState(false)
    const [lockoutTimer, setLockoutTimer] = useState(0)
    const [remainingAttempts, setRemainingAttempts] = useState(5)
    const [showAttemptsWarning, setShowAttemptsWarning] = useState(false)
    const [currentAttemptInfo, setCurrentAttemptInfo] = useState({ attempt: 0, message: '' })
    const [captchaToken, setCaptchaToken] = useState(null)
    const [captchaError, setCaptchaError] = useState("")

    const navigate = useNavigate()
    const { fetchUserDetails, fetchUserAddToCart } = useContext(Context)

    // Timer effect for countdown
    useEffect(() => {
        let interval = null;
        if (lockoutTimer > 0) {
            interval = setInterval(() => {
                setLockoutTimer(timer => {
                    if (timer <= 1) {
                        setIsLocked(false)
                        setLockoutMessage("")
                        setShowAttemptPopup(false)
                        setRemainingAttempts(5)
                        setShowAttemptsWarning(false)
                        toast.info("🔓 Account unlocked. You can try logging in again.")
                        return 0
                    }
                    return timer - 1
                })
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [lockoutTimer])

    const handleOnChange = (e) => {
        const { name, value } = e.target

        setData((preve) => {
            return {
                ...preve,
                [name]: value
            }
        })
    }

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const showAttemptPopupMessage = (attemptNumber, remaining, isLocked = false) => {
        const attemptInfo = {
            attempt: attemptNumber,
            remaining: remaining,
            isLocked: isLocked,
            message: isLocked
                ? "Account has been locked due to too many failed attempts!"
                : `Login attempt ${attemptNumber} failed. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        }

        setCurrentAttemptInfo(attemptInfo)
        setShowAttemptPopup(true)

        // Auto-close popup after 4 seconds if not locked
        if (!isLocked) {
            setTimeout(() => {
                setShowAttemptPopup(false)
            }, 4000)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate captcha
        if (!captchaToken) {
            setCaptchaError("Please complete the captcha verification")
            toast.error("Please complete the captcha verification")
            return
        }

        setCaptchaError("")
        setIsLoading(true)

        try {
            const dataResponse = await fetch(SummaryApi.signIn.url, {
                method: SummaryApi.signIn.method,
                credentials: 'include',
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    ...data,
                    captchaToken: captchaToken
                })
            })

            const dataApi = await dataResponse.json()

            if (dataApi.success) {
                toast.success(dataApi.message)
                setIsLocked(false)
                setLockoutMessage("")
                setShowAttemptPopup(false)
                setLockoutTimer(0)
                setRemainingAttempts(5)
                setShowAttemptsWarning(false)
                navigate('/')
                fetchUserDetails()
                fetchUserAddToCart()
            }

            if (dataApi.error) {
                // Handle brute-force prevention specific errors
                if (dataApi.lockout) {
                    setIsLocked(true)
                    setLockoutMessage(dataApi.message)
                    setShowAttemptsWarning(false)

                    // Show popup for lockout (5th attempt)
                    if (dataApi.isNewLockout) {
                        setLockoutTimer(5 * 60) // Always 5 minutes = 300 seconds
                        showAttemptPopupMessage(5, 0, true)
                        toast.error(`🔒 Account Blocked! Too many failed attempts.`)
                    } else {
                        toast.error(`🔒 ${dataApi.message}`)
                    }

                    // Set timer if not already set
                    if (!lockoutTimer) {
                        setLockoutTimer(5 * 60) // Always 5 minutes
                    }
                } else if (dataResponse.status === 429) {
                    // Rate limiting error
                    toast.error(`⚠️ ${dataApi.message}`)
                } else if (dataApi.remainingAttempts !== undefined && dataApi.attemptNumber !== undefined) {
                    // Failed attempt with server-provided attempt info - PRIORITY HANDLER
                    setRemainingAttempts(dataApi.remainingAttempts)
                    setShowAttemptsWarning(true)

                    // Show popup for this attempt
                    showAttemptPopupMessage(dataApi.attemptNumber, dataApi.remainingAttempts)

                    // Enhanced error message to match the desired format
                    if (dataApi.remainingAttempts > 0) {
                        toast.error(`⚠️ Invalid email or password.\nWarning: ${dataApi.remainingAttempts} attempt(s) remaining before account lockout.`, {
                            position: "top-center",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            style: {
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca'
                            }
                        })
                    } else {
                        toast.error(`❌ ${dataApi.message}`)
                    }
                } else if (dataApi.message.includes("attempts remaining")) {
                    // Failed attempt with remaining attempts warning (fallback)
                    const attemptMatch = dataApi.message.match(/(\d+) attempts remaining/)
                    if (attemptMatch) {
                        const remaining = parseInt(attemptMatch[1])
                        const attemptNumber = 5 - remaining
                        setRemainingAttempts(remaining)
                        setShowAttemptsWarning(true)

                        // Show popup for this attempt
                        showAttemptPopupMessage(attemptNumber, remaining)
                    }
                    toast.error(`❌ ${dataApi.message}`)
                } else {
                    // Regular error - check if it's a failed login attempt
                    if (dataApi.message.includes("Invalid") ||
                        dataApi.message.includes("not found") ||
                        dataApi.message.includes("Password") ||
                        dataApi.message.includes("check") ||
                        dataApi.message.includes("wrong") ||
                        dataApi.message.includes("incorrect")) {

                        // This is a failed login attempt - show popup
                        if (remainingAttempts > 1) {
                            const newRemaining = remainingAttempts - 1
                            const attemptNumber = 5 - newRemaining
                            setRemainingAttempts(newRemaining)
                            setShowAttemptsWarning(true)

                            // Show popup for this attempt
                            showAttemptPopupMessage(attemptNumber, newRemaining)
                            toast.error(`❌ Wrong password! ${newRemaining} attempts remaining.`)
                        } else {
                            // This would be the 5th attempt - lock account
                            setIsLocked(true)
                            setLockoutTimer(5 * 60) // 5 minutes
                            setLockoutMessage("Account locked due to too many failed attempts. Please try again in 5 minutes.")
                            showAttemptPopupMessage(5, 0, true)
                            toast.error(`🔒 Account locked! Too many failed attempts.`)
                        }
                    } else {
                        // Non-login related error
                        toast.error(dataApi.message)
                    }
                }
            }
        } catch (error) {
            console.error("Login error:", error)
            toast.error("An error occurred during login. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token)
        setCaptchaError("")
    }

    const handleCaptchaExpired = () => {
        setCaptchaToken(null)
        setCaptchaError("Captcha expired. Please verify again.")
    }

    const handleCaptchaError = () => {
        setCaptchaToken(null)
        setCaptchaError("Captcha verification failed. Please try again.")
    }

    console.log("data login", data)

    return (
        <section id='login'>
            <div className='mx-auto container p-4'>

                <div className='bg-white p-5 w-full max-w-sm mx-auto relative'>

                    {/* TOP BLOCK MESSAGE BOX - Most Prominent */}
                    {isLocked && (
                        <div className='bg-red-600 text-white p-4 rounded-lg mb-6 text-center shadow-lg border-2 border-red-700'>
                            <div className='flex items-center justify-center mb-2'>
                                <span className='text-2xl mr-2'>🚫</span>
                                <h2 className='text-lg font-bold'>ACCOUNT BLOCKED</h2>
                            </div>
                            <p className='text-sm mb-2'>
                                Too many failed login attempts detected
                            </p>
                            <div className='bg-red-700 rounded p-2 mt-2'>
                                <p className='font-semibold'>
                                    Unlock in: {formatTime(lockoutTimer)}
                                </p>
                            </div>
                            <p className='text-xs mt-2 opacity-90'>
                                Please wait before trying again for security reasons
                            </p>
                        </div>
                    )}

                    {/* Attempt Popup Modal - Shows for every attempt */}
                    {showAttemptPopup && (
                        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                            <div className='bg-white p-6 rounded-lg shadow-xl max-w-md mx-4'>
                                <div className='text-center'>
                                    {currentAttemptInfo.isLocked ? (
                                        <>
                                            <div className='text-6xl mb-4'>🔒</div>
                                            <h2 className='text-xl font-bold text-red-600 mb-2'>Account Blocked!</h2>
                                            <p className='text-gray-700 mb-4'>
                                                Your account has been temporarily blocked due to 5 failed login attempts.
                                            </p>
                                            <div className='bg-red-100 border border-red-300 rounded p-3 mb-4'>
                                                <p className='text-red-700 font-semibold'>
                                                    Time remaining: {formatTime(lockoutTimer)}
                                                </p>
                                            </div>
                                            <p className='text-sm text-gray-600 mb-4'>
                                                Please wait for 5 minutes before attempting to login again.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className='text-5xl mb-4'>❌</div>
                                            <h2 className='text-xl font-bold text-orange-600 mb-2'>
                                                Login Attempt {currentAttemptInfo.attempt} Failed
                                            </h2>
                                            <p className='text-gray-700 mb-4'>
                                                {currentAttemptInfo.message}
                                            </p>
                                            <div className='bg-yellow-100 border border-yellow-300 rounded p-3 mb-4'>
                                                <p className='text-yellow-700 font-semibold'>
                                                    {currentAttemptInfo.remaining} attempt{currentAttemptInfo.remaining !== 1 ? 's' : ''} left before lockout
                                                </p>
                                            </div>
                                            <p className='text-sm text-gray-600 mb-4'>
                                                Please check your credentials and try again.
                                            </p>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowAttemptPopup(false)}
                                        className={`px-4 py-2 rounded transition-colors text-white ${currentAttemptInfo.isLocked
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-orange-600 hover:bg-orange-700'
                                            }`}
                                    >
                                        {currentAttemptInfo.isLocked ? 'Close' : 'Try Again'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='w-20 h-20 mx-auto'>
                        <img src={loginIcons} alt='login icons' />
                    </div>

                    {/* Security Notice in Form */}
                    {isLocked && (
                        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                            <div className='flex items-center'>
                                <span className='text-lg mr-2'>🔒</span>
                                <div className='flex-1'>
                                    <strong>Account Blocked</strong>
                                    <p className='text-sm'>{lockoutMessage}</p>
                                    {lockoutTimer > 0 && (
                                        <p className='text-sm font-semibold mt-1'>
                                            Unlock in: {formatTime(lockoutTimer)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Attempts Warning */}
                    {showAttemptsWarning && !isLocked && (
                        <div className='bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4'>
                            <div className='flex items-center'>
                                <span className='text-lg mr-2'>⚠️</span>
                                <div className='flex-1'>
                                    <strong>Login Attempts Warning</strong>
                                    <p className='text-sm'>
                                        {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before account lockout
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className='pt-6 flex flex-col gap-2' onSubmit={handleSubmit}>
                        {/* Locked Message Above Email */}
                        {isLocked && (
                            <div className='bg-red-50 border-l-4 border-red-500 p-3 mb-4'>
                                <div className='flex items-center'>
                                    <span className='text-red-500 text-xl mr-2'>🔒</span>
                                    <div>
                                        <p className='text-red-700 font-semibold text-sm'>Account Locked</p>
                                        <p className='text-red-600 text-xs'>
                                            Too many failed attempts. Try again in {formatTime(lockoutTimer)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className='grid'>
                            <label>Email : </label>
                            <div className={`bg-slate-100 p-2 ${isLocked ? 'opacity-50' : ''}`}>
                                <input
                                    type='email'
                                    placeholder='enter email'
                                    name='email'
                                    value={data.email}
                                    onChange={handleOnChange}
                                    disabled={isLocked || isLoading}
                                    className='w-full h-full outline-none bg-transparent disabled:opacity-50' />
                            </div>
                        </div>

                        <div>
                            <label>Password : </label>
                            <div className={`bg-slate-100 p-2 flex ${isLocked ? 'opacity-50' : ''}`}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder='enter password'
                                    value={data.password}
                                    name='password'
                                    onChange={handleOnChange}
                                    disabled={isLocked || isLoading}
                                    className='w-full h-full outline-none bg-transparent disabled:opacity-50' />
                                <div
                                    className={`cursor-pointer text-xl ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !isLocked && setShowPassword((preve) => !preve)}
                                >
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
                        </div>

                        {/* reCAPTCHA Widget */}
                        <div className='mt-4 flex justify-center'>
                            <ReCAPTCHA
                                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                onChange={handleCaptchaChange}
                                onExpired={handleCaptchaExpired}
                                onError={handleCaptchaError}
                                theme="light"
                                size="normal"
                            />
                        </div>

                        {/* Captcha Error Message */}
                        {captchaError && (
                            <div className='text-center mt-2'>
                                <p className='text-red-600 text-sm'>{captchaError}</p>
                            </div>
                        )}

                        <button
                            className={`px-6 py-2 w-full max-w-[150px] rounded-full text-white mx-auto block mt-6 transition-all duration-200 ${isLocked || isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 hover:scale-110'
                                }`}
                            disabled={isLocked || isLoading}
                        >
                            {isLoading ? 'Signing In...' : isLocked ? `Locked (${formatTime(lockoutTimer)})` : 'Login'}
                        </button>

                        {/* Additional Security Info */}
                        {isLocked && (
                            <div className='text-center mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded'>
                                <p className='text-xs text-yellow-700'>
                                    🛡️ Security measure: Account locked for 5 minutes after 5 failed attempts
                                </p>
                            </div>
                        )}

                        {/* Remaining Attempts Info */}
                        {showAttemptsWarning && !isLocked && (
                            <div className='text-center mt-4 p-3 bg-orange-50 border border-orange-200 rounded'>
                                <p className='text-xs text-orange-700'>
                                    ⚠️ Warning: {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} left before 5-minute lockout
                                </p>
                            </div>
                        )}

                    </form>

                    <p className='my-5'>Don't have account ? <Link to={"/sign-up"} className=' text-red-600 hover:text-red-700 hover:underline'>Sign up</Link></p>
                </div>

            </div>
        </section>
    )
}

export default Login